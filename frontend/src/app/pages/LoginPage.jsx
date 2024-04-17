import { Flex, Stack, Heading, Text } from '@chakra-ui/react';
import LoginCard from '../components/login/LoginCard';

export default function LoginPage() {
    return (
        <Flex {...PageFlexStyle}>
            <Stack {...PageStackStyle}>
                <Stack align='center'>
                    <Heading {...PageHeaderStyle}>
                        Welcome to the Vault Developer Toolbox
                    </Heading>
                    <Text {...TextStyle}>
                        To get started, login to a Vault.
                    </Text>
                </Stack>
                <LoginCard />
            </Stack>
        </Flex>
    );
}

const PageFlexStyle = {
    minHeight: '100vh',
    align: 'center',
    justify: 'center',
    backgroundColor: 'veeva_light_gray.100',
    flexDirection: 'column'
};

const PageStackStyle = {
    spacing: 8,
    marginX: 'auto',
    maxWidth: 'xl',
    paddingY: 12,
    paddingX: 6
};

const PageHeaderStyle = {
    fontSize: '2xl',
    color: 'veeva_orange.500'
};

const TextStyle = {
    fontSize: 'lg',
    color: 'black'
};
