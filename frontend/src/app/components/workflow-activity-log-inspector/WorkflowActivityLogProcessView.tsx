import { ReactFlow, Controls, Background, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, BoxProps, Button, ButtonGroup, ButtonGroupProps } from '@chakra-ui/react';
import { GroupedLogItem } from '../../utils/workflow-activity-log-inspector/WorkflowActivityLogHelper';
import useWorkflowActivityLogProcessView from '../../hooks/workflow-activity-log-inspector/useWorkflowActivityLogProcessView';
import { TOP_TO_BOTTOM, LEFT_TO_RIGHT } from '../../utils/workflow-activity-log-inspector/WorkflowActivityLogHelper';

interface WorkflowActivityLogProcessViewProps {
    groupedLogItems: GroupedLogItem[];
    onNodeClick?: (item: GroupedLogItem | null) => void;
    selectedLogItem?: GroupedLogItem | null;
}

export default function WorkflowActivityLogProcessView({
    groupedLogItems,
    onNodeClick,
    selectedLogItem,
}: WorkflowActivityLogProcessViewProps) {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        handleNodeClick,
        layoutDirection,
        setLayoutDirection,
        colorMode,
        backgroundColor,
    } = useWorkflowActivityLogProcessView({ groupedLogItems, selectedLogItem, onNodeClick });

    return (
        <Box {...ProcessViewContainerStyle}>
            {/*
             * React Flow renderer + its built-in overlay components (Controls, Background, Panel):
             *   - <ReactFlow>:  https://reactflow.dev/api-reference/react-flow
             *   - <Controls>:   https://reactflow.dev/api-reference/components/controls
             *   - <Background>: https://reactflow.dev/api-reference/components/background
             *   - <Panel>:      https://reactflow.dev/api-reference/components/panel
             */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                fitView
                minZoom={0.1}
                maxZoom={4}
                colorMode={colorMode}
                style={{ backgroundColor }}
            >
                <Panel position='top-right'>
                    <ButtonGroup {...LayoutButtonGroupStyle}>
                        <Button
                            onClick={() => setLayoutDirection(TOP_TO_BOTTOM)}
                            backgroundColor={
                                layoutDirection === TOP_TO_BOTTOM ? 'veeva_light_gray_color_mode' : 'white_color_mode'
                            }
                        >
                            Vertical
                        </Button>
                        <Button
                            onClick={() => setLayoutDirection(LEFT_TO_RIGHT)}
                            backgroundColor={
                                layoutDirection === LEFT_TO_RIGHT ? 'veeva_light_gray_color_mode' : 'white_color_mode'
                            }
                        >
                            Horizontal
                        </Button>
                    </ButtonGroup>
                </Panel>
                <Controls />
                <Background color={colorMode === 'dark' ? GridColor.dark : GridColor.light} gap={16} />
            </ReactFlow>
        </Box>
    );
}

const ProcessViewContainerStyle: BoxProps = {
    height: '100%',
    width: '100%',
    position: 'relative',
    backgroundColor: 'white_color_mode',
};

const LayoutButtonGroupStyle: ButtonGroupProps = {
    size: 'sm',
    attached: true,
    variant: 'solid',
    backgroundColor: 'white_color_mode',
    shadow: 'sm',
    borderRadius: 'md',
};

// React Flow's Background grid color is plain CSS, so the light/dark hex codes live here as raw values.
const GridColor = { light: '#ccc', dark: '#555' };
