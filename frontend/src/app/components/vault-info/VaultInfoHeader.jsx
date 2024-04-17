import { Text, Heading, Flex, Image } from '@chakra-ui/react';
import logo from '../../../images/veeva-logo.png';

export default function VaultInfoHeader() {
    return (
        <>
            <Flex alignItems='center'>
                <Image src={logo} {...ToolboxIconStyle} />
                <Heading {...PageHeaderStyle}>
                    Welcome to the Vault Developer Toolbox
                </Heading>
            </Flex>
            <Text {...TextStyle}>
                Select a tool from the left to get started.
            </Text>
        </>
    );
}

const ToolboxIconStyle = {
    boxSize: '42px',
    alt: 'Vault Developer Toolbox Icon',
    marginRight: '10px'
};

const PageHeaderStyle = {
    fontSize: '3xl',
    color: 'veeva_orange.500'
};

const TextStyle = {
    fontSize: 'lg',
    color: 'gray.600'
};
