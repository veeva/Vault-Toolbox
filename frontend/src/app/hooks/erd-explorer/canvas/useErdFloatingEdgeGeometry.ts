import { getBezierPath, useInternalNode, useStore, type EdgeProps } from '@xyflow/react';
import { highlightZoomScale } from '../../../utils/erd-explorer/ErdExplorerHelper';
import {
    fillOf,
    getFloatingEdgeParams,
    rectOf,
    selfLoopPath,
    siblingLabelOffset,
    sourceAnchorY,
} from '../../../utils/erd-explorer/graph/ErdExplorerGeometryHelpers';
import {
    edgeKindTooltipLabel,
    MANY_TO_MANY_COMPLEX_TYPE,
    MANY_TO_MANY_SIMPLE_TYPE,
} from '../../../utils/erd-explorer/graph/ErdExplorerEdgeHelpers';
import type { ErdField, ErdHighlightDirection } from '../../../utils/erd-explorer/ErdExplorerTypes';

// Matches the veeva_orange_color_mode semantic token (light/dark values match the node source badge).
const HOVER_COLOR_LIGHT = '#f7981d';
const HOVER_COLOR_DARK = '#FFAC41';

type FloatingEdgeData = {
    highlight?: ErdHighlightDirection | null;
    owningField?: ErdField;
    relationshipType?: string;
    relationshipName?: string;
    siblingIndex?: number;
    siblingCount?: number;
} | undefined;

interface UseErdFloatingEdgeGeometryArgs
    extends Pick<EdgeProps, 'id' | 'source' | 'target' | 'selected' | 'style' | 'labelBgStyle' | 'data'> {
    hovered: boolean;
    colorMode: 'light' | 'dark';
}

/**
 * Derives FloatingEdge's path/label position, zoom- and hover-aware stroke style, and relationship
 * labels for the relationship label box, so the component stays presentation-only.
 */
export function useErdFloatingEdgeGeometry({
    id,
    source,
    target,
    selected,
    style,
    labelBgStyle,
    data,
    hovered,
    colorMode,
}: UseErdFloatingEdgeGeometryArgs) {
    const sourceNode = useInternalNode(source);
    const targetNode = useInternalNode(target);
    // Coarse zoom (quantized to 0.1 steps) so highlighted edges thicken as you zoom out without
    // re-rendering every edge on every zoom tick. React Flow's transform is [x, y, zoom].
    const zoom = useStore((store) => Math.round(store.transform[2] * 10) / 10);
    const anyNodeSelected = useStore((store) => store.nodes.some((node) => node.selected));

    const sourceRect = rectOf(sourceNode);
    const targetRect = rectOf(targetNode);

    const edgeData = data as FloatingEdgeData;
    const highlighted = !!edgeData?.highlight;
    const hoverColor = colorMode === 'dark' ? HOVER_COLOR_DARK : HOVER_COLOR_LIGHT;
    const hoverMarkerId = `erd-hover-${id}`;
    // Highlighted edges get thicker the farther you zoom out (in world units), so they stay prominent.
    const edgeStyle =
        highlighted && typeof style?.strokeWidth === 'number'
            ? { ...style, strokeWidth: style.strokeWidth * highlightZoomScale(zoom), ...(hovered ? { stroke: hoverColor } : {}) }
            : hovered
              ? { ...style, stroke: hoverColor }
              : style;

    // Outbound/inbound relationship names + type for the relationship label box.
    const owningField = edgeData?.owningField;
    const relationshipType = edgeData?.relationshipType ?? '';
    const relationshipKindLabel = edgeKindTooltipLabel(relationshipType);
    const isManyToMany = relationshipType === MANY_TO_MANY_SIMPLE_TYPE || relationshipType === MANY_TO_MANY_COMPLEX_TYPE;
    const joinName = isManyToMany ? edgeData?.relationshipName : undefined;
    // Falls back to the derived edge's relationship name when the owning field hasn't loaded yet (e.g.
    // batch add) — but not for M:M edges, whose relationshipName is the join name shown in `joinName`.
    const outboundName = owningField?.outboundName ?? (isManyToMany ? undefined : edgeData?.relationshipName);
    const inboundName = owningField?.inboundName;
    const hasRelationshipLabels = !!(outboundName || inboundName || relationshipKindLabel || joinName);

    const labelVisible = !anyNodeSelected || selected || !!sourceNode?.selected || !!targetNode?.selected;
    const labelBackground = fillOf(labelBgStyle) ?? 'var(--erd-label-bg, #ffffff)';

    // Everything except the path, which needs both node rectangles to be measured first.
    const sharedGeometry = {
        edgeStyle,
        hoverMarkerId,
        hoverColor,
        highlighted,
        outboundName,
        inboundName,
        relationshipKindLabel,
        joinName,
        hasRelationshipLabels,
        labelVisible,
        labelBackground,
    };

    if (!sourceRect || !targetRect) {
        return { path: null, labelX: 0, labelY: 0, ...sharedGeometry };
    }

    let path: string;
    let labelX: number;
    let labelY: number;
    if (source === target) {
        // Self-referencing relationship: start at the owning field's row (right side) and loop AROUND the
        // nearest corner — control points sit outside the box so the curve never cuts through the node —
        // to enter the nearest top/bottom edge.
        const fieldY = sourceAnchorY(sourceNode?.internals.handleBounds?.source, sourceRect.y, owningField?.name);
        ({ path, labelX, labelY } = selfLoopPath(sourceRect, fieldY));
    } else {
        const { sourceX, targetX, targetY, sourcePosition, targetPosition } = getFloatingEdgeParams(sourceRect, targetRect);
        // Start the arrow at the owning field's measured row (left/right side already chosen by proximity).
        const sourceFieldY = sourceAnchorY(sourceNode?.internals.handleBounds?.source, sourceRect.y, owningField?.name);
        [path, labelX, labelY] = getBezierPath({
            sourceX,
            sourceY: sourceFieldY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
        });
        // Fan sibling labels out perpendicular to the edge when several relationships connect the same
        // two objects — otherwise they all land near the same midpoint and stack on each other.
        const offset = siblingLabelOffset(
            targetX - sourceX,
            targetY - sourceFieldY,
            edgeData?.siblingIndex ?? 0,
            edgeData?.siblingCount ?? 1,
        );
        labelX += offset.dx;
        labelY += offset.dy;
    }

    return { path, labelX, labelY, ...sharedGeometry };
}
