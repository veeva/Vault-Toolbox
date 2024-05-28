import { Flex, Box, Tabs, TabList, Tab, TabIndicator, Divider, Skeleton, Text, useColorMode } from '@chakra-ui/react';
import { PanelGroup, Panel } from 'react-resizable-panels';
import { useState } from 'react';
import CodeEditor from '../shared/CodeEditor';
import { setupVqlLanguage, vqlLanguageID, VqlLightModeTheme, VqlDarkModeTheme } from './VqlLanguageDefinition';
import HorizontalResizeHandle from '../shared/HorizontalResizeHandle';
import VqlConsole from './VqlConsole';

export default function VqlEditorIsland({ consoleOutput, code, setCode, queryDescribe, getSubqueryFieldCount, isPicklist, isPrimaryFieldRichText, getMaxRowSize, isDownloading, isExecutingApiCall, nextPage, previousPage, queryNextPage, queryPreviousPage, isPrimaryFieldString, isSubqueryObject }) {
    const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
    const { colorMode } = useColorMode();

    // Setup the VQL Language
    setupVqlLanguage();

    return (
        <Flex {...ParentFlexStyle}>
            <PanelGroup direction='vertical'>
                <Panel defaultSizePercentage={40} minSizePercentage={10}>
                    <Flex flexDirection='column' height='100%' width='100%'>
                        <Tabs {...TabsStyle}>
                            <TabList {...TabListStyle}>
                                <Box width='180px'>
                                    <Tab {...TabStyle}>
                                        VQL
                                    </Tab>
                                </Box>
                            </TabList>
                            <TabIndicator {...TabIndicatorStyle} />
                        </Tabs>
                        <Box flex={1} overflow={'auto'}>
                            <CodeEditor
                                code={code}
                                setCode={setCode}
                                language={vqlLanguageID}
                                theme={colorMode === 'light' ? VqlLightModeTheme : VqlDarkModeTheme}
                            />
                        </Box>
                    </Flex>
                </Panel>
                <Divider border='1px solid thin' />
                <HorizontalResizeHandle
                    backgroundColor='veeva_sunset_yellow.ten_percent_opacity'
                    isCollapsed={isConsoleCollapsed}
                />
                <Panel collapsible collapsedSizePercentage={0} minSizePercentage={10} onCollapse={() => setIsConsoleCollapsed(true)} onExpand={() => setIsConsoleCollapsed(false)}>
                    <Flex flexDirection='column' height='100%'>
                        <Box {...ConsoleBoxStyle}>
                            <Skeleton isLoaded={!isExecutingApiCall} height='100%'>
                                <VqlConsole
                                    consoleOutput={consoleOutput}
                                    queryDescribe={queryDescribe}
                                    getSubqueryFieldCount={getSubqueryFieldCount}
                                    isPicklist={isPicklist}
                                    isPrimaryFieldRichText={isPrimaryFieldRichText}
                                    isPrimaryFieldString={isPrimaryFieldString}
                                    isSubqueryObject={isSubqueryObject}
                                    getMaxRowSize={getMaxRowSize}
                                    isDownloading={isDownloading}
                                    nextPage={nextPage}
                                    previousPage={previousPage}
                                    queryNextPage={queryNextPage}
                                    queryPreviousPage={queryPreviousPage}
                                />
                            </Skeleton>
                            {isExecutingApiCall && <Text {...SendingRequestTextStyle}>Sending request...</Text>}
                        </Box>
                    </Flex>
                </Panel>
            </PanelGroup>
        </Flex>
    );
}

const ParentFlexStyle = {
    height: '100%',
    width: 'calc(100% - 20px)',
    margin: '0px',
    borderRadius: '8px',
    backgroundColor: 'white.color_mode',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)'
};

const TabsStyle = {
    flex: 'none',
    position: 'relative',
    variant: 'unstyled',
    size: 'lg',
    minHeight: 'auto'
};

const TabListStyle = {
    height: '60px',
    borderBottom: 'solid 3px',
    borderBottomColor: 'gray.400'
};

const TabStyle = {
    color: 'veeva_orange.color_mode',
    fontSize: 'xl',
    width: '180px'
};

const TabIndicatorStyle = {
    marginTop: '-3px',
    height: '3px',
    backgroundColor: 'veeva_orange.color_mode'
};

const ConsoleBoxStyle = {
    flex: 1,
    backgroundColor: 'white.color_mode',
    fontSize: 'medium',
    position: 'relative',
    overflow: 'auto',
    borderBottomRadius: '8px'
};

const SendingRequestTextStyle = {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontWeight: 'bold',
    fontSize: 'large'
};
