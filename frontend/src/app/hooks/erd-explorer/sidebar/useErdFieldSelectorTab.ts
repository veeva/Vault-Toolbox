import { useMemo, useState } from 'react';
import { classifyField, relationshipsOnlyFieldNames } from '../../../utils/erd-explorer/ErdExplorerHelper';
import { type ErdField, type FieldCategory } from '../../../utils/erd-explorer/ErdExplorerTypes';

export type TypeFilter = FieldCategory | 'all';

interface UseErdFieldSelectorTabParams {
    fields: ErdField[];
    visibleFieldSet: Set<string>;
}

/** State, derived data, and handlers for the Field Selector tab. */
export function useErdFieldSelectorTab({ fields, visibleFieldSet }: UseErdFieldSelectorTabParams) {
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [showOnlyVisible, setShowOnlyVisible] = useState(false);

    const shownFields = useMemo(
        () => fields.filter((field) => {
            if (typeFilter !== 'all' && classifyField(field) !== typeFilter) return false;
            if (showOnlyVisible && !visibleFieldSet.has(field.name)) return false;
            return true;
        }),
        [fields, typeFilter, showOnlyVisible, visibleFieldSet],
    );

    const referenceFieldNames = useMemo(() => relationshipsOnlyFieldNames(fields), [fields]);

    /** Toggles the "selected only" list filter. */
    const toggleShowOnlyVisible = () => setShowOnlyVisible((currentVisibility) => !currentVisibility);

    return {
        typeFilter,
        setTypeFilter,
        showOnlyVisible,
        toggleShowOnlyVisible,
        shownFields,
        referenceFieldNames,
    };
}
