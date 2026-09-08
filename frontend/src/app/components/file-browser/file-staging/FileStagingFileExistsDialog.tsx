import { Alert, type AlertRootProps, Button, Flex, Table, Text } from '@chakra-ui/react';
import { formatBytesToUserFriendlyFormat, formatDateTime } from '../../../services/SharedServices';
import { DialogBody, DialogContent, type DialogContentProps, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from '../../shared/ui-components/dialog';

/**
 * Warning shown when a single-file upload would overwrite an existing file. The user can confirm the
 * overwrite or cancel.
 */
interface FileStagingFileExistsDialogProps {
    isFileExistsDialogOpen: boolean;
    closeFileExistsDialog: () => void;
    confirmSingleFileOverwrite: () => void;
    fileName?: string;
    existing?: { size: number | null; modifiedDate: string | null } | null;
    file?: File | null;
}

export default function FileStagingFileExistsDialog({
    isFileExistsDialogOpen,
    closeFileExistsDialog,
    confirmSingleFileOverwrite,
    fileName,
    existing,
    file,
}: FileStagingFileExistsDialogProps) {
    return (
        <DialogRoot open={isFileExistsDialogOpen} onOpenChange={closeFileExistsDialog}>
            <DialogContent {...ModalStyle}>
                <Flex flexDirection='column'>
                    <DialogHeader>
                        <DialogTitle>File already exists</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <Text>
                            A file named <strong>{fileName}</strong> already exists in this folder.
                        </Text>
                        <Table.Root size='sm' marginTop='15px' backgroundColor='white_color_mode'>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader />
                                    <Table.ColumnHeader>Existing (in File Staging)</Table.ColumnHeader>
                                    <Table.ColumnHeader>This upload</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                <Table.Row>
                                    <Table.Cell fontWeight='bold'>Size</Table.Cell>
                                    <Table.Cell>
                                        {existing?.size != null ? formatBytesToUserFriendlyFormat(existing.size) : '—'}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {file ? formatBytesToUserFriendlyFormat(file.size) : '—'}
                                    </Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell fontWeight='bold'>Modified</Table.Cell>
                                    <Table.Cell>
                                        {existing?.modifiedDate ? formatDateTime(existing.modifiedDate) : '—'}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {file?.lastModified
                                            ? new Date(file.lastModified).toLocaleString()
                                            : '—'}
                                    </Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        </Table.Root>
                        <Alert.Root {...AlertStyle}>
                            <Alert.Indicator color='white_color_mode' />
                            <Alert.Description>Uploading will overwrite the existing file.</Alert.Description>
                        </Alert.Root>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant='subtle' onClick={closeFileExistsDialog} margin='5px'>
                            Cancel
                        </Button>
                        <Button colorPalette='orange' margin='5px' onClick={confirmSingleFileOverwrite}>
                            Overwrite
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

const AlertStyle: AlertRootProps = {
    backgroundColor: 'orange.400',
    color: 'white_color_mode',
    status: 'warning',
    marginTop: '15px',
    borderRadius: '8px',
};
