import { Button, Flex, Text } from '@chakra-ui/react';
import { DialogBody, DialogContent, type DialogContentProps, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from '../../shared/ui-components/dialog';

/**
 * Confirmation dialog shown before a folder upload. Lets the user choose, once for the whole load,
 * whether files that already exist at their destination should be overwritten or skipped.
 */
interface FileStagingOverwriteUploadDialogProps {
    isOverwritePromptOpen: boolean;
    closeOverwritePrompt: () => void;
    confirmFolderUpload: (overwrite: boolean) => void;
    pendingFolderFileCount: number;
}

export default function FileStagingOverwriteUploadDialog({
    isOverwritePromptOpen,
    closeOverwritePrompt,
    confirmFolderUpload,
    pendingFolderFileCount,
}: FileStagingOverwriteUploadDialogProps) {
    return (
        <DialogRoot open={isOverwritePromptOpen} onOpenChange={closeOverwritePrompt}>
            <DialogContent {...ModalStyle}>
                <Flex flexDirection='column'>
                    <DialogHeader>
                        <DialogTitle>Upload folder</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <Text>
                            Uploading {pendingFolderFileCount} file{pendingFolderFileCount === 1 ? '' : 's'}. If a file already exists at
                            its destination, choose whether to overwrite it or skip it.
                        </Text>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant='subtle' onClick={closeOverwritePrompt} margin='5px'>
                            Cancel
                        </Button>
                        <Button variant='subtle' onClick={() => confirmFolderUpload(false)} margin='5px'>
                            Skip existing
                        </Button>
                        <Button colorPalette='orange' margin='5px' onClick={() => confirmFolderUpload(true)}>
                            Overwrite existing
                        </Button>
                    </DialogFooter>
                </Flex>
            </DialogContent>
        </DialogRoot>
    );
}

const ModalStyle: DialogContentProps = {
    minWidth: '40vw',
    minHeight: 'min-content',
    fontSize: 'md',
    backgroundColor: 'veeva_light_gray_color_mode',
};
