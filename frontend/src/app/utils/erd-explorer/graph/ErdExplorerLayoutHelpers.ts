import { Position, type Node, type Edge } from '@xyflow/react';
import dagre from 'dagre';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;

// dagre `rankdir` values: https://github.com/dagrejs/dagre/wiki#configuring-the-layout
export type ErdLayoutDirection = 'TB' | 'LR';
export const TOP_TO_BOTTOM: ErdLayoutDirection = 'TB';
export const LEFT_TO_RIGHT: ErdLayoutDirection = 'LR';

function nodeDimensions(node: Node): { width: number; height: number } {
    return {
        width: node.measured?.width ?? (typeof node.width === 'number' ? node.width : NODE_WIDTH),
        height: node.measured?.height ?? (typeof node.height === 'number' ? node.height : NODE_HEIGHT),
    };
}

/**
 * Assign positions to ERD nodes with dagre (top-to-bottom). Uses each node's REAL rendered size
 * (React Flow's `measured` dimensions when available) so variable-height auto-sized nodes don't overlap,
 * and tunes node/rank separation so edges have room. Edges are returned unchanged; React Flow draws them.
 */
export function applyErdLayout(
    nodes: Node[],
    edges: Edge[],
    direction: ErdLayoutDirection = TOP_TO_BOTTOM,
): { nodes: Node[]; edges: Edge[] } {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === LEFT_TO_RIGHT;
    dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120, marginx: 40, marginy: 40 });

    const sizeById = new Map<string, { width: number; height: number }>();
    nodes.forEach((node) => {
        const size = nodeDimensions(node);
        sizeById.set(node.id, size);
        dagreGraph.setNode(node.id, size);
    });
    // Feed edges to dagre REVERSED (target → source) so an object with many INBOUND relationships ranks
    // ABOVE the objects that point at it — i.e. heavily-referenced objects (parents) sit near the top.
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.target, edge.source);
    });

    dagre.layout(dagreGraph);

    const positionedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const size = sizeById.get(node.id) ?? { width: NODE_WIDTH, height: NODE_HEIGHT };
        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - size.width / 2,
                y: nodeWithPosition.y - size.height / 2,
            },
        };
    });

    return { nodes: positionedNodes, edges };
}
