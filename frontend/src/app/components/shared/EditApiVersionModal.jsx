import {
    Button,
    Center, Icon,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Spinner, Text
} from '@chakra-ui/react';
import {PiFloppyDisk} from 'react-icons/pi';
import useEditApiVersion from '../../hooks/shared/useEditApiVersion';
import ApiErrorMessageCard from './ApiErrorMessageCard';

export default function EditApiVersionModal({ isOpen, onClose }) {
    const {
        selectedApiVersion,
        setSelectedApiVersion,
        apiVersions,
        vaultApiVersionsError,
        loadingVaultApiVersions,
        handleSave,
        handleModalClose
    } = useEditApiVersion({ onClose })

    return (
        <Modal isOpen={isOpen} onClose={handleModalClose} size='sm'>
            <ModalOverlay />
            <ModalContent backgroundColor='white.color_mode'>
                <ModalHeader>Set Vault API Version</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    { !vaultApiVersionsError.hasError
                        ?
                            <>
                                { !loadingVaultApiVersions
                                    ? (
                                        <Select
                                            size='sm'
                                            value={selectedApiVersion}
                                            onChange={(e) => setSelectedApiVersion(e.target.value)}
                                        >
                                            { apiVersions.map((apiVersion) => {
                                                return <option value={apiVersion} key={apiVersion}>{apiVersion}</option>
                                            })}
                                        </Select>
                                    )
                                    : <Center><Spinner /></Center>
                                }
                            </>
                        : <ApiErrorMessageCard content='Vault API Versions' errorMessage={vaultApiVersionsError.errorMessage} />
                    }
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleSave} {...SaveButtonStyle}>
                        <Icon as={PiFloppyDisk} boxSize={5} marginRight='5px' />
                        <Text>Save</Text>
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

const SaveButtonStyle = {
    variant: 'solid',
    size: 'sm',
    colorScheme: 'blue',
    margin: '5px',
    padding: '10px'
};

