import { AlertDialog, AlertDialogHeader, AlertDialogOverlay, AlertDialogContent, AlertDialogBody, AlertDialogFooter, Button } from '@chakra-ui/react';

export default function OutstandingAsyncJobWarning({ isOpen, onClose, onConfirm, currentComponent }) {
    const clearAsyncJob = () => {
        onClose();
        onConfirm(currentComponent);
    };

    return (
        <AlertDialog
            isOpen={isOpen}
            onClose={onClose}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                        Outstanding Async Job Request
                    </AlertDialogHeader>

                    <AlertDialogBody fontSize='lg'>
                        You have an outstanding asynchrynous MDL job request. If you continue, your job results will be cleared.
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button onClick={onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme='red' onClick={clearAsyncJob} ml={3}>
                            Continue
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
}
