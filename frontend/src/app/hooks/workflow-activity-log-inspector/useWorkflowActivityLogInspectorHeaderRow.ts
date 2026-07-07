import { useEffect, useRef, useState } from 'react';
import { useDisclosure, useFileUploadContext } from '@chakra-ui/react';

/**
 * Header behavior for the Workflow Activity Log Inspector. It collapses the action buttons to
 * icon-only the moment their labels overflow the header width (and restores the labels once there
 * is room again), owns the open/close state of the "Retrieve Log Data" download modal, and exposes
 * the OS file picker from the shared FileUpload context provided by the page.
 */
export default function useWorkflowActivityLogInspectorHeaderRow() {
    // Whether the action buttons render as icons only (true) or with their text labels (false).
    const [isCompact, setIsCompact] = useState(false);

    // Open/close state for the "Retrieve Log Data" download modal.
    const { open: isDownloadModalOpen, onOpen: openDownloadModal, onClose: closeDownloadModal } = useDisclosure();

    // Shared FileUpload context (provided by the page) — its openFilePicker opens the OS file dialog.
    const fileUpload = useFileUploadContext();

    // The header row element; its width is measured to detect when the labeled buttons overflow.
    const headerContainerRef = useRef<HTMLDivElement>(null);

    // The width the labeled layout needed at the moment it overflowed. We compare against this to
    // decide when it is safe to show labels again. It is stored in a ref because, once collapsed to
    // icons, the labeled width can no longer be measured from the DOM — and using it avoids a
    // collapse/expand flicker loop right at the breakpoint.
    const labeledLayoutWidthRef = useRef(0);

    useEffect(() => {
        const headerElement = headerContainerRef.current;
        if (!headerElement) return;

        /**
         * Recomputes whether the header should be compact, based on its current width:
         * - While labels are showing, collapse to icons as soon as the content overflows the row,
         *   remembering the width at which that happened.
         * - While icons are showing, restore the labels only once the row is at least as wide as
         *   that remembered labeled width (otherwise it would immediately overflow and collapse again).
         */
        const updateCompactMode = () => {
            setIsCompact((currentlyCompact) => {
                if (!currentlyCompact) {
                    const labelsOverflowHeader = headerElement.scrollWidth > headerElement.clientWidth;
                    if (labelsOverflowHeader) {
                        labeledLayoutWidthRef.current = headerElement.scrollWidth;
                        return true;
                    }
                    return false;
                }
                return headerElement.clientWidth < labeledLayoutWidthRef.current;
            });
        };

        // Measure once on mount, then re-measure on every header resize.
        updateCompactMode();
        const resizeObserver = new ResizeObserver(updateCompactMode);
        resizeObserver.observe(headerElement);
        return () => resizeObserver.disconnect();
    }, []);

    return {
        isCompact,
        isDownloadModalOpen,
        openDownloadModal,
        closeDownloadModal,
        headerContainerRef,
        openFilePicker: fileUpload.openFilePicker,
    };
}
