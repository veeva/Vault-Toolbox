import { Badge, Box, Flex, HStack, IconButton, Text } from '@chakra-ui/react';
import { PiCaretDoubleRightBold, PiX } from 'react-icons/pi';
import { Tooltip } from '../../shared/ui-components/tooltip';

interface AddRelatedObjectRowProps {
    name: string;
    label?: string;
    source?: string;
    isPlaced: boolean;
    isSelected: boolean;
    hasRelated: boolean;
    onToggle: () => void;
    onFocus: () => void;
    onNavigate: () => void;
    onRemove: () => void;
}

/** Related-object row — styled identically to the top-level list rows. */
export default function AddRelatedObjectRow({
    name,
    label,
    source,
    isPlaced,
    isSelected,
    hasRelated,
    onToggle,
    onFocus,
    onNavigate,
    onRemove,
}: AddRelatedObjectRowProps) {
    return (
        <Box
            borderWidth='1px'
            borderColor={isSelected ? 'veeva_orange_color_mode' : 'transparent'}
            borderRadius='6px'
            overflow='hidden'
            backgroundColor={isSelected ? 'beige_color_mode' : 'transparent'}
            marginBottom='2px'
        >
            <Flex
                align='center'
                gap={2}
                padding='4px 8px'
                cursor='pointer'
                _hover={{ backgroundColor: 'veeva_light_gray_color_mode' }}
                onClick={() => isPlaced ? onFocus() : onToggle()}
            >
                <Flex flex='0 1 auto' minWidth={0} align='center' gap={2}>
                    <Box minWidth={0}>
                        <Text fontSize='sm' fontWeight='medium' truncate>
                            {label ?? name}
                        </Text>
                        <Text fontSize='xs' fontFamily='mono' color='gray.500' truncate>
                            {name}
                        </Text>
                    </Box>
                </Flex>
                <Box flex={1} />
                {isPlaced && (
                    <HStack
                        gap={1}
                        flexShrink={0}
                        border='1px solid'
                        borderColor='veeva_orange_color_mode'
                        borderRadius='full'
                        paddingX='8px'
                        paddingY='2px'
                        color='veeva_orange_color_mode'
                    >
                        <Text fontSize='xs'>On Canvas</Text>
                        <Tooltip content='Remove from canvas' openDelay={0}>
                            <IconButton
                                size='2xs'
                                variant='ghost'
                                flexShrink={0}
                                color='veeva_orange_color_mode'
                                minWidth='auto'
                                height='auto'
                                padding='0'
                                _hover={{ backgroundColor: 'veeva_orange_color_mode', color: 'white' }}
                                onClick={(event: React.MouseEvent) => { event.stopPropagation(); onRemove(); }}
                                aria-label='Remove from canvas'
                            >
                                <PiX size={11} />
                            </IconButton>
                        </Tooltip>
                    </HStack>
                )}
                <Tooltip content='View related objects' openDelay={0}>
                    <IconButton
                        size='xs'
                        variant='ghost'
                        flexShrink={0}
                        color='veeva_orange_color_mode'
                        padding='0px'
                        visibility={hasRelated ? 'visible' : 'hidden'}
                        pointerEvents={hasRelated ? 'auto' : 'none'}
                        _hover={{ backgroundColor: 'light_gray_color_mode' }}
                        onClick={(event: React.MouseEvent) => { event.stopPropagation(); onNavigate(); }}
                        aria-label='View related objects'
                    >
                        <PiCaretDoubleRightBold size={12} />
                    </IconButton>
                </Tooltip>
                <Box width='76px' flexShrink={0} display='flex' justifyContent='center'>
                    {source && (
                        <Badge size='sm' textTransform='capitalize'>
                            {source}
                        </Badge>
                    )}
                </Box>
            </Flex>
        </Box>
    );
}
