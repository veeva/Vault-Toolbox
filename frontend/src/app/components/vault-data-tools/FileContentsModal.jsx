import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Text, UnorderedList, ListItem } from '@chakra-ui/react';
import FileContentTable from './FileContentTable';
import ApiErrorMessageCard from '../shared/ApiErrorMessageCard';
import useFileContents from '../../hooks/vault-data-tools/useFileContents';

export default function FileContentsModal({ isOpen, onClose, cellData }) {
    const { loading, headerData, fileData, error } = useFileContents({ cellData });
    
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent {...ModalContentStyle}>
                <ModalHeader>File Contents:</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <UnorderedList paddingBottom='10px'>
                        <ListItem>
                            <Text {...ModalHeaderTextStyle}>File name</Text>
                            :
                            {cellData.split('/')[4]}
                        </ListItem>
                        <ListItem>
                            <Text {...ModalHeaderTextStyle}>File staging path</Text>
                            :
                            {cellData}
                        </ListItem>
                    </UnorderedList>
                    { !error.hasError
                        ? <FileContentTable size='sm' headers={headerData} data={fileData} loading={loading} />
                        : <ApiErrorMessageCard content='file content' errorMessage={error.errorMessage} />}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

const ModalContentStyle = {
    maxW: '80vw',
    maxH: '80vh',
    minW: '80vw',
    minH: '80vh',
    overflow: 'auto',
    fontSize: 'md'
};

const ModalHeaderTextStyle = {
    display: 'inline',
    fontWeight: 'bold'
};
