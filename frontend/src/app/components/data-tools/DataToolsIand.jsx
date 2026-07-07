import { Flex, Box, Tabs, Separator } from '@chakra-ui/react';
import { useState } from 'react';
import { PanelGroup, Panel } from 'react-resizable-panels';
import HorizontalResizeHandle from '../shared/HorizontalResizeHandle';
import DataFilesPanel from './DataFilesPanel';
import DataSelectionPanel from './DataSelectionPanel';

export default function DataToolsIsland({
    dataType,
    setDataType,
    selectedOptions,
    setSelectedOptions,
    vaultToolboxPath,
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <Flex {...ParentFlexStyle}>
            <PanelGroup direction='vertical'>
                <Panel defaultSize={60} minSize={10}>
                    <Flex flexDirection='column' height='100%' width='100%'>
                        <Tabs.Root {...TabsStyle} defaultValue='selectData'>
                            <Tabs.List {...TabListStyle}>
                                <Tabs.Trigger {...TabStyle} value='selectData'>
                                    <Flex width='180px' alignItems='center' justifyContent='center'>
                                        Select Data
                                    </Flex>
                                </Tabs.Trigger>
                            </Tabs.List>
                            <Tabs.Indicator {...TabIndicatorStyle} />
                        </Tabs.Root>
                        <Box flex='1 1 auto' overflow='auto'>
                            <DataSelectionPanel
                                dataType={dataType}
                                setDataType={setDataType}
                                selectedOptions={selectedOptions}
                                setSelectedOptions={setSelectedOptions}
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
                        <Box style={ConsoleBoxStyle}>
                            <DataFilesPanel vaultToolboxPath={vaultToolboxPath} />
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
    flex: '0 0 auto',
    position: 'relative',
    variant: 'unstyled',
    size: 'lg',
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
};

const TabIndicatorStyle = {
    marginTop: '-3px',
    height: '3px',
    width: '180px',
    backgroundColor: 'veeva_orange_color_mode',
    zIndex: 1,
};

const ConsoleBoxStyle = {
    flex: 1,
    backgroundColor: 'white.100',
    fontSize: 'medium',
    position: 'relative',
    overflow: 'auto',
    borderBottomRadius: '8px',
};
