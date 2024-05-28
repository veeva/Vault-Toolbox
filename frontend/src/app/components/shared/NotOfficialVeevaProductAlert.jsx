import { Alert, AlertIcon, AlertTitle, AlertDescription, VStack, HStack, Text, Link, Box } from '@chakra-ui/react';
import { PiArrowSquareOutLight } from 'react-icons/pi';

export default function NotOfficialVeevaProductAlert() {
    return (
        <Alert {...AlertStyle} justifyContent='center'>
            <VStack>
                <HStack justifyContent='center'>
                    <AlertIcon boxSize='30px' />
                    <AlertTitle fontSize='xl'>This is not an official Veeva product</AlertTitle>
                </HStack>
                <AlertDescription {...AlertDescriptionStyle}>
                    <Text>
                        Vault Developer Toolbox consists of open-source tools maintained by the Vault Developer Support Team.
                        Support for these tools is handled exclusively through the
                        {' '}
                        <Link href='https://veevaconnect.com/communities/ATeJ3k8lgAA/about' isExternal {...HyperlinkStyle}>
                            Vault for Developers community
                            <Box as={PiArrowSquareOutLight} display='inline' />
                        </Link>
                        {' '}
                        on Veeva Connect.
                        Vault Product Support cannot assist with these open-source tools.
                    </Text>
                </AlertDescription>
            </VStack>
        </Alert>
    );
}

const AlertStyle = {
    status: 'info',
    variant: 'subtle',
    width: '50%',
    minWidth: '500px',
    justifyContent: 'center',
    borderRadius: '8px'
};

const AlertDescriptionStyle = {
    fontSize: 'md',
    alignContent: 'center'
};

const HyperlinkStyle = {
    textDecoration: 'underline',
    color: 'hyperlink_blue.color_mode'
};
