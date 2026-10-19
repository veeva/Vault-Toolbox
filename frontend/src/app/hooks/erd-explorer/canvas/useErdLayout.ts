import { useCallback, useEffect, type RefObject } from 'react';
import { type Node, type Edge, type ReactFlowInstance } from '@xyflow/react';
import type { Dispatch, SetStateAction } from 'react';
import { applyErdLayout } from '../../../utils/erd-explorer/graph/ErdExplorerLayoutHelpers';
import { computeClusterTranslation } from '../../../utils/erd-explorer/graph/ErdExplorerGeometryHelpers';
import { isExternalTarget } from '../../../utils/erd-explorer/ErdExplorerHelper';
import type { ErdPositionMap } from '../../../utils/erd-explorer/ErdExplorerTypes';
import type { ErdObjectRecord } from '../useErdExplorerData';
import type useErdGraph from '../useErdGraph';

/**
 * Names awaiting layout once they've loaded + measured.
 * `mode: 'full'` re-tidies the whole canvas (see `tidyLayout`); the default scopes the reflow to
 * just `names` (+ `anchor`, which stays put as the translation reference) via `layoutNewCluster`.
 */
export interface PendingLayout {
    anchor: string | null;
    names: string[];
    mode?: 'cluster' | 'full';
}

interface UseErdLayoutParams {
    edges: Edge[];
    nodes: Node[];
    graph: ReturnType<typeof useErdGraph>;
    records: Record<string, ErdObjectRecord>;
    setNodes: Dispatch<SetStateAction<Node[]>>;
    pendingLayoutRef: RefObject<PendingLayout | null>;
    reactFlowRef: RefObject<ReactFlowInstance<Node, Edge> | null>;
}

/**
 * Provides `tidyLayout` (full canvas re-layout), and runs the pending-layout effect that lays out
 * newly-added objects — scoped to their cluster, or the whole canvas — once they have been measured.
 */
export function useErdLayout({ edges, nodes, graph, records, setNodes, pendingLayoutRef, reactFlowRef }: UseErdLayoutParams) {
    const tidyLayout = useCallback(() => {
        setNodes((previousNodes) => {
            const { nodes: laidOutNodes } = applyErdLayout(previousNodes, edges);
            const positionsMap: ErdPositionMap = {};
            laidOutNodes.forEach((node) => {
                positionsMap[node.id] = node.position;
            });
            graph.setPositions(positionsMap);
            return laidOutNodes;
        });
        // React Flow's own node store only reflects the new positions after it re-renders off the
        // setNodes above, so fitView needs a tick's delay — same deferral useErdPanToNewObjects uses.
        window.setTimeout(() => {
            reactFlowRef.current?.fitView({ padding: 0.2, duration: 300 });
        }, 50);
    }, [edges, graph, setNodes, reactFlowRef]);

    const layoutNewCluster = useCallback(
        (anchor: string | null, newNames: string[]) => {
            setNodes((previousNodes) => {
                const clusterIds = new Set<string>(anchor ? [anchor, ...newNames] : newNames);
                const clusterNodes = previousNodes.filter((node) => clusterIds.has(node.id));
                const clusterEdges = edges.filter(
                    (edge) => clusterIds.has(edge.source) && clusterIds.has(edge.target),
                );
                const { nodes: laidOutNodes } = applyErdLayout(clusterNodes, clusterEdges);
                const laidOutById = new Map(laidOutNodes.map((node) => [node.id, node]));

                let translateX = 0;
                let translateY = 0;
                if (anchor) {
                    const anchorPrevious = previousNodes.find((node) => node.id === anchor);
                    const anchorLaidOut = laidOutById.get(anchor);
                    if (!anchorPrevious || !anchorLaidOut) return previousNodes;
                    translateX = anchorPrevious.position.x - anchorLaidOut.position.x;
                    translateY = anchorPrevious.position.y - anchorLaidOut.position.y;
                } else {
                    const existingNodes = previousNodes.filter((node) => !clusterIds.has(node.id));
                    ({ translateX, translateY } = computeClusterTranslation(existingNodes, laidOutNodes));
                }

                const positionsMap: ErdPositionMap = {};
                const nextNodes = previousNodes.map((node) => {
                    if (node.id === anchor || !clusterIds.has(node.id)) return node;
                    const laidOutNode = laidOutById.get(node.id);
                    if (!laidOutNode) return node;
                    const position = {
                        x: laidOutNode.position.x + translateX,
                        y: laidOutNode.position.y + translateY,
                    };
                    positionsMap[node.id] = position;
                    return { ...node, position };
                });
                if (Object.keys(positionsMap).length > 0) graph.setPositions(positionsMap);
                return nextNodes;
            });
        },
        [edges, graph, setNodes],
    );

    // Run the pending tidy (scoped to the new cluster, or the whole canvas) once the newly-added
    // objects have loaded + been measured. External targets (Documents/Users/Groups) have no record
    // of their own, so they're ready as soon as they're measured.
    useEffect(() => {
        const pending = pendingLayoutRef.current;
        if (!pending) return;
        const clusterIds = new Set<string>(pending.anchor ? [pending.anchor, ...pending.names] : pending.names);
        const relevantNodes = nodes.filter((node) => clusterIds.has(node.id));
        if (relevantNodes.length === 0) return;
        const allReady = relevantNodes.every((node) => {
            const measured = !!node.measured?.width && !!node.measured?.height;
            if (isExternalTarget(node.id)) return measured;
            const record = records[node.id];
            return (record ? record.status !== 'loading' : false) && measured;
        });
        if (!allReady) return;
        pendingLayoutRef.current = null;
        if (pending.mode === 'full') tidyLayout();
        else layoutNewCluster(pending.anchor, pending.names);
    }, [nodes, records, layoutNewCluster, tidyLayout, pendingLayoutRef]);

    return { tidyLayout };
}
