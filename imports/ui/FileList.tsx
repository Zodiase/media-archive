import { Meteor } from 'meteor/meteor';
import React, { ReactElement, useCallback } from 'react';
import { Box } from 'grommet/components/Box';
import { Heading } from 'grommet/components/Heading';
import { List } from 'grommet/components/List';
import { useTracker } from 'meteor/react-meteor-data';
import { Files, File } from '/imports/api/files';

export const FileList = (): ReactElement => {
    const { files } = useTracker(() => {
        // The publication must also be secure
        const subscription = Meteor.subscribe('proto-files');

        return {
            isLoading: !subscription.ready(),
            files: Files.find().fetch(),
        };
    }, []);

    const useListItem = useCallback((file: File) => {
        return (
            <a href="#" target="_blank" rel="noopener noreferrer">
                {file.name}
            </a>
        );
    }, []);

    return (
        <Box>
            <Heading level={2}>Learn Meteor!</Heading>
            <List data={files}>{useListItem}</List>
        </Box>
    );
};

export default FileList;
