import { Badge, Box, Flex, HStack, IconButton, Text } from '@chakra-ui/react';
import { PiCaretDoubleRightBold, PiX } from 'react-icons/pi';
import { Tooltip } from '../../shared/ui-components/tooltip';
import type { VirtualItem } from '@tanstack/react-virtual';
import type { ErdObjectSummary } from '../../../utils/erd-explorer/ErdExplorerTypes';

interface AddObjectsRowProps {
    object: ErdObjectSummary;
    virtualRow: VirtualItem;
    isPlaced: boolean;
    isSelected: boolean;
    isActive: boolean;
    isAutoHiddenJoin: boolean;
    hasRelationships: boolean;
    onToggle: () => void;
    onFocus: () => void;
    onNavigate: () => void;
    onRemove: () => void;
}

/** One virtualized row of the Add Objects list: name, on-canvas pill, drill-down, source badge. */
export default function AddObjectsRow({
    object,
    virtualRow,
    isPlaced,
    isSelected,
    isActive,
    isAutoHiddenJoin,
    hasRelationships,
    onToggle,
    onFocus,
    onNavigate,
    onRemove,
}: AddObjectsRowProps) {
    return (
        <Box
            position='absolute'
            top={0}
            left={0}
            width='100%'
            height={`${virtualRow.size}px`}
            transform={`translateY(${virtualRow.start}px)`}
            paddingX='4px'
            paddingY='2px'
        >
            <Box
                borderWidth='1px'
                borderColor={isSelected ? 'veeva_orange_color_mode' : isActive ? 'gray.300' : 'transparent'}
                borderRadius='6px'
                height='100%'
                overflow='hidden'
                backgroundColor={isSelected || isActive ? 'beige_color_mode' : 'transparent'}
            >
                <Flex
                    align='center'
                    gap={2}
                    height='100%'
                    padding='4px 8px'
                    cursor='pointer'
                    _hover={{ backgroundColor: 'veeva_light_gray_color_mode' }}
                    onClick={() => isPlaced ? onFocus() : onToggle()}
                >
                    <Flex flex='0 1 auto' minWidth={0} align='center' gap={2}>
                        <Box minWidth={0}>
                            <Text fontSize='sm' fontWeight='medium' truncate>
                                {object.label}
                            </Text>
                            <Text fontSize='xs' fontFamily='mono' color='gray.500' truncate>
                                {object.name}
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
                                    onClick={(event: React.MouseEvent) => {
                                        event.stopPropagation();
                                        onRemove();
                                    }}
                                    aria-label='Remove from canvas'
                                >
                                    <PiX size={11} />
                                </IconButton>
                            </Tooltip>
                        </HStack>
                    )}
                    {isAutoHiddenJoin && (
                        <Badge size='sm' colorPalette='purple' flexShrink={0}>
                            Join · Hidden
                        </Badge>
                    )}
                    <Tooltip content='View related objects' openDelay={0}>
                        <IconButton
                            size='xs'
                            variant='ghost'
                            flexShrink={0}
                            color='veeva_orange_color_mode'
                            padding='0px'
                            visibility={hasRelationships ? 'visible' : 'hidden'}
                            pointerEvents={hasRelationships ? 'auto' : 'none'}
                            _hover={{ backgroundColor: 'light_gray_color_mode' }}
                            onClick={(event: React.MouseEvent) => {
                                event.stopPropagation();
                                onNavigate();
                            }}
                            aria-label='View related objects'
                        >
                            <PiCaretDoubleRightBold size={14} />
                        </IconButton>
                    </Tooltip>
                    <Box width='76px' flexShrink={0} display='flex' justifyContent='center'>
                        <Badge size='sm' textTransform='capitalize'>
                            {object.source}
                        </Badge>
                    </Box>
                </Flex>
            </Box>
        </Box>
    );
}
