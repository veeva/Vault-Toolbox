import { Badge, HStack, Text, VStack } from '@chakra-ui/react';
import { classifyField } from '../../../utils/erd-explorer/ErdExplorerHelper';
import { FIELD_CATEGORY_LABELS, type ErdField } from '../../../utils/erd-explorer/ErdExplorerTypes';
import { Checkbox } from '../../shared/ui-components/checkbox';

interface FieldToggleRowProps {
    field: ErdField;
    checked: boolean;
    onToggle: () => void;
}

/** Checkbox row for a single field: name, label, reference target, and category badge. */
export default function FieldToggleRow({ field, checked, onToggle }: FieldToggleRowProps) {
    return (
        <HStack
            gap={2}
            paddingX='8px'
            paddingY='4px'
            cursor='pointer'
            borderRadius='4px'
            _hover={{ backgroundColor: 'veeva_light_gray_color_mode' }}
            onClick={onToggle}
        >
            <Checkbox variant='subtle' checked={checked} flexShrink={0} pointerEvents='none' />
            <VStack align='start' gap={0} minWidth={0} flex={1}>
                <Text fontSize='xs' truncate width='100%'>
                    {field.label}
                    {field.isReference && field.targetObject ? ` → ${field.targetObject}` : ''}
                </Text>
                <Text fontSize='xs' fontFamily='mono' color='gray.500' truncate width='100%'>
                    {field.name}
                </Text>
            </VStack>
            <Badge size='sm' flexShrink={0}>
                {FIELD_CATEGORY_LABELS[classifyField(field)]}
            </Badge>
        </HStack>
    );
}
