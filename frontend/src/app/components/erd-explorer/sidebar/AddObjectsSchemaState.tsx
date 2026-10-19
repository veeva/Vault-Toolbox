import { Button, Spinner, Text, VStack } from '@chakra-ui/react';
import { PiArrowClockwise } from 'react-icons/pi';
import { formatSchemaLoadProgress } from '../../../utils/erd-explorer/ErdExplorerHelper';
import type { ErdSchemaLoadProgress } from '../../../utils/erd-explorer/schema/ErdExplorerSchemaLoad';

interface AddObjectsSchemaStateProps {
    status: 'loading' | 'error';
    error?: string;
    progress: ErdSchemaLoadProgress;
    onReload: () => void;
}

/** Stands in for the object picker while this Vault's schema is loading, or when the load failed. */
export default function AddObjectsSchemaState({ status, error, progress, onReload }: AddObjectsSchemaStateProps) {
    if (status === 'loading') {
        return (
            <VStack gap={3} flex={1} justify='center' padding='24px'>
                <Spinner color='veeva_orange_color_mode' />
                <Text fontSize='sm' color='gray.500' textAlign='center'>
                    {formatSchemaLoadProgress(progress)}
                </Text>
                <Text fontSize='xs' color='dimmed_text_color_mode' textAlign='center'>
                    You can import a project while this finishes.
                </Text>
            </VStack>
        );
    }

    return (
        <VStack gap={3} flex={1} justify='center' padding='24px'>
            <Text fontSize='sm' fontWeight='medium' color='veeva_sunset_red_color_mode' textAlign='center'>
                Could not load this Vault&rsquo;s objects
            </Text>
            <Text fontSize='xs' color='gray.500' textAlign='center'>
                {error ?? 'The object schema could not be retrieved.'}
            </Text>
            <Button size='sm' variant='outline' onClick={onReload}>
                <PiArrowClockwise style={{ marginRight: 6 }} /> Try again
            </Button>
        </VStack>
    );
}
