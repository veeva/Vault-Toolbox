interface RelationshipLabelBoxProps {
    outboundName?: string;
    inboundName?: string;
    joinName?: string;
    relationshipKindLabel?: string;
}

/** Outbound/Inbound/Join/Type rows shared by the on-canvas edge label and its hover tooltip. */
export default function RelationshipLabelBox({ outboundName, inboundName, joinName, relationshipKindLabel }: RelationshipLabelBoxProps) {
    return (
        <>
            {outboundName && (
                <div>
                    <strong>Outbound:</strong> {outboundName}
                </div>
            )}
            {inboundName && (
                <div>
                    <strong>Inbound:</strong> {inboundName}
                </div>
            )}
            {joinName && (
                <div>
                    <strong>Join:</strong> {joinName}
                </div>
            )}
            {relationshipKindLabel && (
                <div style={{ marginTop: outboundName || inboundName || joinName ? 2 : 0 }}>
                    <strong>Type:</strong> {relationshipKindLabel}
                </div>
            )}
        </>
    );
}
