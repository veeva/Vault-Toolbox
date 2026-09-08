import { Box, type BoxProps, Button, Flex, Progress, Spinner, Text } from '@chakra-ui/react';
import { PiCheckCircleFill, PiWarningCircleFill } from 'react-icons/pi';
import { deriveFolderUploadDisplay, FolderUploadPhase, FolderUploadProgress } from '../../../utils/file-browser/FileBrowserHelper';
import { DialogBody, DialogContent, type DialogContentProps, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from '../../shared/ui-components/dialog';

/**
 * Progress feedback for a folder upload:
 *  - 'creating': building the folder structure in Vault, before any file is sent.
 *  - 'uploading': files are being sent, with an X-of-N count and bar.
 *  - 'done': finished, showing a summary (uploaded / skipped / failed / cancelled) until the user closes it.
 */
interface FolderUploadProgressModalProps {
    folderUploadPhase: FolderUploadPhase;
    folderUploadProgress: FolderUploadProgress;
    folderUploadFailures: { name: string; reason: string }[];
    closeFolderUploadModal: () => void;
    cancelFolderUpload: () => void;
}

export default function FolderUploadProgressModal({
    folderUploadPhase,
    folderUploadProgress,
    folderUploadFailures,
    closeFolderUploadModal,
    cancelFolderUpload,
}: FolderUploadProgressModalProps) {
    if (folderUploadPhase === FolderUploadPhase.Idle) {
        return null;
    }

    const { completed, total, failed, skipped } = folderUploadProgress;
    const { isCreating, isUploading, isDone, cancelled, pct, doneSummary, title } = deriveFolderUploadDisplay(folderUploadPhase, folderUploadProgress);

    return (
        <DialogRoot open={true} closeOnInteractOutside={false}>
            <DialogContent {...ModalStyle}>
                <Flex flexDirection='column'>
                    <DialogHeader>
                        <DialogTitle>
                            <Flex alignItems='center' gap='8px'>
                                {(isCreating || isUploading) && <Spinner size='sm' />}
                                {isDone &&
                                    (failed > 0 || cancelled ? (
                                        <PiWarningCircleFill style={{ color: 'orange' }} size={20} />
                                    ) : (
                                        <PiCheckCircleFill style={{ color: 'green' }} size={20} />
                                    ))}
                                {title}
                            </Flex>
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        {isCreating && (
                            <Text>Creating Folder Structure in Vault File Staging. This can take a moment for larger directories…</Text>
                        )}
                        {isUploading && (
                            <Flex flexDirection='column' gap='10px'>
                                <Text>
                                    Uploading {completed} of {total} file{total === 1 ? '' : 's'}
                                    {skipped > 0 ? `, ${skipped} skipped` : ''}
                                    {failed > 0 ? `, ${failed} failed` : ''}…
                                </Text>
                                <Progress.Root value={pct} max={100} size='sm' colorPalette='orange'>
                                    <Progress.Track>
                                        <Progress.Range />
                                    </Progress.Track>
                                </Progress.Root>
                            </Flex>
                        )}
                        {isDone && (
                            <Flex flexDirection='column' gap='8px'>
                                <Text>{doneSummary}</Text>
                                {folderUploadFailures.length > 0 && (
                                    <>
                                        <Box {...FailureListStyle}>
                                            {folderUploadFailures.map((failure, index) => (
                                                <Text key={`${failure.name}-${index}`}>
                                                    <b>{failure.name}</b>: {failure.reason}
                                                </Text>
                                            ))}
                                        </Box>
                                    </>
                                )}
                            </Flex>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <Box>
                            {(isCreating || isUploading) && (
                                <Button variant='subtle' colorPalette='gray' margin='5px' onClick={cancelFolderUpload}>
                                    Cancel
                                </Button>
                            )}
                            {isDone && (
                                <Button variant='subtle' colorPalette='gray' margin='5px' onClick={closeFolderUploadModal}>
                                    Close
                                </Button>
                            )}
                        </Box>
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

const FailureListStyle: BoxProps = {
    maxHeight: '180px',
    overflowY: 'auto',
    borderWidth: '1px',
    borderColor: 'gray.300',
    borderRadius: '6px',
    padding: '8px',
    fontSize: 'sm',
};
