import { Flex, Box, Tabs, Separator, Skeleton, Text, Spacer } from '@chakra-ui/react';
import { useState } from 'react';
import { PanelGroup, Panel } from 'react-resizable-panels';
import {
    setupVqlLanguage,
    vqlLanguageID,
    VqlLightModeTheme,
    VqlDarkModeTheme,
} from '../../utils/vql-editor/VqlLanguageDefinition';
import CodeEditor from '../shared/CodeEditor';
import HorizontalResizeHandle from '../shared/HorizontalResizeHandle';
import { useColorMode } from '../shared/ui-components/color-mode';
import VqlConsole from './VqlConsole';
import VqlSavedQueriesContainer from './VqlSavedQueriesContainer';

export default function VqlEditorIsland({
    consoleOutput,
    code,
    setCode,
    queryDescribe,
    getSubqueryFieldCount,
    isPicklist,
    isPrimaryFieldRichText,
    getMaxRowSize,
    isDownloading,
    isExecutingApiCall,
    nextPage,
    previousPage,
    queryNextPage,
    queryPreviousPage,
    isPrimaryFieldString,
    isSubqueryObject,
}) {
    const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
    const { colorMode } = useColorMode();

    // Setup the VQL Language
    setupVqlLanguage();

    return (
        <Flex {...ParentFlexStyle}>
            <PanelGroup direction='vertical' autoSaveId='VqlEditorIsland-PanelGroup'>
                <Panel defaultSize={40} minSize={10}>
                    <Flex flexDirection='column' height='100%' width='100%'>
                        <Flex alignItems='center' borderBottom='solid 3px' borderBottomColor='gray.400'>
                            <Tabs.Root {...TabsStyle} defaultValue='vql'>
                                <Tabs.List {...TabListStyle} flexGrow={1}>
                                    <Tabs.Trigger {...TabStyle} value='vql'>
                                        <Flex width='180px' alignItems='center' justifyContent='center'>
                                            VQL
                                        </Flex>
                                    </Tabs.Trigger>
                                </Tabs.List>
                                <Tabs.Indicator {...TabIndicatorStyle} />
                            </Tabs.Root>
                            <Spacer />
                            <VqlSavedQueriesContainer code={code} setCode={setCode} />
                        </Flex>
                        <Box flex={1} overflow='auto'>
                            <CodeEditor
                                code={code}
                                setCode={setCode}
                                language={vqlLanguageID}
                                theme={colorMode === 'light' ? VqlLightModeTheme : VqlDarkModeTheme}
                            />
                        </Box>
                    </Flex>
                </Panel>
                <Separator border='1px solid' borderColor='veeva_light_gray_color_mode' />
                <HorizontalResizeHandle
                    backgroundColor='veeva_sunset_yellow.ten_percent_opacity'
                    isCollapsed={isConsoleCollapsed}
                />
                <Panel
                    collapsible
                    collapsedSize={0}
                    minSize={10}
                    onCollapse={() => setIsConsoleCollapsed(true)}
                    onExpand={() => setIsConsoleCollapsed(false)}
                >
                    <Flex flexDirection='column' height='100%'>
                        <Box {...ConsoleBoxStyle}>
                            <Skeleton loading={isExecutingApiCall} height='100%'>
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
    margin: '0px 0px 5px 0px',
    borderRadius: '8px',
    backgroundColor: 'white_color_mode',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)',
};

const TabsStyle = {
    flex: 'none',
    position: 'relative',
    variant: 'plain',
    size: 'lg',
    height: 'auto',
};

const TabListStyle = {
    height: '60px',
    width: '100%',
};

const TabStyle = {
    color: 'veeva_orange_color_mode',
    fontSize: 'xl',
    width: '180px',
    height: '100%',
    background: 'transparent',
};

const TabIndicatorStyle = {
    width: '180px',
    height: '3px',
    backgroundColor: 'veeva_orange_color_mode',
    zIndex: 1,
};

const ConsoleBoxStyle = {
    flex: 1,
    backgroundColor: 'white_color_mode',
    fontSize: 'medium',
    position: 'relative',
    overflow: 'auto',
    borderBottomRadius: '8px',
};

const SendingRequestTextStyle = {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontWeight: 'bold',
    fontSize: 'large',
};
