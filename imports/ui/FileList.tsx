import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React, { ReactElement, ReactNode, useMemo } from 'react';
import { Box } from 'grommet/components/Box';
import { Heading } from 'grommet/components/Heading';
import { DataTable, DataTableProps } from 'grommet/components/DataTable';
import formatFileSize from 'filesize';
import { Files, File } from '/imports/api/files';
import FileUpload from './FileUpload';

export function renderFileSizeColumnCell(file: File): ReactNode {
    return formatFileSize(file.size, {
        // Minimum size unit is MB.
        exponent: 2,
    });
}

export function renderCreatedAtColumnCell(file: File): ReactNode {
    return file.createdAt.toLocaleString();
}

export function renderModifiedAtColumnCell(file: File): ReactNode {
    return file.modifiedAt.toLocaleString();
}

export const FileList = (): ReactElement => {
    const { files } = useTracker(() => {
        // The publication must also be secure
        const subscription = Meteor.subscribe('proto-files');

        return {
            isLoading: !subscription.ready(),
            files: Files.find().fetch(),
        };
    }, []);

    const filesTableColumns: DataTableProps['columns'] = useMemo(
        () => [
            {
                property: 'name',
                header: 'Name',
                primary: true,
            },
            {
                property: 'size',
                header: 'Size',
                render: renderFileSizeColumnCell,
                size: 'xsmall',
            },
            {
                property: 'createdAt',
                header: 'Created at',
                render: renderCreatedAtColumnCell,
                size: 'small',
            },
            {
                property: 'modifiedAt',
                header: 'Modified at',
                render: renderModifiedAtColumnCell,
                size: 'small',
            },
        ],
        [],
    );

    return (
        <Box>
            <FileUpload />

            <Heading level={2}>Files</Heading>
            <DataTable columns={filesTableColumns} data={files} />
        </Box>
    );
};

export default FileList;
