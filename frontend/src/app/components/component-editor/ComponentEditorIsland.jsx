import { Flex, Box, Tabs, Separator, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { PanelGroup, Panel } from 'react-resizable-panels';
import {
    setupMdlLanguage,
    mdlLanguageID,
    MdlLightModeTheme,
    MdlDarkModeTheme,
} from '../../utils/component-editor/MdlLanguageDefinition';
import CodeEditor from '../shared/CodeEditor';
import HorizontalResizeHandle from '../shared/HorizontalResizeHandle';
import { useColorMode } from '../shared/ui-components/color-mode';
import { Skeleton } from '../shared/ui-components/skeleton';
import ComponentConsole from './ComponentConsole';

export default function ComponentEditorIsland({ consoleOutput, code, setCode, isExecutingApiCall }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { colorMode } = useColorMode();

    // Setup the MDL Language
    setupMdlLanguage();

    return (
        <Flex {...ParentFlexStyle}>
            <PanelGroup direction='vertical' autoSaveId='ComponentEditorIsland-PanelGroup'>
                <Panel defaultSize={70} minSize={30}>
                    <Flex flexDirection='column' height='100%' width='100%'>
                        <Tabs.Root {...TabsStyle} defaultValue='mdl'>
                            <Tabs.List {...TabListStyle}>
                                <Tabs.Trigger {...TabStyle} value='mdl'>
                                    <Flex width='180px' alignItems='center' justifyContent='center'>
                                        MDL
                                    </Flex>
                                </Tabs.Trigger>
                            </Tabs.List>
                            <Tabs.Indicator {...TabIndicatorStyle} />
                        </Tabs.Root>
                        <Box flex={1} overflow='auto'>
                            <CodeEditor
                                code={code}
                                setCode={setCode}
                                language={mdlLanguageID}
                                theme={colorMode === 'light' ? MdlLightModeTheme : MdlDarkModeTheme}
                            />
                        </Box>
                    </Flex>
                </Panel>
                <Separator border='1px solid' borderColor='veeva_light_gray_color_mode' />
                <HorizontalResizeHandle
                    backgroundColor='veeva_sunset_yellow.ten_percent_opacity'
                    isCollapsed={isCollapsed}
                />
                <Panel
                    collapsible
                    collapsedSize={0}
                    minSize={10}
                    onCollapse={() => setIsCollapsed(true)}
                    onExpand={() => setIsCollapsed(false)}
                >
                    <Flex flexDirection='column' height='100%'>
                        <Box {...ConsoleBoxStyle}>
                            <Skeleton loading={isExecutingApiCall} height='100%'>
                                <ComponentConsole consoleOutput={consoleOutput} />
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
    minHeight: 'auto',
};

const TabListStyle = {
    height: '60px',
    width: '100%',
    borderBottom: 'solid 3px',
    borderBottomColor: 'gray.400',
};

const TabStyle = {
    color: 'veeva_orange_color_mode',
    fontSize: 'xl',
    width: '180px',
    height: '100%',
    background: 'transparent',
};

const TabIndicatorStyle = {
    marginTop: '-3px',
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
