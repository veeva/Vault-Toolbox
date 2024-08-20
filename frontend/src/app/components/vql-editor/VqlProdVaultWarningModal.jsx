import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Box,
    useDisclosure,
    Link
} from '@chakra-ui/react';

export default function VqlProdVaultWarningModal() {
    const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
        >
            <ModalOverlay />
            <ModalContent backgroundColor='white.color_mode'>
                <ModalHeader paddingY='10px'>Production Vault Warning</ModalHeader>
                <ModalCloseButton {...ModelCloseButtonStyle} />
                <ModalBody paddingY='0px' fontSize='md'>
                    <Box>
                        You are about to run VQL Queries against a Production Vault, which may affect end-user experience.
                    </Box>
                    <Box marginTop='10px'>
                        Please follow <Link href='https://developer.veevavault.com/vql/#query-performance-best-practices' isExternal {...HyperlinkStyle}>VQL Best Practices</Link> to minimize the effect of the queries on the Vault.
                    </Box>
                </ModalBody>
                <ModalFooter paddingY='10px' />
            </ModalContent>
        </Modal>
    );
}

const ModelCloseButtonStyle = {
    position: 'absolute',
    top: '10px',
    right: '24px'
}

const HyperlinkStyle = {
    textDecoration: 'underline',
    color: 'hyperlink_blue.color_mode'
};
