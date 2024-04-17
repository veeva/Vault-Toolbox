import { Flex, Box, Tabs, TabList, Tab, TabIndicator, Divider } from '@chakra-ui/react';
import { useState } from 'react';
import { PanelGroup, Panel } from 'react-resizable-panels';
import HorizontalResizeHandle from '../shared/HorizontalResizeHandle';
import DataFilesPanel from './DataFilesPanel';
import DataSelectionPanel from './DataSelectionPanel';

export default function DataToolsIsland({ dataType, setDataType, selectedOptions, setSelectedOptions }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <Flex {...ParentFlexStyle}>
            <PanelGroup direction='vertical'>
                <Panel defaultSizePercentage={60} minSizePercentage={10}>
                    <Flex flexDirection='column' height='100%' width='100%'>
                        <Tabs {...TabsStyle}>
                            <TabList {...TabListStyle}>
                                <Box width='180px'>
                                    <Tab {...TabStyle}>
                                        Select Data
                                    </Tab>
                                </Box>
                            </TabList>
                            <TabIndicator {...TabIndicatorStyle} />
                        </Tabs>
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
                <Divider border='1px solid thin' />
                <HorizontalResizeHandle
                    backgroundColor='veeva_sunset_yellow.ten_percent_opacity'
                    isCollapsed={isCollapsed}
                />
                <Panel collapsible collapsedSizePercentage={0} minSizePercentage={10} onCollapse={() => setIsCollapsed(true)} onExpand={() => setIsCollapsed(false)}>
                    <Flex flexDirection='column' height='100%'>
                        <Box style={ConsoleBoxStyle}>
                            <DataFilesPanel />
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
    margin: '-10px 0px 10px',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)'
};

const TabsStyle = {
    flex: '0 0 auto',
    position: 'relative',
    variant: 'unstyled',
    size: 'lg'
};

const TabListStyle = {
    height: '60px',
    borderBottom: 'solid 3px',
    borderBottomColor: 'gray.400'
};

const TabStyle = {
    color: 'veeva_orange.500',
    fontSize: 'xl',
    width: '180px'
};

const TabIndicatorStyle = {
    marginTop: '-3px',
    height: '3px',
    backgroundColor: 'veeva_orange.500'
};

const ConsoleBoxStyle = {
    flex: 1,
    backgroundColor: 'white.100',
    fontSize: 'medium',
    position: 'relative',
    overflow: 'auto',
    borderBottomRadius: '8px'
};
