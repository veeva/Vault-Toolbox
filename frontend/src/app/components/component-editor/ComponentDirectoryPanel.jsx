import { Stack, Box, Heading, Divider, Tooltip, IconButton, Progress } from '@chakra-ui/react';
import { Panel } from 'react-resizable-panels';
import { PiArrowClockwise } from 'react-icons/pi';
import VerticalResizeHandle from '../shared/VerticalResizeHandle';
import ComponentTree from './ComponentTree';
import ApiErrorMessageCard from '../shared/ApiErrorMessageCard';

export default function ComponentDirectoryPanel({ retrieveComponentTree, loadingComponentTree, selectedComponent, setSelectedComponent, componentTree, onSelect, componentTreeError }) {

    return (
        <>
            <VerticalResizeHandle />
            <Panel 
                id='component-tree-panel' 
                order={2}
                defaultSizePercentage={30}
                minSizePercentage={10}
                maxSizePercentage={50}
            >
                <Stack {...ParentStackStyle}>
                    <Box position='sticky'>
                        <Heading {...HeadingStyle}>Component Directory</Heading>
                        <Divider {...HorizontalDividerStyle} />
                        <Tooltip label='Reload Component Directory' placement='right'>
                            <IconButton icon={<PiArrowClockwise size={20} style={{ margin: '4px' }} />} onClick={retrieveComponentTree} {...RefreshIconButtonStyle} />
                        </Tooltip>
                    </Box>
                    { componentTreeError ? <ApiErrorMessageCard content='component directory' errorMessage={componentTreeError} />
                        : loadingComponentTree ? <Progress size='sm' isIndeterminate />
                            : (
                                <Box {...ComponentTreeBoxStyle}>
                                    <ComponentTree selectedComponent={selectedComponent} setSelectedComponent={setSelectedComponent} componentTree={componentTree[0]} onSelect={onSelect} />
                                </Box>
                            )
                    }
                </Stack>
            </Panel>
            <Divider {...VerticalDividerStyle} />
        </>
    );
}

const ParentStackStyle = {
    height: '100%',
    flex: '0 0',
    backgroundColor: 'white.color_mode'
};

const HeadingStyle = {
    color: 'veeva_orange.color_mode',
    size: 'md',
    margin: '5px'
};

const HorizontalDividerStyle = {
    borderColor: 'veeva_light_gray.500',
    borderWidth: '1px'
};

const RefreshIconButtonStyle = {
    size: 'auto',
    borderRadius: '6px',
    margin: '5px'
};

const ComponentTreeBoxStyle = {
    paddingX: 3,
    overflow: 'auto'
};

const VerticalDividerStyle = {
    orientation: 'vertical',
    borderColor: 'veeva_light_gray.500',
    height: 'auto',
    borderWidth: '1px'
};
