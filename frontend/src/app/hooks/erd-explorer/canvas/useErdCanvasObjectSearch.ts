import { useCallback, useMemo, useRef, useState } from 'react';

export interface SearchableItem {
    id: string;
    label: string;
}

interface UseErdCanvasObjectSearchParams {
    objects: SearchableItem[];
    onFocus: (id: string) => void;
}

/**
 * Manages all state and keyboard interactions for the ERD canvas object-search box:
 * the search text, dropdown open/close, and keyboard arrow navigation.
 */
export function useErdCanvasObjectSearch({ objects, onFocus }: UseErdCanvasObjectSearchParams) {
    const [userSearchInput, setUserSearchInput] = useState('');
    const [isResultsOpen, setIsResultsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const matches = useMemo(() => {
        const normalizedSearchInput = userSearchInput.trim().toLowerCase();
        if (!normalizedSearchInput) return [];
        return objects
            .filter(
                (item) =>
                    item.label.toLowerCase().includes(normalizedSearchInput) ||
                    item.id.toLowerCase().includes(normalizedSearchInput),
            )
            .slice(0, 8);
    }, [userSearchInput, objects]);

    const inputRef = useRef<HTMLInputElement>(null);

    const chooseMatch = useCallback(
        (id: string) => {
            onFocus(id);
            setUserSearchInput('');
            setIsResultsOpen(false);
            setActiveIndex(-1);
        },
        [onFocus],
    );

    const handleSearchInputChange = useCallback((nextSearchInput: string) => {
        setUserSearchInput(nextSearchInput);
        setIsResultsOpen(true);
        setActiveIndex(-1);
    }, []);

    const handleInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, matches.length - 1));
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter') {
                const target = activeIndex >= 0 ? matches[activeIndex] : matches[0];
                if (target) chooseMatch(target.id);
            } else if (event.key === 'Escape') {
                setIsResultsOpen(false);
                setActiveIndex(-1);
            }
        },
        [activeIndex, matches, chooseMatch],
    );

    const handleInputBlur = useCallback(() => {
        window.setTimeout(() => {
            setIsResultsOpen(false);
            setActiveIndex(-1);
        }, 150);
    }, []);

    return {
        userSearchInput,
        isResultsOpen,
        activeIndex,
        inputRef,
        matches,
        chooseMatch,
        handleSearchInputChange,
        handleInputKeyDown,
        handleInputBlur,
    };
}
