import { useState } from 'react';
import { notImplemented } from '/imports/utility/noop';

/**
 * This interface describes a file upload task.
 */
export interface FileUploadTask {
    file: globalThis.File;
    state: 'pending' | 'uploading' | 'done' | 'error';
}

const createFileUploadTask = (file: globalThis.File): FileUploadTask => ({
    file,
    state: 'pending',
});

interface FileUploadList {
    queuedTasks: FileUploadTask[];
    firstPendingTaskIndex: number;
}

interface QueuedFileUploadTaskList {
    firstPendingTask: FileUploadTask;
    queuedTasks: FileUploadTask[];
    onAddFilesToUpload: (files: globalThis.File[]) => void;
    onUploadedFile: (file: globalThis.File) => void;
    onStartedUploadingFile: (file: globalThis.File) => void;
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
        onUploadedFile,
    };
};

const useFileUploader = (queuedFileList: QueuedFileUploadTaskList) => {
    const currentTask = queuedFileList.firstPendingTask;

    if (currentTask && currentTask.state === 'pending') {
        queuedFileList.onStartedUploadingFile(currentTask.file);
        //TODO: Upload the file.
        setTimeout(() => {
            // ...
            // When the file is uploaded, call:
            queuedFileList.onUploadedFile(currentTask.file);
        }, 3000);
    }
};

export interface SegmentedFileUpload {
    fileUploadTasks: FileUploadTask[];
    onAddFilesToUpload: (files: globalThis.File[]) => void;
    onClearUploadedFiles: () => void;
}

export const useSegmentedFileUpload = (): SegmentedFileUpload => {
    console.log('!!useSegmentedFileUpload');
    const queuedTaskList = useQueuedFileUploadTaskList();

    useFileUploader(queuedTaskList);

    return {
        fileUploadTasks: queuedTaskList.queuedTasks,
        onAddFilesToUpload: queuedTaskList.onAddFilesToUpload,
        onClearUploadedFiles: notImplemented('onClearUploadedFiles'),
    };
};
