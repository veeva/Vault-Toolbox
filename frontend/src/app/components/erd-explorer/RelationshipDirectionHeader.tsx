import { Badge, HStack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface RelationshipDirectionHeaderProps {
    icon: ReactNode;
    label: string;
    count: number;
}

/** Inbound/Outbound section heading with its relationship count, shared by the sidebar and the dialog. */
export default function RelationshipDirectionHeader({ icon, label, count }: RelationshipDirectionHeaderProps) {
    return (
        <HStack
            gap={2}
            paddingX='8px'
            paddingY='4px'
            marginBottom='4px'
            backgroundColor='veeva_light_gray_color_mode'
            borderRadius='6px'
            color='veeva_orange_color_mode'
        >
            {icon}
            <Text fontSize='sm' fontWeight='bold' textTransform='uppercase'>
                {label}
            </Text>
            <Badge size='xs'>{count}</Badge>
        </HStack>
    );
}
