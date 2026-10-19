import { Position, type InternalNode, type Node } from '@xyflow/react';
import type { CSSProperties } from 'react';
import { FALLBACK_NODE_HEIGHT, FALLBACK_NODE_WIDTH } from '../ErdExplorerTypes';

/** An absolute node box (top-left origin) used for floating-edge geometry. */
export interface NodeRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface FloatingEdgeParams {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: Position;
    targetPosition: Position;
}

/** A measured handle (React Flow handleBounds entry) — only the bits floating edges need. */
export interface HandleBound {
    id?: string | null;
    y: number;
    height: number;
}

/** Vertical anchor (from the node top) used when an edge has no visible owning field to attach to. */
export const LABEL_ANCHOR_OFFSET = 20;

/** Absolute bounding box for a node, using React Flow's measured size when available (falls back pre-measure). */
export function rectOf(internalNode: InternalNode<Node> | undefined): NodeRect | null {
    if (!internalNode) return null;
    const position = internalNode.internals.positionAbsolute;
    return {
        x: position.x,
        y: position.y,
        width: internalNode.measured?.width ?? FALLBACK_NODE_WIDTH,
        height: internalNode.measured?.height ?? FALLBACK_NODE_HEIGHT,
    };
}

/** Read the SVG `fill` off a label style object without fighting the CSSProperties type. */
export function fillOf(style: CSSProperties | undefined): string | undefined {
    return (style as (CSSProperties & { fill?: string }) | undefined)?.fill;
}

/**
 * Compute object-level floating-edge endpoints between two node boxes (pure — unit-tested).
 * Rule (from the design decision): the OUTBOUND end leaves the source's LEFT or RIGHT side, whichever is
 * nearer the target; the INBOUND end enters the target's TOP or BOTTOM side, whichever is nearer the
 * source. Each anchor sits at the midpoint of the chosen side, so edges reflow as nodes move/resize.
 */
export function getFloatingEdgeParams(source: NodeRect, target: NodeRect): FloatingEdgeParams {
    const sourceCenterX = source.x + source.width / 2;
    const sourceCenterY = source.y + source.height / 2;
    const targetCenterX = target.x + target.width / 2;
    const targetCenterY = target.y + target.height / 2;

    const exitRight = targetCenterX >= sourceCenterX;
    const sourcePosition = exitRight ? Position.Right : Position.Left;
    const sourceX = exitRight ? source.x + source.width : source.x;
    const sourceY = sourceCenterY;

    const enterTop = sourceCenterY <= targetCenterY;
    const targetPosition = enterTop ? Position.Top : Position.Bottom;
    const targetX = targetCenterX;
    const targetY = enterTop ? target.y : target.y + target.height;

    return { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };
}

/**
 * Absolute Y at which a floating edge should start on the source node: the centre of its owning field's
 * measured row when that field is visible, otherwise the node's label row (LABEL_ANCHOR_OFFSET). Pure —
 * unit-tested. `rectY` is the node's absolute top; handle `y` is relative to that top.
 */
export function sourceAnchorY(
    handles: HandleBound[] | null | undefined,
    rectY: number,
    fieldName: string | undefined,
    labelOffset: number = LABEL_ANCHOR_OFFSET,
): number {
    if (fieldName && handles) {
        const handle = handles.find((entry) => entry.id === fieldName);
        if (handle) return rectY + handle.y + handle.height / 2;
    }
    return rectY + labelOffset;
}

// How far right of the node the loop bulges — and where its label is centered. Wide enough that the
// multi-line Outbound/Inbound/Type label box (which can run 150-200px+ wide) clears the node entirely
// instead of straddling back onto it (it's centered on this point).
const SELF_LOOP_HORIZONTAL_OFFSET = 150;
// How far above/below the entry edge the loop's second control point sits, and how far in from the
// node's right corner the curve re-enters (capped as a fraction of narrow nodes' width).
const SELF_LOOP_VERTICAL_OFFSET = 56;
const SELF_LOOP_ENTRY_INSET = 24;
const SELF_LOOP_ENTRY_INSET_RATIO = 0.15;

/**
 * SVG path + label anchor for a self-referencing edge that loops around the node's nearest corner.
 * The curve exits the right side at `fieldY`, sweeps outside the box, and re-enters the nearest
 * top or bottom edge. `rect` is the node's absolute bounding box.
 */
