import { Button, Icon, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from '@chakra-ui/react';
import { useRef } from 'react';
import { PiFloppyDisk } from 'react-icons/pi';
import { CreatableSelect } from 'chakra-react-select';

export default function VqlSaveQueryModal({ code, isOpen, handleModalClose, savedQueryOptions, selectedQueryName, setSelectedQueryName, handleSave }) {
    const saveQueryInputRef = useRef(null)

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleModalClose}
            initialFocusRef={saveQueryInputRef}
            size='sm'
        >
            <ModalOverlay />
            <ModalContent backgroundColor='white.color_mode'>
                <ModalHeader paddingY='10px'>Save Query</ModalHeader>
                <ModalCloseButton {...ModelCloseButtonStyle} />
                <ModalBody paddingY='0px'>
                    <CreatableSelect
                        size='sm'
                        isClearable
                        placeholder='Save query as...'
                        options={savedQueryOptions}
                        value={selectedQueryName}
                        onChange={(newValue) => setSelectedQueryName(newValue)}
                        formatCreateLabel={selectedQueryName => `Save as: ${selectedQueryName}`}
                        ref={saveQueryInputRef}
                    />
                </ModalBody>
                <ModalFooter paddingY='10px'>
                    <Button onClick={() => handleSave(code)} {...SaveButtonStyle}>
                        <Icon as={PiFloppyDisk} boxSize={5} marginRight='5px' />
                        <Text>Save</Text>
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

const ModelCloseButtonStyle = {
    position: 'absolute',
    top: '10px',
    right: '24px'
}

const SaveButtonStyle = {
    variant: 'solid',
    size: 'sm',
    colorScheme: 'blue',
    padding: '10px'
};

