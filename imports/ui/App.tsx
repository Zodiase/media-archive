import React from 'react';
import { Grommet } from 'grommet/components/Grommet';
import { Main } from 'grommet/components/Main';
import { Heading } from 'grommet/components/Heading';
import Hello from './Hello';
import FileList from './FileList';

export default () => (
    <Grommet>
        <Main>
            <Heading>Welcome to Meteor!</Heading>
            <Hello />
            <FileList />
        </Main>
    </Grommet>
);