export function selfLoopPath(rect: NodeRect, fieldY: number): { path: string; labelX: number; labelY: number } {
    const right = rect.x + rect.width;
    const toTop = fieldY <= rect.y + rect.height / 2;
    const cornerX = right + SELF_LOOP_HORIZONTAL_OFFSET;
    const entryY = toTop ? rect.y : rect.y + rect.height;
    const cornerY = toTop ? entryY - SELF_LOOP_VERTICAL_OFFSET : entryY + SELF_LOOP_VERTICAL_OFFSET;
    const entryX = right - Math.min(SELF_LOOP_ENTRY_INSET, rect.width * SELF_LOOP_ENTRY_INSET_RATIO);
    const path = `M ${right} ${fieldY} C ${cornerX} ${fieldY}, ${cornerX} ${cornerY}, ${entryX} ${entryY}`;
    return { path, labelX: cornerX, labelY: (fieldY + entryY) / 2 };
}

// Distance between neighboring labels when several relationships connect the same two objects (e.g.
// "lead_auditor__c", "main_contact__c", "owner__v" all pointing from one object to the same other
// object) — otherwise every sibling's label lands near the same bezier midpoint and they stack on
// top of each other, since only the (fixed, shared-target) midpoint determines the default position.
const SIBLING_LABEL_SPACING = 54;

/**
 * Groups edges that connect the same two nodes, direction-independent (a self-loop's "pair" is just
 * its own node), and gives each edge its index + sibling count within that group. Feed the result to
 * `siblingLabelOffset` so edges sharing endpoints fan their labels out instead of clustering together.
 */
export function groupEdgesForLabelFanOut<T extends { source: string; target: string }>(
    edges: readonly T[],
): Map<T, { index: number; count: number }> {
    const groups = new Map<string, T[]>();
    for (const edge of edges) {
        const key = edge.source === edge.target ? edge.source : [edge.source, edge.target].sort().join('::');
        const group = groups.get(key);
        if (group) group.push(edge);
        else groups.set(key, [edge]);
    }
    const slots = new Map<T, { index: number; count: number }>();
    for (const group of groups.values()) {
        group.forEach((edge, index) => slots.set(edge, { index, count: group.length }));
    }
    return slots;
}

/**
 * Perpendicular offset for a label so siblings (see `groupEdgesForLabelFanOut`) fan out along the axis
 * perpendicular to the source→target direction, evenly spaced and centered on the shared midpoint,
 * instead of clustering there. A lone edge (`count` 1) gets zero offset.
 */
export function siblingLabelOffset(dx: number, dy: number, index: number, count: number): { dx: number; dy: number } {
    if (count <= 1) return { dx: 0, dy: 0 };
    const length = Math.hypot(dx, dy) || 1;
    const perpX = -dy / length;
    const perpY = dx / length;
    const distance = (index - (count - 1) / 2) * SIBLING_LABEL_SPACING;
    return { dx: perpX * distance, dy: perpY * distance };
}

/** Horizontal gap left between the existing diagram and a freshly-laid-out cluster placed beside it. */
const CLUSTER_GAP = 120;

/**
 * Computes the (translateX, translateY) needed to place a freshly-laid-out cluster to the right of all
 * existing nodes, aligned to the same top edge. When there are no existing nodes the cluster is placed at
 * the canvas origin.
 */
export function computeClusterTranslation(
    existingNodes: Node[],
    laidOutNodes: Node[],
): { translateX: number; translateY: number } {
    const laidMinX = Math.min(...laidOutNodes.map((node) => node.position.x));
    const laidMinY = Math.min(...laidOutNodes.map((node) => node.position.y));
    if (existingNodes.length === 0) {
        return { translateX: -laidMinX, translateY: -laidMinY };
    }
    const rightEdge = existingNodes.reduce(
        (max, node) => Math.max(max, node.position.x + (node.measured?.width ?? FALLBACK_NODE_WIDTH)),
        Number.NEGATIVE_INFINITY,
    );
    const topEdge = Math.min(...existingNodes.map((node) => node.position.y));
    return {
        translateX: rightEdge + CLUSTER_GAP - laidMinX,
        translateY: topEdge - laidMinY,
    };
}
