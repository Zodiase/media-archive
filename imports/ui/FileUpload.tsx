import React, { ReactElement, useMemo, useState, useCallback, ReactNode } from 'react';
import { DataTableProps, DataTable } from 'grommet/components/DataTable';
import { Box } from 'grommet/components/Box';
import { Text } from 'grommet/components/Text';
import formatFileSize from 'filesize';
import useDropArea from '../utility/react-hooks/useDropArea';

export interface FileUploadTask {
    file: globalThis.File;
    reader: FileReader;
}

export function renderFileSizeColumnCell(uploadTask: FileUploadTask): ReactNode {
    return formatFileSize(uploadTask.file.size, {
        // Minimum size unit is MB.
        exponent: 2,
    });
}

export const FileUpload = (): ReactElement => {
    const [fileUploadTasks, setFileUploadTasks] = useState<FileUploadTask[]>([]);
    const onDroppedFiles = useCallback((droppedFiles: globalThis.File[]) => {
        setFileUploadTasks((currentFileUploadTasks) => {
            const newFileUploadTasks = droppedFiles.map((droppedFile) => {
                return {
                    file: droppedFile,
                    reader: new FileReader(),
                };
            });

            return [...currentFileUploadTasks, ...newFileUploadTasks];
        });
    }, []);

    const droppedFilesTableColumns: DataTableProps['columns'] = useMemo(
        () => [
            {
                property: 'file.name',
                header: 'Name',
                primary: true,
            },
            {
                property: 'file.size',
                header: 'Size',
                render: renderFileSizeColumnCell,
                size: 'xsmall',
            },
            {
                property: 'file.type',
                header: 'Type',
                size: 'xsmall',
            },
        ],
        [],
    );

    const [bond, dropState] = useDropArea({
        onFiles: onDroppedFiles,
        onUri: (uri) => console.log('uri', uri),
        onText: (text) => console.log('text', text),
    });

    const dragAndDropHint = dropState.over ? 'Release to drop files' : 'Drop files here';

    return fileUploadTasks.length > 0 ? (
        <Box
            {...bond}
            elevation="large"
            height={{ min: 'small' }}
            margin="small"
            round="small"
            pad="small"
            justify="stretch"
        >
            <DataTable columns={droppedFilesTableColumns} data={fileUploadTasks} />
        </Box>
    ) : (
        <Box
            {...bond}
            elevation="large"
            height={{ min: 'small' }}
            margin="small"
            round="small"
            pad="small"
            justify="center"
        >
            <Text alignSelf="center" as="label" style={{ pointerEvents: 'none' }}>
                {dragAndDropHint}
            </Text>
        </Box>
    );
};

export default FileUpload;
