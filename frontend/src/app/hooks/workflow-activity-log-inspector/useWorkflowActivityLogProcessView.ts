import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from '@xyflow/react';
import { useColorMode, useColorModeValue } from '../../components/shared/ui-components/color-mode';
import {
    buildProcessGraph,
    applyDagreLayout,
    findStepByNodeId,
    TOP_TO_BOTTOM,
    type GraphLayoutDirection,
    type GroupedLogItem,
} from '../../utils/workflow-activity-log-inspector/WorkflowActivityLogHelper';

interface UseWorkflowActivityLogProcessViewProps {
    groupedLogItems: GroupedLogItem[];
    selectedLogItem?: GroupedLogItem | null;
    onNodeClick?: (item: GroupedLogItem | null) => void;
}

/**
 * Drives the React Flow process view: keeps the laid-out nodes/edges in sync with the workflow's
 * steps and the chosen layout direction, exposes the node-click handler, and surfaces the color-mode
 * values React Flow needs. All pure graph construction lives in WorkflowActivityLogHelper.
 */
export default function useWorkflowActivityLogProcessView({
    groupedLogItems,
    selectedLogItem,
    onNodeClick,
}: UseWorkflowActivityLogProcessViewProps) {
    // React Flow node/edge state (with their built-in change handlers):
    //   useNodesState: https://reactflow.dev/api-reference/hooks/use-nodes-state
    //   useEdgesState: https://reactflow.dev/api-reference/hooks/use-edges-state
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    // Whether the graph flows top-to-bottom (vertical) or left-to-right (horizontal).
    const [layoutDirection, setLayoutDirection] = useState<GraphLayoutDirection>(TOP_TO_BOTTOM);

    const { colorMode } = useColorMode();
    const backgroundColor = useColorModeValue('white', '#303841');

    /**
     * React Flow node-click handler: maps the clicked node back to its log item and notifies the parent.
     */
    const handleNodeClick = useCallback(
        (_event: MouseEvent, node: Node) => {
            const step = findStepByNodeId(groupedLogItems, node.id);
            if (step && onNodeClick) {
                onNodeClick(step);
            }
        },
        [groupedLogItems, onNodeClick],
    );

    // Rebuild + re-layout the graph whenever the steps, selection, or layout direction change.
    useEffect(() => {
        const { nodes: builtNodes, edges: builtEdges } = buildProcessGraph(groupedLogItems, selectedLogItem?.id);
        const { nodes: positionedNodes, edges: positionedEdges } = applyDagreLayout(
            builtNodes,
            builtEdges,
            layoutDirection,
        );
        setNodes(positionedNodes);
        setEdges(positionedEdges);
    }, [groupedLogItems, selectedLogItem, layoutDirection, setNodes, setEdges]);

    return {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        handleNodeClick,
        layoutDirection,
        setLayoutDirection,
        colorMode,
        backgroundColor,
    };
}
