import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import type { ErdObjectSummary, ErdRelationship } from '../../../utils/erd-explorer/ErdExplorerTypes';
import { resolveTargetLabel } from '../../../utils/erd-explorer/ErdExplorerHelper';

interface AddableRelationshipRowProps {
    relationship: ErdRelationship;
    placed: boolean;
    isSelected: boolean;
    summaryByName: Map<string, ErdObjectSummary>;
    onToggle: (name: string) => void;
}

/** One selectable related object in the relationships dialog; already-placed objects are inert. */
export default function AddableRelationshipRow({
    relationship,
    placed,
    isSelected,
    summaryByName,
    onToggle,
}: AddableRelationshipRowProps) {
    const label = resolveTargetLabel(relationship.target, summaryByName);

    return (
        <Box
            onClick={() => !placed && onToggle(relationship.target)}
            cursor={placed ? 'default' : 'pointer'}
            opacity={placed ? 0.5 : 1}
            borderWidth='1px'
            borderColor={isSelected ? 'veeva_orange_color_mode' : 'transparent'}
            backgroundColor={isSelected ? 'beige_color_mode' : 'transparent'}
            borderRadius='4px'
            padding='4px 8px'
            _hover={placed ? undefined : { backgroundColor: isSelected ? 'beige_color_mode' : 'veeva_light_gray_color_mode' }}
        >
            <HStack justify='space-between' alignItems='center' gap={2}>
                <VStack align='stretch' gap={0} minWidth={0}>
                    {label && (
                        <Text fontWeight='bold' fontSize='sm' truncate>
                            {label}
                        </Text>
                    )}
                    <Text fontSize='2xs' fontFamily='mono' color='dimmed_text_color_mode' truncate>
                        {relationship.target}
                    </Text>
                </VStack>
                {placed && (
                    <Text fontSize='xs' color='gray.500' flexShrink={0}>
                        on canvas
                    </Text>
                )}
            </HStack>
        </Box>
    );
}
