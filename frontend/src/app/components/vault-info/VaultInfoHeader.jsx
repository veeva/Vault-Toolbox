import { Text, Heading, Flex, Image } from '@chakra-ui/react';
import logo from '../../../images/veeva-logo.png';

export default function VaultInfoHeader() {
    return (
        <>
            <Flex alignItems='center'>
                <Image src={logo} {...ToolboxIconStyle} />
                <Heading {...PageHeaderStyle}>
                    Welcome to Vault Toolbox
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
    alt: 'Vault Toolbox Icon',
    marginRight: '10px'
};

const PageHeaderStyle = {
    fontSize: '3xl',
    color: 'veeva_orange.color_mode'
};

const TextStyle = {
    fontSize: 'lg',
    color: 'text.color_mode'
};
