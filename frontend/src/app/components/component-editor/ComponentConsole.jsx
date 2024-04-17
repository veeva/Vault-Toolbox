import { Flex, Box, TabIndicator, Tabs, TabList, Tab, TabPanels, TabPanel, Spacer } from '@chakra-ui/react';
import JsonSyntaxHighlighter from '../shared/JsonSyntaxHighlighter';

export default function ComponentConsole({ consoleOutput }) {
    return (
        <Tabs {...ComponentConsoleTabsStyle}>
            <Flex flexDirection='column' height='100%'>
                { consoleOutput
                    ? (
                        <TabPanels>
                            <TabPanel backgroundColor='veeva_sunset_yellow.five_percent_opacity'>
                                <JsonSyntaxHighlighter dataToDisplay={consoleOutput} />
                            </TabPanel>
                        </TabPanels>
                    )
                    : null}
                <Spacer backgroundColor='veeva_sunset_yellow.five_percent_opacity' />
                <Box {...TabBoxStyle}>
                    <TabList {...TabListStyle}>
                        <Box width='180px'>
                            <Tab {...TabLabelStyle}>Response</Tab>
                        </Box>
                        <TabIndicator {...TabIndicatorStyle} />
                    </TabList>
                </Box>
            </Flex>
        </Tabs>
    );
}

const ComponentConsoleTabsStyle = {
    variant: 'unstyled',
    position: 'relative',
    colorScheme: 'veeva_orange',
    size: 'lg',
    height: '100%'
};

const TabListStyle = {
    flex: 1,
    height: '60px',
    borderTop: 'solid 3px',
    borderTopColor: 'gray.400',
    borderBottomRadius: '8px'
};

const TabBoxStyle = {
    backgroundColor: 'white',
    position: 'sticky',
    bottom: '0',
    borderBottomRadius: '8px'
};

const TabLabelStyle = {
    fontSize: 'xl',
    color: 'veeva_orange.500',
    borderBottom: 'none',
    borderBottomRadius: '8px',
    width: '180px'
};

const TabIndicatorStyle = {
    marginTop: '-3px',
    height: '3px',
    backgroundColor: 'veeva_orange.500'
};
