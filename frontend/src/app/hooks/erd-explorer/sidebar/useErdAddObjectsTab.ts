import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { filterAndDedupeRelationshipList } from '../../../utils/erd-explorer/ErdExplorerHelper';
import { UNFETCHABLE_RELATIONSHIP_TARGETS, type ErdRelationshipsByDirection, type ErdObjectSummary } from '../../../utils/erd-explorer/ErdExplorerTypes';

type SourceFilter = 'all' | 'system' | 'standard' | 'custom';
export const SOURCE_FILTERS: SourceFilter[] = ['all', 'system', 'standard', 'custom'];

type StateFilter = 'all' | 'on canvas' | 'selected';
export const STATE_FILTERS: StateFilter[] = ['all', 'on canvas', 'selected'];

/** Fixed row height the virtualizer measures every object row by. */
const ROW_HEIGHT = 52;

interface UseErdAddObjectsTabParams {
    objectList: ErdObjectSummary[];
    placedObjects: string[];
    onAdd: (names: string[]) => void;
    onFocus: (name: string) => void;
    getRelationships: (name: string) => ErdRelationshipsByDirection | null;
    ensureObject: (name: string) => void;
}

/**
 * State, filtering, virtualization, and drill-down navigation for the Add Objects sidebar tab.
 */
export function useErdAddObjectsTab({
    objectList,
    placedObjects,
    onAdd,
    onFocus,
    getRelationships,
    ensureObject,
}: UseErdAddObjectsTabParams) {
    const [search, setSearch] = useState('');
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
    const [stateFilter, setStateFilter] = useState<StateFilter>('all');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [activeIndex, setActiveIndex] = useState(-1);
    const [navStack, setNavStack] = useState<string[]>([]);

    const placed = useMemo(() => new Set(placedObjects), [placedObjects]);
    const summaryMap = useMemo(() => new Map(objectList.map((object) => [object.name, object])), [objectList]);

    const parentRef = useRef<HTMLDivElement>(null);
    // savedSearchStack[i] = search active at depth i before navigating deeper; restored when returning.
    const savedSearchStackRef = useRef<string[]>([]);

    const filtered = useMemo(() => {
        const normalizedSearchInput = search.trim().toLowerCase();
        return objectList
            .filter((object) => {
                if (UNFETCHABLE_RELATIONSHIP_TARGETS.has(object.name)) return false;
                if (sourceFilter !== 'all' && object.source !== sourceFilter) return false;
                if (stateFilter === 'selected' && !selected.has(object.name)) return false;
                if (stateFilter === 'on canvas' && !placed.has(object.name)) return false;
                if (!normalizedSearchInput) return true;
                return (
                    object.label.toLowerCase().includes(normalizedSearchInput) ||
                    object.name.toLowerCase().includes(normalizedSearchInput)
                );
            })
            .sort((objectA, objectB) => objectA.label.localeCompare(objectB.label));
    }, [objectList, search, sourceFilter, stateFilter, selected, placed]);

    const virtualizer = useVirtualizer({
        count: filtered.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 12,
    });

    const toggle = (name: string) =>
        setSelected((previousSelected) => {
            const nextSelected = new Set(previousSelected);
            if (nextSelected.has(name)) nextSelected.delete(name);
            else nextSelected.add(name);
            return nextSelected;
        });

    const handleAdd = () => {
        if (selected.size === 0) return;
        onAdd([...selected]);
        setSelected(new Set());
        setSearch('');
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((previousIndex) => Math.min(previousIndex + 1, filtered.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((previousIndex) => Math.max(previousIndex - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const focusedObject = filtered[activeIndex];
            if (!focusedObject) return;
            if (placed.has(focusedObject.name)) onFocus(focusedObject.name);
            else toggle(focusedObject.name);
        }
    };

    /** Returns true if the object has any known relationships, or if they haven't been loaded yet (optimistic). */
    const objectHasRelationships = (name: string): boolean => {
        const relationships = getRelationships(name);
        if (relationships === null) return true;
        return relationships.inbound.length > 0 || relationships.outbound.length > 0;
    };

    const navigateTo = (name: string) => {
        savedSearchStackRef.current = [...savedSearchStackRef.current, search];
        setSearch('');
        setNavStack((previousNavStack) => [...previousNavStack, name]);
    };

    const navigateToDepth = (depth: number) => {
        const restoredSearch = savedSearchStackRef.current[depth] ?? '';
        savedSearchStackRef.current = savedSearchStackRef.current.slice(0, depth);
        setSearch(restoredSearch);
        setNavStack((previousNavStack) => previousNavStack.slice(0, depth));
    };

    const inRelatedObjectsView = navStack.length > 0;
    const currentName = navStack[navStack.length - 1];
    const searchTerm = search.trim().toLowerCase();

    const rawRelationships = inRelatedObjectsView ? getRelationships(currentName) : null;

    const filteredRelationships = useMemo((): ErdRelationshipsByDirection | null => {
        if (!rawRelationships) return null;
        const relationshipFilters = { searchTerm, sourceFilter, summaryMap, placed, selected, stateFilter };
        return {
            inbound: filterAndDedupeRelationshipList(rawRelationships.inbound, relationshipFilters),
            outbound: filterAndDedupeRelationshipList(rawRelationships.outbound, relationshipFilters),
        };
    }, [rawRelationships, searchTerm, sourceFilter, summaryMap, placed, selected, stateFilter]);

    // Distinguishes "this object truly has no relationships" from "its relationships are all filtered
    // out", so the empty state in the related-objects view can word the two cases differently.
    const hasUnfilteredRelationships = rawRelationships
        ? rawRelationships.inbound.length > 0 || rawRelationships.outbound.length > 0
        : false;

    const relationshipHasRelated = useMemo(() => {
        const hasRelatedMap = new Map<string, boolean>();
        if (!filteredRelationships) return hasRelatedMap;
        const targets = [
            ...filteredRelationships.inbound.map((relationship) => relationship.target),
            ...filteredRelationships.outbound.map((relationship) => relationship.target),
        ];
        for (const target of targets) {
            const targetRelationships = getRelationships(target);
            if (targetRelationships === null) {
                hasRelatedMap.set(target, true);
            } else {
                const otherRelationshipCount =
                    targetRelationships.inbound.filter((relationship) => relationship.target !== currentName).length +
                    targetRelationships.outbound.filter((relationship) => relationship.target !== currentName).length;
                hasRelatedMap.set(target, otherRelationshipCount > 0);
            }
        }
        return hasRelatedMap;
    }, [filteredRelationships, getRelationships, currentName]);

    useEffect(() => {
        if (navStack.length > 0) ensureObject(navStack[navStack.length - 1]);
    }, [navStack, ensureObject]);

    return {
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
        objectHasRelationships,
        inRelatedObjectsView,
        navStack,
        filteredRelationships,
        hasUnfilteredRelationships,
        relationshipHasRelated,
    };
}
