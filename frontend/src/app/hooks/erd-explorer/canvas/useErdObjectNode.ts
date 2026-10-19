import { useEffect } from 'react';
import { useUpdateNodeInternals } from '@xyflow/react';
import type { ErdObjectRecord } from '../useErdExplorerData';
import type { ErdHighlightDirection, ErdObjectSummary } from '../../../utils/erd-explorer/ErdExplorerTypes';
import { useErdNodeBorder } from './useErdNodeBorder';

interface UseErdObjectNodeArgs {
    id: string;
    selected?: boolean;
    summary?: ErdObjectSummary;
    record?: ErdObjectRecord;
    visibleFieldNames: string[];
    highlight?: ErdHighlightDirection;
}

/** Derives ObjectNode's label, border styling, and visible fields, and keeps React Flow's measured
 *  field handles in sync when the visible-field set changes. */
export function useErdObjectNode({ id, selected, summary, record, visibleFieldNames, highlight }: UseErdObjectNodeArgs) {
    const { borderColor, borderWidth } = useErdNodeBorder({ selected, highlight, restingBorderColor: 'gray.300' });
    const updateNodeInternals = useUpdateNodeInternals();

    const label = summary?.label ?? record?.fields[0]?.name ?? 'Object';
    const source = summary?.source ?? 'unknown';

    const visibleSet = new Set(visibleFieldNames);
    const fields = (record?.fields ?? []).filter((field) => visibleSet.has(field.name));
    // Why the node has no fields of its own, if it has none: absent from the Vault, or merely no MDL.
    const placeholderReason = record?.status === 'ready' && record.partial === true
        ? (record.missingFromVault ? 'missingFromVault' : 'noMdl')
        : undefined;

    // The per-field handles move when the visible-field set changes; tell React Flow to re-measure them
    // so floating edges keep starting at the correct field row. Keyed on a stable string (the array is a
    // fresh reference each render).
    const fieldKey = visibleFieldNames.join('|');
    useEffect(() => {
        updateNodeInternals(id);
    }, [id, updateNodeInternals, fieldKey]);

    return { label, source, borderColor, borderWidth, fields, placeholderReason };
}
