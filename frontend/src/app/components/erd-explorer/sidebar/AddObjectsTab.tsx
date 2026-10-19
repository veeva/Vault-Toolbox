import { Box, Button, ButtonGroup, IconButton, Input, Text, VStack, HStack } from '@chakra-ui/react';
import { PiArrowClockwise } from 'react-icons/pi';
import type { ErdRelationshipsByDirection, ErdObjectSummary } from '../../../utils/erd-explorer/ErdExplorerTypes';
import type { ErdSchemaLoadProgress } from '../../../utils/erd-explorer/schema/ErdExplorerSchemaLoad';
import { useErdAddObjectsTab, SOURCE_FILTERS, STATE_FILTERS } from '../../../hooks/erd-explorer/sidebar/useErdAddObjectsTab';
import { Tooltip } from '../../shared/ui-components/tooltip';
import FilterGroupLabel from '../FilterGroupLabel';
import AddRelatedObjectsView from './AddRelatedObjectsView';
import AddObjectsListView from './AddObjectsListView';
import AddObjectsSchemaState from './AddObjectsSchemaState';

interface AddObjectsTabProps {
    objectList: ErdObjectSummary[];
    hiddenJoinNames: Set<string>;
    status: 'loading' | 'ready' | 'error';
    error?: string;
    progress: ErdSchemaLoadProgress;
    onReload: () => void;
    placedObjects: string[];
    onAdd: (names: string[]) => void;
    onFocus: (name: string) => void;
    onRemove: (name: string) => void;
    pendingSwap: string | null;
    onCancelSwap: () => void;
    getRelationships: (name: string) => ErdRelationshipsByDirection | null;
    ensureObject: (name: string) => void;
    objectCount: number;
    relationshipCount: number;
}

/**
 * Object picker as a sidebar tab. Two views:
 * - Top-level (navStack empty): search + source filter, virtualized list, multi-select add.
 * - Related objects view (navStack non-empty): shows relationships for the last object in the stack,
 *   using the same row style as the top-level list.
 *
 * The search bar, source filters, and Add Selected button are always visible in both views.
 */
