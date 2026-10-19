import { Box, Button, ButtonGroup, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { PiArrowLineDown, PiArrowLineUp } from 'react-icons/pi';
import type { ErdObjectRecord } from '../../../hooks/erd-explorer/useErdExplorerData';
import type { ErdRelationshipsByDirection, ErdObjectSummary } from '../../../utils/erd-explorer/ErdExplorerTypes';
import { DIRECTION_FILTERS, type DirectionFilter } from '../../../hooks/erd-explorer/relationships-dialog/useErdObjectRelationshipsDialog';
import { useErdRelatedObjectsView } from '../../../hooks/erd-explorer/relationships-dialog/useErdRelatedObjectsView';
import FilterGroupLabel from '../FilterGroupLabel';
import RelationshipDirectionSection from './RelationshipDirectionSection';

interface RelatedObjectsViewProps {
    directionFilter: DirectionFilter;
    setDirectionFilter: (filter: DirectionFilter) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    record?: ErdObjectRecord;
    relationships: ErdRelationshipsByDirection | null;
    placedSet: Set<string>;
    selected: Set<string>;
    onToggle: (name: string) => void;
    onAddSelected: () => void;
    summaryByName: Map<string, ErdObjectSummary>;
}

/** Filter + search + list view for an object's inbound and outbound related objects. */
export default function RelatedObjectsView({
    directionFilter,
    setDirectionFilter,
    searchTerm,
    setSearchTerm,
    record,
    relationships,
    placedSet,
    selected,
    onToggle,
    onAddSelected,
    summaryByName,
}: RelatedObjectsViewProps) {
    const { showInbound, showOutbound, inbound, outbound, hasAnyRelationship } = useErdRelatedObjectsView({
        directionFilter,
        searchTerm,
        relationships,
        placedSet,
        selected,
        summaryByName,
    });

    return (
        <>
            <VStack align='stretch' gap={2} padding='12px'>
                <Input
                    size='sm'
                    placeholder='Filter related objects…'
                    value={searchTerm}
                    borderColor='light_gray_color_mode'
                    onChange={(event) => setSearchTerm(event.target.value)}
                />
                <VStack align='stretch' gap={2}>
                    <FilterGroupLabel>Direction</FilterGroupLabel>
                    <ButtonGroup size='xs' attached variant='outline'>
                        {DIRECTION_FILTERS.map((filterOption) => (
                            <Button
                                key={filterOption}
                                onClick={() => setDirectionFilter(filterOption)}
                                backgroundColor={directionFilter === filterOption ? 'veeva_orange_color_mode' : undefined}
                                color={directionFilter === filterOption ? 'white' : undefined}
                                borderColor='light_gray_color_mode'
                                textTransform='capitalize'
                            >
                                {filterOption}
                            </Button>
                        ))}
                    </ButtonGroup>
                </VStack>
            </VStack>

            {(!record || record.status === 'loading') && (
                <HStack gap={2} padding='12px'>
                    <Text fontSize='sm' color='gray.500'>Loading related objects…</Text>
                </HStack>
            )}
            {record?.status === 'error' && (
                <Text fontSize='sm' color='veeva_sunset_red_color_mode' padding='12px'>
                    Failed to load related objects.
                </Text>
            )}
            {record?.status === 'ready' && relationships && (
                <VStack align='stretch' gap={1} maxHeight='50vh' overflowY='auto' paddingX='12px' paddingY='4px'>
                    {!hasAnyRelationship ? (
                        <Text fontSize='sm' color='gray.500' padding='8px'>No related objects</Text>
                    ) : (
                        <>
                            {showInbound && (
                                <RelationshipDirectionSection
                                    title='Inbound'
                                    icon={<PiArrowLineDown size={12} />}
                                    relationships={inbound}
                                    placed={placedSet}
                                    selected={selected}
                                    summaryByName={summaryByName}
                                    onToggle={onToggle}
                                />
                            )}
                            {showOutbound && (
                                <RelationshipDirectionSection
                                    title='Outbound'
                                    icon={<PiArrowLineUp size={12} />}
                                    relationships={outbound}
                                    placed={placedSet}
                                    selected={selected}
                                    summaryByName={summaryByName}
                                    onToggle={onToggle}
                                />
                            )}
                        </>
                    )}
                </VStack>
            )}
            {record?.status === 'ready' && relationships && (
                <Box padding='8px 12px 12px'>
                    <Button
                        size='sm'
                        width='100%'
                        backgroundColor='veeva_twilight_blue.500'
                        color='white'
                        disabled={selected.size === 0}
                        onClick={onAddSelected}
                    >
                        Add selected {selected.size > 0 ? `(${selected.size})` : ''}
                    </Button>
                </Box>
            )}
        </>
    );
}
