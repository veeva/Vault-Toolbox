import { Button, Text } from '@chakra-ui/react';
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../shared/ui-components/dialog';

interface ErdRecursiveConfirmDialogProps {
    open: boolean;
    count: number;
    onConfirm: () => void;
    onCancel: () => void;
}

/** Confirmation shown before a large recursive expansion (>100 objects) — nothing is added until Add. */
export default function ErdRecursiveConfirmDialog({ open, count, onConfirm, onCancel }: ErdRecursiveConfirmDialogProps) {
    return (
        <DialogRoot
            role='alertdialog'
            open={open}
            onOpenChange={(event) => {
                if (!event.open) onCancel();
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add {count} related objects?</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <Text fontSize='sm'>
                        This expansion would add <b>{count}</b> objects to the canvas — a large diagram. Add them all, or
                        cancel and expand a smaller depth?
                    </Text>
                </DialogBody>
                <DialogFooter>
                    <Button variant='outline' onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button backgroundColor='veeva_twilight_blue.500' color='white' onClick={onConfirm}>
                        Add {count}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    );
}