export default function AddObjectsTab({
    objectList,
    hiddenJoinNames,
    status,
    error,
    progress,
    onReload,
    placedObjects,
    onAdd,
    onFocus,
    onRemove,
    pendingSwap,
    onCancelSwap,
    getRelationships,
    ensureObject,
    objectCount,
    relationshipCount,
}: AddObjectsTabProps) {
    const {
        search,
        setSearch,
        sourceFilter,
        setSourceFilter,
        stateFilter,
        setStateFilter,
        selected,
        activeIndex,
        setActiveIndex,
        parentRef,
        placed,
        summaryMap,
        filtered,
        virtualizer,
        toggle,
        handleAdd,
        handleSearchKeyDown,
        navigateTo,
        navigateToDepth,
        inRelatedObjectsView,
        navStack,
        filteredRelationships,
        hasUnfilteredRelationships,
        relationshipHasRelated,
        objectHasRelationships,
    } = useErdAddObjectsTab({ objectList, placedObjects, onAdd, onFocus, getRelationships, ensureObject });

    return (
        <VStack align='stretch' gap={0} height='100%'>
            <Box {...TabTitleStyle}>
                <Text fontSize='xl' fontWeight='bold' color='veeva_orange_color_mode'>Add Objects</Text>
            </Box>
            <Tooltip content='Reload objects from Vault' openDelay={0} positioning={{ placement: 'right' }}>
                <IconButton onClick={onReload} aria-label='Reload objects from Vault' alignSelf='flex-start' {...RefreshIconButtonStyle}>
                    <PiArrowClockwise size={20} style={{ margin: '4px' }} />
                </IconButton>
            </Tooltip>

            {/* Always-visible controls */}
            <VStack align='stretch' gap={2} padding='0 12px'>
                <Input
                    size='sm'
                    placeholder={inRelatedObjectsView ? 'Filter related objects…' : 'Search objects…'}
                    value={search}
                    borderColor='light_gray_color_mode'
                    onChange={(event) => { setSearch(event.target.value); setActiveIndex(-1); }}
                    onKeyDown={inRelatedObjectsView ? undefined : handleSearchKeyDown}
                />
                <HStack align='flex-start' gap={4} wrap='wrap'>
                    <VStack align='stretch' gap={2}>
                        <FilterGroupLabel>Categories</FilterGroupLabel>
                        <ButtonGroup size='xs' attached variant='outline'>
                            {SOURCE_FILTERS.map((filterOption) => (
                                <Button
                                    key={filterOption}
                                    onClick={() => setSourceFilter(filterOption)}
                                    backgroundColor={sourceFilter === filterOption ? 'veeva_orange_color_mode' : undefined}
                                    color={sourceFilter === filterOption ? 'white' : undefined}
                                    borderColor='light_gray_color_mode'
                                    textTransform='capitalize'
                                >
                                    {filterOption}
                                </Button>
                            ))}
                        </ButtonGroup>
                    </VStack>
                    <VStack align='stretch' gap={2}>
                        <FilterGroupLabel>State</FilterGroupLabel>
                        <ButtonGroup size='xs' attached variant='outline'>
                            {STATE_FILTERS.map((filterOption) => (
                                <Button
                                    key={filterOption}
                                    onClick={() => setStateFilter(filterOption)}
                                    backgroundColor={stateFilter === filterOption ? 'veeva_orange_color_mode' : undefined}
                                    color={stateFilter === filterOption ? 'white' : undefined}
                                    borderColor='light_gray_color_mode'
                                    textTransform='capitalize'
                                >
                                    {filterOption}
                                </Button>
                            ))}
                        </ButtonGroup>
                    </VStack>
                </HStack>
            </VStack>

            {status !== 'ready' ? (
                <AddObjectsSchemaState status={status} error={error} progress={progress} onReload={onReload} />
            ) : inRelatedObjectsView ? (
                <AddRelatedObjectsView
                    navStack={navStack}
                    navigateToDepth={navigateToDepth}
                    filteredRelationships={filteredRelationships}
                    hasUnfilteredRelationships={hasUnfilteredRelationships}
                    summaryMap={summaryMap}
                    placed={placed}
                    selected={selected}
                    relationshipHasRelated={relationshipHasRelated}
                    toggle={toggle}
                    onFocus={onFocus}
                    navigateTo={navigateTo}
                    onRemove={onRemove}
                />
            ) : (
                <AddObjectsListView
                    pendingSwap={pendingSwap}
                    onCancelSwap={onCancelSwap}
                    filtered={filtered}
                    parentRef={parentRef}
                    virtualizer={virtualizer}
                    placed={placed}
                    selected={selected}
                    activeIndex={activeIndex}
                    hiddenJoinNames={hiddenJoinNames}
                    toggle={toggle}
                    onFocus={onFocus}
                    navigateTo={navigateTo}
                    onRemove={onRemove}
                    objectHasRelationships={objectHasRelationships}
                />
            )}

            {/* Footer: counts + Add Selected button */}
            {status === 'ready' && (
                <Box padding='8px 12px 12px'>
                    <Text fontSize='sm' fontWeight='medium' color='veeva_dark_gray_text_color_mode' textAlign='center' marginBottom='4px'>
                        {objectCount} object{objectCount === 1 ? '' : 's'} · {relationshipCount} relationship{relationshipCount === 1 ? '' : 's'}
                    </Text>
                    <Button
                        size='sm'
                        width='100%'
                        backgroundColor='veeva_twilight_blue.500'
                        color='white'
                        disabled={selected.size === 0}
                        onClick={handleAdd}
                    >
                        {pendingSwap ? 'Replace' : 'Add selected'} {selected.size > 0 ? `(${selected.size})` : ''}
                    </Button>
                </Box>
            )}
        </VStack>
    );
}

const TabTitleStyle = {
    borderBottom: 'solid 3px',
    borderBottomColor: 'gray.400',
    padding: '8px 12px',
    width: '100%',
};

const RefreshIconButtonStyle = {
    variant: 'subtle',
    colorPalette: 'gray',
    borderRadius: '6px',
    margin: '5px 5px 5px 12px',
    height: 'auto',
    minWidth: 'auto',
    padding: '0',
} as const;
