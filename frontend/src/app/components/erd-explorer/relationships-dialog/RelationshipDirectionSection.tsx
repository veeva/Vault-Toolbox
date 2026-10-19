import { Text, VStack } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import type { ErdObjectSummary, ErdRelationship } from '../../../utils/erd-explorer/ErdExplorerTypes';
import RelationshipDirectionHeader from '../RelationshipDirectionHeader';
import AddableRelationshipRow from './AddableRelationshipRow';

interface RelationshipDirectionSectionProps {
    title: string;
    icon: ReactNode;
    relationships: ErdRelationship[];
    placed: Set<string>;
    selected: Set<string>;
    summaryByName: Map<string, ErdObjectSummary>;
    onToggle: (name: string) => void;
}

/** One direction's heading plus its addable related-object rows, inside the relationships dialog. */
export default function RelationshipDirectionSection({
    title,
    icon,
    relationships,
    placed,
    selected,
    summaryByName,
    onToggle,
}: RelationshipDirectionSectionProps) {
    return (
        <VStack align='stretch' gap={0.5}>
            <RelationshipDirectionHeader icon={icon} label={title} count={relationships.length} />
            {relationships.length === 0 ? (
                <Text fontSize='xs' color='gray.400' paddingX='8px' paddingBottom='4px'>
                    None
                </Text>
            ) : (
                relationships.map((relationship) => (
                    <AddableRelationshipRow
                        key={`${title}-${relationship.name}-${relationship.target}`}
                        relationship={relationship}
                        placed={placed.has(relationship.target)}
                        isSelected={selected.has(relationship.target)}
                        summaryByName={summaryByName}
                        onToggle={onToggle}
                    />
                ))
            )}
        </VStack>
    );
}
