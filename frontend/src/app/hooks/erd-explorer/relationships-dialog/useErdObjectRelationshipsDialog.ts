import { useMemo, useState } from 'react';
import { parseDepth } from '../../../utils/erd-explorer/ErdExplorerHelper';

export type ObjectDialogView = 'related' | 'recursive';
export type DirectionFilter = 'all' | 'inbound' | 'outbound';
export const DIRECTION_FILTERS: DirectionFilter[] = ['all', 'inbound', 'outbound'];

interface UseErdObjectRelationshipsDialogParams {
    placedObjects: string[];
    onAdd: (names: string[]) => void;
}

/**
 * Manages all state for ErdObjectRelationshipsDialog: the active view, direction filter, search term,
 * recursive depth, and the related-objects selection. Dismissal is handled natively by the Chakra
 * Dialog (Escape / close button).
 */
export function useErdObjectRelationshipsDialog({ placedObjects, onAdd }: UseErdObjectRelationshipsDialogParams) {
    const [view, setView] = useState<ObjectDialogView>('related');
    const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [depth, setDepth] = useState(1);
    const [depthText, setDepthText] = useState('1');
    const [recursiveDirectionFilter, setRecursiveDirectionFilter] = useState<DirectionFilter>('all');
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const placedSet = useMemo(() => new Set(placedObjects), [placedObjects]);

    const toggleSelected = (name: string) =>
        setSelected((previousSelected) => {
            const nextSelected = new Set(previousSelected);
            if (nextSelected.has(name)) nextSelected.delete(name);
            else nextSelected.add(name);
            return nextSelected;
        });

    /** Clamps the typed recursive depth to a valid level count and syncs the input text with it. */
    const normalizeDepthInput = () => {
        const normalizedDepth = parseDepth(depthText);
        setDepth(normalizedDepth);
        setDepthText(String(normalizedDepth));
    };

    const handleAddSelected = () => {
        if (selected.size === 0) return;
        onAdd([...selected]);
        setSelected(new Set());
    };

    return {
        view,
        setView,
        directionFilter,
        setDirectionFilter,
        searchTerm,
        setSearchTerm,
        depth,
        depthText,
        setDepthText,
        normalizeDepthInput,
        recursiveDirectionFilter,
        setRecursiveDirectionFilter,
        selected,
        toggleSelected,
        handleAddSelected,
        placedSet,
    };
}
