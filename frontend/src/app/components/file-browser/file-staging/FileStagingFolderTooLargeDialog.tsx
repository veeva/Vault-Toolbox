import { Button, Flex, Text } from '@chakra-ui/react';
import { MAX_FOLDER_UPLOAD_FILES } from '../../../hooks/file-browser/file-staging/useFileStagingUpload';
import { DialogBody, DialogContent, type DialogContentProps, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from '../../shared/ui-components/dialog';

/**
 * Shown when a picked folder exceeds the supported file count. Folder uploads are one API call per file,
 * so the uploader is capped to keep it performant; this dialog states the limit clearly (instead of a
 * silent no-op) and points the user at a smaller subfolder or a bulk path. Acknowledgment-only.
 */
interface FileStagingFolderTooLargeDialogProps {
    isFolderTooLargeDialogOpen: boolean;
    closeFolderTooLargeDialog: () => void;
    oversizedFolderFileCount: number;
}

export default function FileStagingFolderTooLargeDialog({
    isFolderTooLargeDialogOpen,
    closeFolderTooLargeDialog,
    oversizedFolderFileCount,
}: FileStagingFolderTooLargeDialogProps) {
    return (
        <DialogRoot open={isFolderTooLargeDialogOpen} onOpenChange={closeFolderTooLargeDialog}>
            <DialogContent {...ModalStyle}>
                <Flex flexDirection='column'>
                    <DialogHeader>
                        <DialogTitle>Folder too large</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <Text>
                            This folder has {oversizedFolderFileCount.toLocaleString()} files. The uploader supports up to{' '}
                            {MAX_FOLDER_UPLOAD_FILES.toLocaleString()} files at a time. Upload a smaller subfolder instead.
                        </Text>
                    </DialogBody>
                    <DialogFooter>
                        <Button colorPalette='orange' margin='5px' onClick={closeFolderTooLargeDialog}>
                            OK
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

