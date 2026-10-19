import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';
import { useColorMode } from '../../shared/ui-components/color-mode';
import { useErdFloatingEdgeHover } from '../../../hooks/erd-explorer/canvas/useErdFloatingEdgeHover';
import { useErdFloatingEdgeGeometry } from '../../../hooks/erd-explorer/canvas/useErdFloatingEdgeGeometry';
import { EDGE_ARROW_SIZE } from '../../../utils/erd-explorer/graph/ErdExplorerEdgeHelpers';
import EdgeTooltip from './EdgeTooltip';
import RelationshipLabelBox from './RelationshipLabelBox';

/**
 * Floating edge: computes its endpoints from the two nodes' geometry. The arrow STARTS at its owning
 * reference field's row (left or right side, nearest the target) — falling back to the node's label row
 * when that field is hidden — and ENTERS the target's nearest top/bottom side. Reflows as nodes move.
 */
export default function FloatingEdge({
    id,
    source,
    target,
    selected,
    markerStart,
    markerEnd,
    style,
    label,
    labelBgStyle,
    data,
}: EdgeProps) {
    const { colorMode } = useColorMode();
    const { hovered, mousePosition, handleMouseEnter, handleMouseLeave, handleMouseMove } = useErdFloatingEdgeHover();
    const {
        path,
        labelX,
        labelY,
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
    } = useErdFloatingEdgeGeometry({ id, source, target, selected, style, labelBgStyle, data, hovered, colorMode });

    if (!path) return null;

    // Clicking an edge (selected) or hovering its line brings its label to front, so it reads cleanly
    // even when several sibling labels still overlap (e.g. many relationships to the same object).
    const isLabelInFront = selected || hovered;

    return (
        <>
            {hovered && (markerEnd ?? markerStart) && (
                <defs>
                    <marker
                        id={hoverMarkerId}
                        markerWidth={highlighted ? EDGE_ARROW_SIZE / 2 : EDGE_ARROW_SIZE}
                        markerHeight={highlighted ? EDGE_ARROW_SIZE / 2 : EDGE_ARROW_SIZE}
                        viewBox='-10 -10 20 20'
                        refX='0'
                        refY='0'
                        orient='auto-start-reverse'
                        markerUnits='strokeWidth'
                    >
                        <polyline
                            points='-5,-4 0,0 -5,4 -5,-4'
                            fill={hoverColor}
                            stroke={hoverColor}
                            strokeWidth='1'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </marker>
                </defs>
            )}
            <BaseEdge
                id={id}
                path={path}
                markerStart={hovered && markerStart ? `url(#${hoverMarkerId})` : markerStart}
                markerEnd={hovered && markerEnd ? `url(#${hoverMarkerId})` : markerEnd}
                style={edgeStyle}
            />
            {/* Invisible wider path for hover hit area — BaseEdge's path is too thin to hover reliably */}
            <path
                d={path}
                fill='none'
                stroke='transparent'
                strokeWidth={14}
                style={{ cursor: 'default' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
            />
            {hovered && !label && hasRelationshipLabels && mousePosition && (
                <EdgeTooltip
                    mousePosition={mousePosition}
                    outboundName={outboundName}
                    inboundName={inboundName}
                    joinName={joinName}
                    relationshipKindLabel={relationshipKindLabel}
                />
            )}
            {label && labelVisible && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            background: labelBackground,
                            border: `1px solid ${isLabelInFront ? hoverColor : 'var(--chakra-colors-gray-200, #e2e8f0)'}`,
                            borderRadius: 4,
                            padding: '3px 6px',
                            fontSize: 10,
                            lineHeight: 1.5,
                            whiteSpace: 'nowrap',
                            cursor: 'default',
                            zIndex: isLabelInFront ? 10 : highlighted ? 4 : 1,
                            boxShadow: isLabelInFront ? '0 2px 8px rgba(0, 0, 0, 0.35)' : undefined,
                        }}
                        className='nodrag nopan'
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <RelationshipLabelBox
                            outboundName={outboundName}
                            inboundName={inboundName}
                            joinName={joinName}
                            relationshipKindLabel={relationshipKindLabel}
                        />
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
