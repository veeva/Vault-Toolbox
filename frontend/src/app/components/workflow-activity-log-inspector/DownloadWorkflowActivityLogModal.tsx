import { Button, DatePicker, Portal, VStack, Dialog as ChakraDialog } from '@chakra-ui/react';
import { PiCalendarBlank } from 'react-icons/pi';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
} from '../shared/ui-components/dialog';
import useDownloadWorkflowActivityLogModal from '../../hooks/workflow-activity-log-inspector/useDownloadWorkflowActivityLogModal';

interface DownloadWorkflowActivityLogModalProps {
    open: boolean;
    onClose: () => void;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    onDownload: (date: string) => void;
    isLoading: boolean;
}

export default function DownloadWorkflowActivityLogModal({
    open,
    onClose,
    selectedDate,
    setSelectedDate,
    onDownload,
    isLoading,
}: DownloadWorkflowActivityLogModalProps) {
    const { dateValue, maxDate, handleValueChange, handleDownload } = useDownloadWorkflowActivityLogModal({
        selectedDate,
        setSelectedDate,
        onDownload,
        onClose,
    });

    return (
        <DialogRoot open={open} onOpenChange={onClose} size='sm'>
            <DialogContent backgroundColor='white_color_mode'>
                <DialogHeader {...DialogHeaderStyle}>Retrieve Workflow Activity Log</DialogHeader>
                <DialogCloseTrigger />
                <DialogBody>
                    <VStack align='stretch' gap={4}>
                        <DatePicker.Root value={dateValue} onValueChange={handleValueChange} max={maxDate}>
                            <DatePicker.Label>Select Log Date</DatePicker.Label>
                            <DatePicker.Control>
                                <DatePicker.Input borderRadius='8px' backgroundColor='white_color_mode' />
                                <DatePicker.IndicatorGroup>
                                    <DatePicker.Trigger>
                                        <PiCalendarBlank />
                                    </DatePicker.Trigger>
                                </DatePicker.IndicatorGroup>
                            </DatePicker.Control>
                            <Portal>
                                <DatePicker.Positioner>
                                    <DatePicker.Content bg='white_color_mode'>
                                        <DatePicker.View view='day'>
                                            <DatePicker.Header />
                                            <DatePicker.DayTable />
                                        </DatePicker.View>
                                        <DatePicker.View view='month'>
                                            <DatePicker.Header />
                                            <DatePicker.MonthTable />
                                        </DatePicker.View>
                                        <DatePicker.View view='year'>
                                            <DatePicker.Header />
                                            <DatePicker.YearTable />
                                        </DatePicker.View>
                                    </DatePicker.Content>
                                </DatePicker.Positioner>
                            </Portal>
                        </DatePicker.Root>
                    </VStack>
                </DialogBody>
                <DialogFooter>
                    <Button variant='subtle' onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        backgroundColor='veeva_twilight_blue.500'
                        color='white'
                        onClick={handleDownload}
                        loading={isLoading}
                        disabled={!selectedDate}
                    >
                        Retrieve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    );
}

const DialogHeaderStyle: ChakraDialog.HeaderProps = {
    fontSize: 'lg',
    fontWeight: 'bold',
    color: 'veeva_orange_color_mode',
};
