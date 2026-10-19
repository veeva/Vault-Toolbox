import { useMemo } from 'react';
import { filterAndDedupeRelationshipList } from '../../../utils/erd-explorer/ErdExplorerHelper';
import type {
    ErdObjectSummary,
    ErdRelationship,
    ErdRelationshipsByDirection,
} from '../../../utils/erd-explorer/ErdExplorerTypes';
import type { DirectionFilter } from './useErdObjectRelationshipsDialog';

interface UseErdRelatedObjectsViewParams {
    directionFilter: DirectionFilter;
    searchTerm: string;
    relationships: ErdRelationshipsByDirection | null;
    placedSet: Set<string>;
    selected: Set<string>;
    summaryByName: Map<string, ErdObjectSummary>;
}

interface ErdRelatedObjectsViewState {
    showInbound: boolean;
    showOutbound: boolean;
    inbound: ErdRelationship[];
    outbound: ErdRelationship[];
    hasAnyRelationship: boolean;
}

/**
 * Derives which direction sections the relationships dialog shows and the searched, de-duplicated rows
 * in each, so RelatedObjectsView.tsx stays presentation-only.
 */
export function useErdRelatedObjectsView({
    directionFilter,
    searchTerm,
    relationships,
    placedSet,
    selected,
    summaryByName,
}: UseErdRelatedObjectsViewParams): ErdRelatedObjectsViewState {
    return useMemo(() => {
        const filters = {
            searchTerm: searchTerm.trim().toLowerCase(),
            sourceFilter: 'all',
            stateFilter: 'all',
            summaryMap: summaryByName,
            placed: placedSet,
            selected,
        };
        return {
            showInbound: directionFilter !== 'outbound',
            showOutbound: directionFilter !== 'inbound',
            inbound: filterAndDedupeRelationshipList(relationships?.inbound ?? [], filters),
            outbound: filterAndDedupeRelationshipList(relationships?.outbound ?? [], filters),
            hasAnyRelationship: (relationships?.inbound.length ?? 0) > 0 || (relationships?.outbound.length ?? 0) > 0,
        };
    }, [directionFilter, searchTerm, relationships, placedSet, selected, summaryByName]);
}
