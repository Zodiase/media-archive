import React, { ReactElement, useMemo, useCallback, ReactNode } from 'react';
import { DataTableProps, DataTable } from 'grommet/components/DataTable';
import { Box } from 'grommet/components/Box';
import { Button } from 'grommet/components/Button';
import { Text } from 'grommet/components/Text';
import { Meter } from 'grommet/components/Meter';
import formatFileSize from 'filesize';
import useDropArea from '../utility/react-hooks/useDropArea';
import { FileUploadTask, useChunkedFileUpload } from '../api/files';

export function renderFileSizeColumnCell(uploadTask: FileUploadTask): ReactNode {
    return formatFileSize(uploadTask.file.size, {
        // Minimum size unit is MB.
        exponent: 2,
    });
}

export const FileUpload = (): ReactElement => {
    const { fileUploadTasks, onAddFilesToUpload, onClearUploadedFiles } = useChunkedFileUpload();
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
                header: 'State',
                size: 'xsmall',
            },
            {
                property: 'progress',
                header: 'Progress',
                size: 'xsmall',
                render: (uploadTask: FileUploadTask) => (
                    <Box pad={{ vertical: 'xsmall' }} title={`Progress: ${(uploadTask.progress * 100).toFixed(1)}%`}>
                        <Meter
                            values={[{ value: uploadTask.state === 'done' ? 100 : uploadTask.progress * 100 }]}
                            thickness="small"
                            size="small"
                        />
                    </Box>
                ),
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

    console.log('fileUploadTasks', fileUploadTasks);

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
            </Box>

            {/* A table of files to be uploaded */}
            <DataTable primaryKey="id" columns={droppedFilesTableColumns} data={fileUploadTasks} />
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
