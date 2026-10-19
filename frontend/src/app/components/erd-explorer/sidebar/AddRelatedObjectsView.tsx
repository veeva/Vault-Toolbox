import { Box, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { PiArrowLineDown, PiArrowLineUp } from 'react-icons/pi';
import type { ErdRelationshipsByDirection, ErdObjectSummary } from '../../../utils/erd-explorer/ErdExplorerTypes';
import { BreadcrumbCurrentLink, BreadcrumbLink, BreadcrumbRoot } from '../../shared/ui-components/breadcrumb';
import RelationshipDirectionHeader from '../RelationshipDirectionHeader';
import AddRelatedObjectRow from './AddRelatedObjectRow';

interface AddRelatedObjectsViewProps {
    navStack: string[];
    navigateToDepth: (depth: number) => void;
    filteredRelationships: ErdRelationshipsByDirection | null;
    hasUnfilteredRelationships: boolean;
    summaryMap: Map<string, ErdObjectSummary>;
    placed: Set<string>;
    selected: Set<string>;
    relationshipHasRelated: Map<string, boolean>;
    toggle: (name: string) => void;
    onFocus: (name: string) => void;
    navigateTo: (name: string) => void;
    onRemove: (name: string) => void;
}

/** Drill-down view for the Add Objects tab: shows the inbound/outbound related objects of one object. */
export default function AddRelatedObjectsView({
    navStack,
    navigateToDepth,
    filteredRelationships,
    hasUnfilteredRelationships,
    summaryMap,
    placed,
    selected,
    relationshipHasRelated,
    toggle,
    onFocus,
    navigateTo,
    onRemove,
}: AddRelatedObjectsViewProps) {
    return (
        <VStack align='stretch' gap={0} flex={1} minHeight={0} marginTop='8px'>
            <HStack gap={2} padding='6px 12px' borderBottom='1px solid' borderBottomColor='gray.200'>
                <BreadcrumbRoot
                    flex={1}
                    minWidth={0}
                    separator={<Box as='span' fontSize='md'>›</Box>}
                    whiteSpace='nowrap'
                    overflowX='auto'
                    overflowY='hidden'
                >
                    <BreadcrumbLink
                        fontWeight='medium'
                        color='veeva_orange_color_mode'
                        cursor='pointer'
                        onClick={() => navigateToDepth(0)}
                    >
                        All
                    </BreadcrumbLink>
                    {navStack.map((name, index) =>
                        index === navStack.length - 1 ? (
                            <BreadcrumbCurrentLink key={name} fontWeight='medium' color='veeva_dark_gray_text_color_mode'>
                                {name}
                            </BreadcrumbCurrentLink>
                        ) : (
                            <BreadcrumbLink
                                key={name}
                                fontWeight='medium'
                                color='veeva_orange_color_mode'
                                cursor='pointer'
                                onClick={() => navigateToDepth(index + 1)}
                            >
                                {name}
                            </BreadcrumbLink>
                        ),
                    )}
                </BreadcrumbRoot>
            </HStack>

            <Box flex={1} overflowY='auto' minHeight={0} padding='8px 12px 0'>
                {!filteredRelationships && (
                    <HStack gap={2} justify='center' padding='24px'>
                        <Spinner size='sm' color='veeva_orange_color_mode' />
                        <Text fontSize='sm' color='gray.500'>Loading related objects…</Text>
                    </HStack>
                )}
                {filteredRelationships && filteredRelationships.inbound.length === 0 && filteredRelationships.outbound.length === 0 && (
                    <Text fontSize='xs' color='gray.500' padding='16px' textAlign='center'>
                        {hasUnfilteredRelationships ? 'No related objects match your filters.' : 'No related objects.'}
                    </Text>
                )}
                {filteredRelationships && (
                    <>
                        {filteredRelationships.inbound.length > 0 && (
                            <Box marginBottom='8px'>
                                <RelationshipDirectionHeader
                                    icon={<PiArrowLineDown size={12} />}
                                    label='Inbound'
                                    count={filteredRelationships.inbound.length}
                                />
                                {filteredRelationships.inbound.map((relationship) => {
                                    const summary = summaryMap.get(relationship.target);
                                    return (
                                        <AddRelatedObjectRow
                                            key={`in-${relationship.name}-${relationship.target}`}
                                            name={relationship.target}
                                            label={summary?.label}
                                            source={summary?.source}
                                            isPlaced={placed.has(relationship.target)}
                                            isSelected={selected.has(relationship.target)}
                                            hasRelated={relationshipHasRelated.get(relationship.target) ?? true}
                                            onToggle={() => toggle(relationship.target)}
                                            onFocus={() => onFocus(relationship.target)}
                                            onNavigate={() => navigateTo(relationship.target)}
                                            onRemove={() => onRemove(relationship.target)}
                                        />
                                    );
                                })}
                            </Box>
                        )}
                        {filteredRelationships.outbound.length > 0 && (
                            <Box>
                                <RelationshipDirectionHeader
                                    icon={<PiArrowLineUp size={12} />}
                                    label='Outbound'
                                    count={filteredRelationships.outbound.length}
                                />
                                {filteredRelationships.outbound.map((relationship) => {
                                    const summary = summaryMap.get(relationship.target);
                                    return (
                                        <AddRelatedObjectRow
                                            key={`out-${relationship.name}-${relationship.target}`}
                                            name={relationship.target}
                                            label={summary?.label}
                                            source={summary?.source}
                                            isPlaced={placed.has(relationship.target)}
                                            isSelected={selected.has(relationship.target)}
                                            hasRelated={relationshipHasRelated.get(relationship.target) ?? true}
                                            onToggle={() => toggle(relationship.target)}
                                            onFocus={() => onFocus(relationship.target)}
                                            onNavigate={() => navigateTo(relationship.target)}
                                            onRemove={() => onRemove(relationship.target)}
                                        />
                                    );
                                })}
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </VStack>
    );
}
