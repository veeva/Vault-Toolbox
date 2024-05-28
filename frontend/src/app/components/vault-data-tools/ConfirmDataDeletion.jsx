import { Modal, ModalOverlay, ModalContent, ModalBody, Button, ModalFooter, Alert, AlertIcon, Card, CardBody, AlertTitle, AlertDescription, Flex, VStack, FormControl, FormHelperText, Input, Spacer, Heading, TableContainer, Table, Tbody, Tr, Td, Box } from '@chakra-ui/react';
import VaultInfoTable from '../vault-info/VaultInfoTable';
import { getVaultId } from '../../services/SharedServices';

function ConfirmDataDeletion({ isOpen, onClose, onSubmit, dataType, selectedData, deleteConfirmationText, setDeleteConfirmationText }) {
    const submitDeletion = () => {
        onClose();
        onSubmit();
    };

    const canDelete = () => {
		return deleteConfirmationText === getVaultId();
	}

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent {...ModalStyle}>
                <Flex flexDirection='column'>
                    <ModalBody flex='0 0 90%'>
                        <Alert {...AlertStyle}>
                            <AlertIcon color='white' />
                            <AlertTitle>Deleting Vault Data</AlertTitle>
                            <AlertDescription>You are about to delete Vault data. THIS CANNOT BE UNDONE.</AlertDescription>
                        </Alert>
                        <VaultInfoTable />
                        <Card {...CardStyle}>
                            <CardBody>
                                <Heading {...TableHeaderStyle}>
                                    Selections:
                                </Heading>
                                <TableContainer {...TableContainerStyle}>
                                    <Table {...TableStyle}>
                                        <Tbody>
                                            <Tr>
                                                <Td {...TableColumnStyle}>Action: </Td>
                                                <Td>DELETE</Td>
                                            </Tr>
                                            <Tr>
                                                <Td {...TableColumnStyle}>Data Type: </Td>
                                                <Td>{dataType}</Td>
                                            </Tr>
                                            <Tr {...SelectedDataRowStyle}>
                                                <Td {...TableColumnStyle}>Selected Data: </Td>
                                                {
                                                    selectedData.toString()
                                                        ? (
                                                            <Td>
                                                                {selectedData.map((value, i) => <Box key={i}>{value}</Box>)}
                                                            </Td>
                                                        )
                                                        : <Td>All Objects and Documents</Td>
                                                }
                                            </Tr>
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            </CardBody>
                        </Card>
                    </ModalBody>
                    <ModalFooter minHeight='min-content'>
                        <Flex width='100%' alignItems='flex-end'>
                            <VStack width='max-content'>
                                <FormControl>
                                    <FormHelperText margin='5px'>Enter the Vault ID to enable deletion:</FormHelperText>
                                    <Input
                                        isInvalid={!canDelete()}
                                        backgroundColor='white.color_mode'
                                        value={deleteConfirmationText}
                                        onChange={(event) => setDeleteConfirmationText(event.currentTarget.value)}
                                        placeholder='Vault ID'
                                    />
                                </FormControl>
                            </VStack>
                            <Spacer />
                            <Box>
                                <Button onClick={onClose} margin='5px'>Cancel</Button>
                                <Button colorScheme='red' margin='5px' onClick={submitDeletion} isDisabled={!canDelete()}>
                                    Delete
                                </Button>
                            </Box>
                        </Flex>
                    </ModalFooter>
                </Flex>
            </ModalContent>
        </Modal>
    );
}

const ModalStyle = {
    minWidth: '50vw',
    minHeight: 'min-content',
    fontSize: 'md',
    backgroundColor: 'veeva_light_gray.color_mode'
};

const AlertStyle = {
    backgroundColor: 'red.400',
    color: 'white',
    status: 'error',
    marginBottom: '10px',
    borderRadius: '8px'
}

const CardStyle = {
    marginTop: '10px',
    maxHeight: '30vh',
    overflowY: 'auto',
    backgroundColor: 'white.color_mode',
};

const TableContainerStyle = {
    maxHeight: '35vh',
    overflowX: 'unset',
    overflowY: 'unset'
};

const TableStyle = {
    variant: 'simple',
    size: 'sm',
    overflowY: 'auto'
};

const TableHeaderStyle = {
    size: 'md',
    textTransform: 'capitalize',
    fontWeight: 'normal',
    padding: '5px'
};

const TableColumnStyle = {
    fontWeight: 'bold',
    textAlign: 'left',
    verticalAlign: 'top',
    width: '1%',
    whiteSpace: 'nowrap',
    _last: { width: '100%' }
};

const SelectedDataRowStyle = {
    maxHeight: '20vh',
    overflowY: 'auto'
};

export default ConfirmDataDeletion;
