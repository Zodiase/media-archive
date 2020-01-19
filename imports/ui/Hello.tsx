import React, { ReactElement, useState, useCallback } from 'react';
import { Box } from 'grommet/components/Box';
import { Button } from 'grommet/components/Button';
import { Paragraph } from 'grommet/components/Paragraph';

const Hello = (): ReactElement => {
    const [counter, setCounter] = useState(0);

    const increment = useCallback(() => {
        setCounter((count) => count + 1);
    }, []);

    return (
        <Box>
            <Button onClick={increment} alignSelf="start" primary>
                Click Me
            </Button>
            <Paragraph>You&apos;ve pressed the button {counter} times.</Paragraph>
        </Box>
    );
};

export default Hello;
