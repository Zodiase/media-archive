import { useState } from 'react';
import { notImplemented } from '/imports/utility/noop';
import { FileChunkSize } from './fileChunk';
import { Mongo } from 'meteor/mongo';

/**
 * This interface describes a file upload task.
 */
export interface FileUploadTask {
    id: string;
    file: globalThis.File;
    state: 'pending' | 'uploading' | 'done' | 'error';
    // Progress is a number between 0 and 1.
    progress: number;
}

const createFileUploadTask = (file: globalThis.File): FileUploadTask => ({
    id: new Mongo.ObjectID().toHexString(),
    file,
    state: 'pending',
    progress: 0,
});

interface FileUploadList {
    queuedTasks: FileUploadTask[];
    firstPendingTaskIndex: number;
}

interface QueuedFileUploadTaskList {
    firstPendingTask: FileUploadTask;
    queuedTasks: FileUploadTask[];
    onAddFilesToUpload: (files: globalThis.File[]) => void;
    onStartedUploadingFile: (file: globalThis.File) => void;
    onUpdateUploadProgress: (file: globalThis.File, progress: number) => void;
    onUploadedFile: (file: globalThis.File) => void;
}

const useQueuedFileUploadTaskList = (): QueuedFileUploadTaskList => {
    console.log('useQueuedFileUploadTaskList');
    const [fileUploadList, setFileUploadList] = useState<FileUploadList>(() => ({
        queuedTasks: [],
        firstPendingTaskIndex: 0,
    }));
    const { queuedTasks, firstPendingTaskIndex } = fileUploadList;

    const queueFilesToUpload = (files: globalThis.File[]) => {
        console.log('queueFilesToUpload', files);
        setFileUploadList((prev) => {
            const newTasks = files.map((file) => createFileUploadTask(file));
            const newQueuedTasks = [...prev.queuedTasks, ...newTasks];

            console.log(
                'queueFilesToUpload.newQueuedTasks',
                newQueuedTasks.map((task) => task.file.name),
            );
            return {
                queuedTasks: newQueuedTasks,
                firstPendingTaskIndex: prev.firstPendingTaskIndex,
            };
        });
    };

    const onAddFilesToUpload = (files: globalThis.File[]) => {
        queueFilesToUpload(files);
    };

    const updateTaskState = (task: FileUploadTask, state: FileUploadTask['state']): FileUploadTask => {
        if (task.state === state) {
            return task;
        }
        // When updating state, we need to create a new object to trigger a re-render.
        return {
            ...task,
            state,
        };
    };

    const updateTaskProgress = (task: FileUploadTask, progress: number): FileUploadTask => {
        if (task.progress === progress) {
            return task;
        }
        // When updating progress, we need to create a new object to trigger a re-render.
        return {
            ...task,
            progress,
        };
    };

    const onStartedUploadingFile = (file: globalThis.File) => {
        console.log('onStartedUploadingFile', file.name, file.size);
        setFileUploadList((prev) => {
            const newQueuedTasks = prev.queuedTasks.map(
                (task): FileUploadTask => {
                    if (task.file === file) {
                        return updateTaskState(task, 'uploading');
                    }
                    return task;
                },
            );
            return {
                queuedTasks: newQueuedTasks,
                firstPendingTaskIndex: prev.firstPendingTaskIndex,
            };
        });
    };

    const onUpdateUploadProgress = (file: globalThis.File, progress: number) => {
        console.log('onUpdateUploadProgress', file.name, progress);
        setFileUploadList((prev) => {
            const newQueuedTasks = prev.queuedTasks.map(
                (task): FileUploadTask => {
                    if (task.file === file) {
                        return updateTaskProgress(task, progress);
                    }
                    return task;
                },
            );
            return {
                queuedTasks: newQueuedTasks,
                firstPendingTaskIndex: prev.firstPendingTaskIndex,
            };
        });
    };

    const onUploadedFile = (file: globalThis.File) => {
        console.log('onUploadedFile', file.name, file.size);
        setFileUploadList((prev) => {
            const newQueuedTasks = prev.queuedTasks.map(
                (task): FileUploadTask => {
                    if (task.file === file) {
                        return updateTaskState(task, 'done');
                    }
                    return task;
                },
            );
            return {
                queuedTasks: newQueuedTasks,
                firstPendingTaskIndex: prev.firstPendingTaskIndex + 1,
            };
        });
    };

    const firstPendingTask = queuedTasks[firstPendingTaskIndex];

    return {
        firstPendingTask,
        queuedTasks,
        onAddFilesToUpload,
        onStartedUploadingFile,
        onUpdateUploadProgress,
        onUploadedFile,
    };
};

const useFileUploader = (queuedFileList: QueuedFileUploadTaskList) => {
    const currentTask = queuedFileList.firstPendingTask;

    if (currentTask && currentTask.state === 'pending') {
        queuedFileList.onStartedUploadingFile(currentTask.file);

        // Split file, read from FileReader, into chunks of chunkSize bytes.
        const readFileChunk = async (file: globalThis.File, chunkSize: number, offset: number) =>
            new Promise<ArrayBuffer>((resolve, reject) => {
                const r = new FileReader();
                const blob = file.slice(offset, offset + chunkSize);
                r.onload = (evt) => {
                    if (!evt.target) {
                        reject('No event target');
                        return;
                    }
                    if (evt.target.error) {
                        console.error('Error reading file: ', evt.target.error);
                        reject(evt.target.error);
                        return;
                    }

                    const chunk = evt.target.result as ArrayBuffer;
                    console.log('chunk', chunk.byteLength);
                    resolve(chunk);
                };
                r.readAsArrayBuffer(blob);
            });

        (async () => {
            const chunkSize = FileChunkSize;
            const chunkCount = Math.ceil(currentTask.file.size / chunkSize);
            let offset = 0;
            let chunkIndex = 0;

            while (offset < currentTask.file.size) {
                const chunk = await readFileChunk(currentTask.file, chunkSize, offset);
                console.log('uploading chunk', chunkIndex, chunkCount, chunk.byteLength);

                //TODO: upload chunk
                await new Promise((resolve) => setTimeout(resolve, 1000));

                offset += chunk.byteLength;
                chunkIndex += 1;
                const progress = offset / currentTask.file.size;
                queuedFileList.onUpdateUploadProgress(currentTask.file, progress);
            }

            queuedFileList.onUploadedFile(currentTask.file);
        })();
    }
};

export interface SegmentedFileUpload {
    fileUploadTasks: FileUploadTask[];
    onAddFilesToUpload: (files: globalThis.File[]) => void;
    onClearUploadedFiles: () => void;
}

export const useChunkedFileUpload = (): SegmentedFileUpload => {
    console.log('!!useSegmentedFileUpload');
    const queuedTaskList = useQueuedFileUploadTaskList();

    useFileUploader(queuedTaskList);

    return {
        fileUploadTasks: queuedTaskList.queuedTasks,
        onAddFilesToUpload: queuedTaskList.onAddFilesToUpload,
        onClearUploadedFiles: notImplemented('onClearUploadedFiles'),
    };
};
