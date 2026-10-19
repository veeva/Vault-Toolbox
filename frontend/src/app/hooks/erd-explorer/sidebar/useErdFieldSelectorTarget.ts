import type useErdExplorer from '../useErdExplorer';

type ErdExplorerRecords = ReturnType<typeof useErdExplorer>['records'];
type ErdExplorerSummaryByName = ReturnType<typeof useErdExplorer>['summaryByName'];

interface UseErdFieldSelectorTargetArgs {
    singleSelectedObject: string | null;
    records: ErdExplorerRecords;
    summaryByName: ErdExplorerSummaryByName;
}

/**
 * Derives the record/summary lookups the Field Selector tab needs from the currently selected object,
 * so FieldSelectorTab.tsx stays presentation-only.
 */
export function useErdFieldSelectorTarget({ singleSelectedObject, records, summaryByName }: UseErdFieldSelectorTargetArgs) {
    // Field selector tracks canvas selection (not the sticky focusedObject) so deselecting clears the tab.
    const fieldTarget = singleSelectedObject;
    const fieldTargetRecord = fieldTarget ? records[fieldTarget] : undefined;
    const fieldTargetSummary = fieldTarget ? summaryByName.get(fieldTarget) : undefined;

    return { fieldTarget, fieldTargetRecord, fieldTargetSummary };
}
