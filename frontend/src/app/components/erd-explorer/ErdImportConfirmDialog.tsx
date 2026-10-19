import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react';

interface ErdImportConfirmDialogProps {
    onCancel: () => void;
    onMerge: () => void;
    onReplace: () => void;
}

/** Modal dialog shown when importing a project onto a non-empty canvas. */
export default function ErdImportConfirmDialog({ onCancel, onMerge, onReplace }: ErdImportConfirmDialogProps) {
    return (
        <Flex
            position='fixed'
            inset={0}
            zIndex={200}
            align='center'
            justify='center'
            backgroundColor='rgba(0,0,0,0.4)'
        >
            <Box
                backgroundColor='white_color_mode'
                borderRadius='10px'
                boxShadow='xl'
                padding='24px'
                maxWidth='380px'
                width='100%'
            >
                <Text fontWeight='bold' fontSize='lg' marginBottom='8px'>Import project</Text>
                <Text fontSize='sm' color='gray.600' marginBottom='20px'>
                    The canvas already has objects. How would you like to import?
                </Text>
                <HStack justify='flex-end' gap={2}>
                    <Button size='sm' variant='outline' onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button size='sm' variant='outline' onClick={onMerge}>
                        Merge
                    </Button>
                    <Button
                        size='sm'
                        backgroundColor='veeva_orange_color_mode'
                        color='white'
                        onClick={onReplace}
                    >
                        Replace
                    </Button>
                </HStack>
            </Box>
        </Flex>
    );
}
