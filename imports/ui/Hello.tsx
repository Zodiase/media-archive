import React from 'react';
import { Box } from 'grommet/components/Box';
import { Button } from 'grommet/components/Button';
import { Paragraph } from 'grommet/components/Paragraph';

export default class Hello extends React.Component {
  state = {
    counter: 0,
  }

  increment() {
    this.setState({
      counter: this.state.counter + 1
    });
  }

  render() {
    return (
      <Box>
        <Button onClick={() => this.increment()} alignSelf="start" primary>Click Me</Button>
        <Paragraph>You've pressed the button {this.state.counter} times.</Paragraph>
      </Box>
    );
  }
}
