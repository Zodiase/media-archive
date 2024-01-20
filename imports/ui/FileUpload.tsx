import React, { ReactElement, useMemo, useCallback, ReactNode } from 'react';
import { DataTableProps, DataTable } from 'grommet/components/DataTable';
import { Box } from 'grommet/components/Box';
import { Button } from 'grommet/components/Button';
import { Text } from 'grommet/components/Text';
import formatFileSize from 'filesize';
import useDropArea from '../utility/react-hooks/useDropArea';
import { FileUploadTask, useSegmentedFileUpload } from '../api/files/segmentedUploading';

export function renderFileSizeColumnCell(uploadTask: FileUploadTask): ReactNode {
    return formatFileSize(uploadTask.file.size, {
        // Minimum size unit is MB.
        exponent: 2,
    });
}

export const FileUpload = (): ReactElement => {
    const { fileUploadTasks, onAddFilesToUpload, onClearUploadedFiles } = useSegmentedFileUpload();
    const onDroppedFiles = useCallback((droppedFiles: globalThis.File[]) => {
        console.log('droppedFiles', droppedFiles);
        onAddFilesToUpload(droppedFiles);
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
                size: 'small',
            },
            {
                property: 'state',
                header: 'Upload State',
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
            {/* A toolbar with buttons */}
            <Box direction="row" justify="between">
                <Box direction="row" gap="small">
                    <Button label="Clear completed" onClick={onClearUploadedFiles} />
                </Box>
                <Box direction="row" gap="small">
                    {/* A button to pause uploading */}
                    {/* A button to cancel uploading */}
                </Box>
            </Box>

            {/* A table of files to be uploaded */}
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
