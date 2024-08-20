import {Flex, Spacer, Box, Link, Tooltip, useDisclosure} from '@chakra-ui/react';
import {getVaultApiVersion, getVaultDns, getVaultName} from '../../services/SharedServices';
import EditApiVersionModal from './EditApiVersionModal';

export default function VaultInfoIsland({ children }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const fullVaultURL = `https://${getVaultDns()}`;
    const [vaultDomain] = getVaultDns().split('.'); // Remove .veevavault.com

    return (
        <Flex {...ParentFlexStyle}>
            <Box {...BoxStyle}>
                <Tooltip label={fullVaultURL} placement='top-end'>
                    <Link href={fullVaultURL} isExternal>
                        {getVaultName()} ({vaultDomain})
                    </Link>
                </Tooltip>
            </Box>
            <Spacer />
            {children}
            <Box>
                API Version:
                <Tooltip label='Edit Vault API Version' placement='top-start'>
                    <Link {...ApiVersionTextStyle} onClick={onOpen}>
                        {getVaultApiVersion()}
                    </Link>
                </Tooltip>
            </Box>
            { isOpen ?
                <EditApiVersionModal isOpen={isOpen} onClose={onClose} />
                : null
            }
        </Flex>
    );
}

const ParentFlexStyle = {
    height: '42px',
    width: 'calc(100% - 20px)',
    margin: '10px 0px',
    paddingX: '10px',
    borderRadius: '8px',
    align: 'center',
    backgroundColor: 'white.color_mode',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)'
};

const BoxStyle = {
    height: '42px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textDecoration: 'underline'
}

const ApiVersionTextStyle = {
    textDecoration: 'underline',
    display: 'inline',
    marginLeft: '5px',
    color: 'veeva_orange.color_mode',
}
