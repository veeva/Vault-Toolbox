import { Stack, Flex, Center, Spinner, Box } from '@chakra-ui/react';
import VaultInfoTable from '../components/vault-info/VaultInfoTable';
import ApiErrorMessageCard from '../components/shared/ApiErrorMessageCard';
import NotOfficialVeevaProductAlert from '../components/shared/NotOfficialVeevaProductAlert';
import VaultInfoHeader from '../components/vault-info/VaultInfoHeader';
import useVaultInfo from '../hooks/vault-info/useVaultInfo';

export default function VaultInfoPage() {
    const { loadingVaultInfo, vaultInfoError } = useVaultInfo();

    return (
        <Flex {...PageFlexStyle}>
            <Stack {...PageStackStyle}>
                <VaultInfoHeader />
                { loadingVaultInfo ? <Center><Spinner /></Center>
                    : (
                        <Box>
                            { vaultInfoError.hasError
                                ? <ApiErrorMessageCard content='Vault Information' errorMessage={vaultInfoError.errorMessage} />
                                : <VaultInfoTable />}
                        </Box>
                    )}
                <NotOfficialVeevaProductAlert />
            </Stack>
        </Flex>
    );
}

const PageFlexStyle = {
    minHeight: '100vh',
    align: 'center',
    justify: 'center',
    backgroundColor: 'veeva_light_gray.100',
    boxShadow: 'inset -5px 0 8px -8px gray, inset 5px 0 8px -8px gray'
};

const PageStackStyle = {
    spacing: 8,
    marginX: 'auto',
    maxWidth: '80%',
    paddingY: 12,
    paddingX: 6,
    align: 'center'
};
