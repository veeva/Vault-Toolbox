import { useMemo } from 'react';
import { parseDate, type DatePicker, type DateValue } from '@chakra-ui/react';

interface UseDownloadWorkflowActivityLogModalParams {
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    onDownload: (date: string) => void;
    onClose: () => void;
}

/**
 * Bridges the modal's string-based date contract (YYYY-MM-DD) to the Chakra DatePicker, which
 * works in DateValue arrays. Keeps all string<->DateValue conversion out of the presentation layer.
 */
export default function useDownloadWorkflowActivityLogModal({
    selectedDate,
    setSelectedDate,
    onDownload,
    onClose,
}: UseDownloadWorkflowActivityLogModalParams) {
    /** The selected date as the DateValue array the DatePicker expects; empty until a date is chosen. */
    const dateValue = useMemo<DateValue[]>(
        () => (selectedDate ? [parseDate(selectedDate)] : []),
        [selectedDate],
    );

    /** Today as a DateValue, used to disable future dates in the calendar. */
    const maxDate = useMemo<DateValue>(() => parseDate(new Date().toISOString().split('T')[0]), []);

    /** Stores the picked date back as a YYYY-MM-DD string, or clears it when the selection is removed. */
    const handleValueChange = (details: DatePicker.ValueChangeDetails) => {
        setSelectedDate(details.value[0]?.toString() ?? '');
    };

    /** Triggers the download for the chosen date and closes the modal. */
    const handleDownload = () => {
        onDownload(selectedDate);
        onClose();
    };

    return { dateValue, maxDate, handleValueChange, handleDownload };
}
