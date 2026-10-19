import { type ReactNode } from 'react';
import { Text } from '@chakra-ui/react';

interface FilterGroupLabelProps {
    children: ReactNode;
}

/** Small uppercase caption clarifying what a row of controls does (filters vs presets). */
export default function FilterGroupLabel({ children }: FilterGroupLabelProps) {
    return (
        <Text fontSize='xs' fontWeight='bold' textTransform='uppercase' color='gray.500'>
            {children}
        </Text>
    );
}
