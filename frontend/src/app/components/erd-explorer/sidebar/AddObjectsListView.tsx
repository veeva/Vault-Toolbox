import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { PiX } from 'react-icons/pi';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import type { ErdObjectSummary } from '../../../utils/erd-explorer/ErdExplorerTypes';
import AddObjectsRow from './AddObjectsRow';

interface AddObjectsListViewProps {
    pendingSwap: string | null;
    onCancelSwap: () => void;
    filtered: ErdObjectSummary[];
    parentRef: React.RefObject<HTMLDivElement | null>;
    virtualizer: Virtualizer<HTMLDivElement, Element>;
    placed: Set<string>;
    selected: Set<string>;
    activeIndex: number;
    hiddenJoinNames: Set<string>;
    toggle: (name: string) => void;
    onFocus: (name: string) => void;
    navigateTo: (name: string) => void;
    onRemove: (name: string) => void;
    objectHasRelationships: (name: string) => boolean;
}

/** Top-level list view for the Add Objects tab: virtualized, searchable, multi-selectable object list. */
export default function AddObjectsListView({
    pendingSwap,
    onCancelSwap,
    filtered,
    parentRef,
    virtualizer,
    placed,
    selected,
    activeIndex,
    hiddenJoinNames,
    toggle,
    onFocus,
    navigateTo,
    onRemove,
    objectHasRelationships,
}: AddObjectsListViewProps) {
    return (
        <VStack align='stretch' gap={2} flex={1} padding='8px 12px 0' minHeight={0}>
            {pendingSwap && (
                <HStack
                    justifyContent='space-between'
                    backgroundColor='beige_color_mode'
                    borderRadius='6px'
                    paddingX='8px'
                    paddingY='4px'
                >
                    <Text fontSize='xs' truncate>
                        Replacing <b>{pendingSwap}</b> — pick one object
                    </Text>
                    <Button size='2xs' variant='ghost' onClick={onCancelSwap} aria-label='Cancel replace'>
                        <PiX />
                    </Button>
                </HStack>
            )}

            {filtered.length === 0 && (
                <Text color='gray.500' textAlign='center' padding='24px' fontSize='sm'>
                    No objects match your filters.
                </Text>
            )}

            {filtered.length > 0 && (
                <Box ref={parentRef} flex={1} overflowY='auto' minHeight={0}>
                    <Box position='relative' height={`${virtualizer.getTotalSize()}px`} width='100%'>
                        {virtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
                            const object = filtered[virtualRow.index];
                            return (
                                <AddObjectsRow
                                    key={object.name}
                                    object={object}
                                    virtualRow={virtualRow}
                                    isPlaced={placed.has(object.name)}
                                    isSelected={selected.has(object.name)}
                                    isActive={virtualRow.index === activeIndex}
                                    isAutoHiddenJoin={hiddenJoinNames.has(object.name)}
                                    onToggle={() => toggle(object.name)}
                                    onFocus={() => onFocus(object.name)}
                                    onNavigate={() => navigateTo(object.name)}
                                    onRemove={() => onRemove(object.name)}
                                    hasRelationships={objectHasRelationships(object.name)}
                                />
                            );
                        })}
                    </Box>
                </Box>
            )}
        </VStack>
    );
}
