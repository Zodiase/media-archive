import React from 'react';
import { Grommet } from 'grommet/components/Grommet';
import { Main } from 'grommet/components/Main';
import { Heading } from 'grommet/components/Heading';
import Hello from './Hello';
import Info from './Info';

export default () => (
  <Grommet>
    <Main>
      <Heading>Welcome to Meteor!</Heading>
      <Hello />
      <Info />
    </Main>
  </Grommet>
);
