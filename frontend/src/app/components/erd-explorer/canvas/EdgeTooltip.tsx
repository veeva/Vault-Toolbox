import { createPortal } from 'react-dom';
import RelationshipLabelBox from './RelationshipLabelBox';

interface EdgeTooltipProps {
    mousePosition: { x: number; y: number };
    outboundName?: string;
    inboundName?: string;
    joinName?: string;
    relationshipKindLabel?: string;
}

/** Fixed-position tooltip rendered into document.body that follows the mouse over a floating edge. */
export default function EdgeTooltip({ mousePosition, outboundName, inboundName, joinName, relationshipKindLabel }: EdgeTooltipProps) {
    return createPortal(
        <div
            style={{
                position: 'fixed',
                left: mousePosition.x,
                top: mousePosition.y,
                transform: 'translate(-50%, calc(-100% - 8px))',
                background: 'var(--erd-label-bg, #ffffff)',
                border: '1px solid var(--chakra-colors-gray-200, #e2e8f0)',
                borderRadius: 4,
                padding: '3px 6px',
                fontSize: 10,
                lineHeight: 1.5,
                pointerEvents: 'none',
                zIndex: 99999,
                whiteSpace: 'nowrap',
            }}
        >
            <RelationshipLabelBox
                outboundName={outboundName}
                inboundName={inboundName}
                joinName={joinName}
                relationshipKindLabel={relationshipKindLabel}
            />
        </div>,
        document.body,
    );
}
