import { useDisclosure } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isDevBuild } from '../../services/SharedServices';
import {
    ApiHistoryEntry,
    ApiHistoryExpandedDetails,
    ApiHistoryRow,
    buildPayload,
    buildSortedHeaderList,
    getApiHistory,
    buildDisplayedHistoryRow,
} from '../../utils/api-history/ApiHistoryHelper';

export interface UseApiHistoryReturn {
    displayedHistoryRows: ApiHistoryRow[];
    expandedEntryDetails: ApiHistoryExpandedDetails | null;
    isModalOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
}

/**
 * Backs the API History modal: loads logged entries on open and tracks which row is expanded.
 */
export default function useApiHistory(): UseApiHistoryReturn {
    const [historyEntries, setHistoryEntries] = useState<ApiHistoryEntry[]>(() => getApiHistory());
    const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

    const { open: isModalOpen, onOpen: openModal, onClose: handleModalClose } = useDisclosure();

    /** Expands the given entry, or collapses it if it is already expanded. */
    const toggleRowExpansion = useCallback((entryId: string) => {
        setExpandedEntryId((currentExpandedId) => (currentExpandedId === entryId ? null : entryId));
    }, []);

    /** Clears any expanded row before closing the modal. */
    const closeModal = useCallback(() => {
        setExpandedEntryId(null);
        handleModalClose();
    }, [handleModalClose]);

    /**
     * One row per stored entry, mapped to the display-ready fields the table renders and
     * tagged with whether the entry is currently expanded plus a handler to toggle it.
     */
    const displayedHistoryRows: ApiHistoryRow[] = useMemo(
        () =>
            historyEntries.map((historyEntry) => {
                const isEntryExpanded = historyEntry.id === expandedEntryId;
                const displayedRowFields = buildDisplayedHistoryRow(historyEntry, isEntryExpanded);
                return {
                    ...displayedRowFields,
                    onToggle: () => toggleRowExpansion(historyEntry.id),
                };
            }),
        [historyEntries, expandedEntryId, toggleRowExpansion],
    );

    /** Expanded view of the currently selected entry, or null when no row is expanded. */
    const expandedEntryDetails: ApiHistoryExpandedDetails | null = useMemo(() => {
        if (expandedEntryId == null) return null;

        const matchingEntry = historyEntries.find((historyEntry) => historyEntry.id === expandedEntryId);
        if (!matchingEntry) return null;

        return {
            requestPayload: buildPayload(matchingEntry.requestPayload),
            // The response payload is only captured and shown in dev builds.
            responsePayload: isDevBuild() ? buildPayload(matchingEntry.responseBody) : null,
            allRequestHeaders: buildSortedHeaderList(matchingEntry.requestHeaders),
            allResponseHeaders: buildSortedHeaderList(matchingEntry.responseHeaders),
            defaultTabValue: isDevBuild() ? 'response-payload' : 'response-headers',
        };
    }, [expandedEntryId, historyEntries]);

    // Refresh the API History whenever the modal is opened
    useEffect(() => {
        if (!isModalOpen) return;
        setHistoryEntries(getApiHistory());
    }, [isModalOpen]);

    return {
        displayedHistoryRows,
        expandedEntryDetails,
        isModalOpen,
        openModal,
        closeModal,
    };
}
