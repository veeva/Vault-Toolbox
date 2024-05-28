/* eslint-disable no-param-reassign */
import { IconButton, TableContainer, Table, Thead, Tr, Th, Tbody, Td, Center, Editable, EditableInput, EditablePreview, Checkbox, Alert, AlertIcon, Flex, Box, Icon, Text, Button } from '@chakra-ui/react';
import { PiCheck, PiMinusCircle, PiPlus, PiFloppyDisk } from 'react-icons/pi';
import useSavedVaultsTable from '../../hooks/login/useSavedVaultsTable';

export default function SavedVaultsTable({ savedVaultData, setSavedVaultData, setVaultDNS, setUsername, setFocusToPasswordInput, isEditable, toggleEditMode }) {
    const VAULT_DNS = 'vaultDNS';
    const USERNAME = 'username';

    const {
        defaultVaultRowIndex,
        newEditableRowRef,
        handleRowClick,
        handleSavedVaultEdits,
        handleDefaultRowChanged,
        addNewEditableRow,
        removeRow,
        focusOnNewRow
    } = useSavedVaultsTable({ savedVaultData, setSavedVaultData, setVaultDNS, setUsername, setFocusToPasswordInput, isEditable })

    return (
        <Flex flexDirection='column' height='100%'>
            <Box {...TableBoxStyle}>
                <TableContainer {...TableContainerStyle}>
                    <Table {...TableStyle}>
                        <Thead {...ThStyle}>
                            <Tr>
                                <Th>Vault DNS</Th>
                                <Th>Username</Th>
                                <Th>Default?</Th>
                                { isEditable && <Th /> }
                            </Tr>
                        </Thead>
                        <Tbody>
                            {savedVaultData.map((savedVault, savedVaultRowIndex) => (
                                <Tr key={savedVaultRowIndex} onClick={() => handleRowClick(savedVaultRowIndex)} {...TrStyle}>
                                    <Td>
                                        <Editable
                                            defaultValue={savedVault?.vaultDNS}
                                            value={savedVault?.vaultDNS}
                                            isDisabled={!isEditable}
                                            onChange={(value) => handleSavedVaultEdits(value, savedVaultRowIndex, VAULT_DNS)}
                                        >
                                            <EditablePreview {...EditablePreviewStyle} ref={savedVaultRowIndex === savedVaultData.length - 1 ? newEditableRowRef : null} />
                                            <EditableInput />
                                        </Editable>
                                    </Td>
                                    <Td>
                                        <Editable
                                            defaultValue={savedVault?.username}
                                            value={savedVault?.username}
                                            isDisabled={!isEditable}
                                            onChange={(value) => handleSavedVaultEdits(value, savedVaultRowIndex, USERNAME)}
                                        >
                                            <EditablePreview {...EditablePreviewStyle} />
                                            <EditableInput />
                                        </Editable>
                                    </Td>
                                    <Td>
                                        <Center>
                                            {isEditable
                                                ? <Checkbox value={savedVaultRowIndex} isChecked={defaultVaultRowIndex === savedVaultRowIndex} onChange={() => handleDefaultRowChanged(savedVaultRowIndex)} />
                                                : (
                                                    <Box>
                                                        {savedVault.default && <PiCheck /> }
                                                    </Box>
                                                )}
                                        </Center>
                                    </Td>
                                    { isEditable
                                            && (
                                                <Td padding={0}>
                                                    <IconButton
                                                        icon={<PiMinusCircle />}
                                                        onClick={() => removeRow(savedVaultRowIndex)}
                                                        {...RemoveRowButtonStyle}
                                                    />
                                                </Td>
                                            )}
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            </Box>
            { isEditable
                && (
                    <Box>
                        { savedVaultData.length < 100
                            ? (
                                <>
                                    <Button {...AddRowButtonStyle} onClick={() => { addNewEditableRow(); setTimeout(focusOnNewRow, 100); }}>
                                        <Icon as={PiPlus} boxSize={5} />
                                        <Text>Add Row</Text>
                                    </Button>
                                    <Button {...SaveButtonStyle} onClick={toggleEditMode}>
                                        <Icon as={PiFloppyDisk} boxSize={5} />
                                        <Text>Save</Text>
                                    </Button>
                                </>
                            )
                            : (
                                <Alert status='warning'>
                                    <AlertIcon />
                                    You have reached the max allowed number of saved Vaults (100).
                                </Alert>
                            )}
                    </Box>
                )}
        </Flex>
    );
}

const TableBoxStyle = {
    overflowY: 'auto',
    marginY: '10px',
    maxHeight: '80vh'
};

const TableContainerStyle = {
    maxWidth: '100%',
    maxHeight: '95%',
    borderRadius: '8px',
    overflowX: 'unset',
    overflowY: 'unset',
    backgroundColor: 'white.color_mode'
};

const TableStyle = {
    variant: 'simple',
    size: 'sm',
    maxHeight: '100px',
    overflow: 'auto'
};

const ThStyle = {
    backgroundColor: 'white.color_mode',
    position: 'sticky',
    top: 0,
    border: 'none',
    zIndex: 10
};

const TrStyle = {
    _hover: {
        bg: 'gray.background.color_mode',
        cursor: 'pointer'
    }
};

const EditablePreviewStyle = {
    _hover: {
        bg: 'gray.background.color_mode',
        cursor: 'pointer'
    },
    minWidth: '150px'
};

const RemoveRowButtonStyle = {
    size: 'md',
    variant: 'ghost',
    colorScheme: 'red'
};

const AddRowButtonStyle = {
    variant: 'outline',
    size: 'sm',
    position: 'sticky',
    bottom: '0',
    colorScheme: 'blue',
    marginLeft: '5px',
    marginTop: '10px',
    padding: '5px'
};

const SaveButtonStyle = {
    variant: 'solid',
    size: 'sm',
    position: 'sticky',
    bottom: '0',
    colorScheme: 'blue',
    marginLeft: '5px',
    marginTop: '10px',
    padding: '5px'
};
