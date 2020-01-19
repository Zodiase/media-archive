import React, { ReactElement, useCallback } from 'react';
import { Box } from 'grommet/components/Box';
import { Heading } from 'grommet/components/Heading';
import { List } from 'grommet/components/List';
import { withTracker } from 'meteor/react-meteor-data';
import { Links, Link } from '../api/links';

const Info = ({ links }: { links: Link[] }): ReactElement => {
    const useListItem = useCallback((link: Link) => {
        return (
            <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.title}
            </a>
        );
    }, []);

    return (
        <Box>
            <Heading level={2}>Learn Meteor!</Heading>
            <List data={links}>{useListItem}</List>
        </Box>
    );
};

export default withTracker(() => {
    return {
        links: Links.find().fetch(),
    };
})(Info);
