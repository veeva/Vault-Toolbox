import { Modal, ModalOverlay, ModalContent, ModalBody, Button, ModalFooter, Flex, Spacer, Box, ModalHeader, ModalCloseButton, Text
} from '@chakra-ui/react';
import {useRef} from 'react';

export default function VqlConfirmQueryDeletionModal({ isOpen, onClose, onSubmit, savedQueryName }) {
    const deleteQueryButtonRef = useRef(null);
    const submitQueryDeletion = () => {
        onClose();
        onSubmit();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size='sm'
            initialFocusRef={deleteQueryButtonRef}
        >
            <ModalOverlay />
            <ModalContent backgroundColor='white.color_mode'>
                <ModalHeader paddingY='10px'>Delete Saved Query?</ModalHeader>
                <ModalCloseButton {...ModelCloseButtonStyle} />
                <ModalBody paddingY='10px'>
                    <Text fontSize='sm'>This will delete your saved query '{savedQueryName}'</Text>
                </ModalBody>
                <ModalFooter paddingY='10px'>
                    <Flex width='100%'>
                        <Spacer />
                        <Box>
                            <Button onClick={onClose} {...CancelButtonStyle}>Cancel</Button>
                            <Button onClick={submitQueryDeletion} ref={deleteQueryButtonRef} {...DeleteButtonStyle}>
                                Delete
                            </Button>
                        </Box>
                    </Flex>
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

const CancelButtonStyle = {
    marginRight: '5px',
    size: 'sm'
}

const DeleteButtonStyle = {
    size: 'sm',
    colorScheme: 'red'
}