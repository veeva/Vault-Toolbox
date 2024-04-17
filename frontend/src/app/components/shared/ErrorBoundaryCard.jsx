import { Card, CardBody, Alert, AlertIcon, AlertTitle, Box, Flex, Spacer, Button, Heading, Text, Divider, Link } from '@chakra-ui/react';
import { PiArrowSquareOutLight, PiArrowClockwise } from 'react-icons/pi';

export default function ErrorBoundaryCard({ error, resetErrorBoundary }) {

    return (
        <Card maxWidth={'800px'} overflow={'auto'}>
            <CardBody>
                <Flex flexDirection={'column'} minHeight={'100px'} flex={1}>
                    <Box>
                        <Alert status='error' variant='left-accent'>
                            <Flex alignItems={'center'} flex={1}>
                                <AlertIcon />
                                <AlertTitle fontSize={'xl'}>
                                    Unexpected Error
                                </AlertTitle>
                                <Spacer />
                                <Button onClick={resetErrorBoundary} rightIcon={<PiArrowClockwise />}>Retry</Button>
                            </Flex>
                        </Alert>
                        <Flex alignItems='center'>
                            <Heading size='sm' margin='10px'>
                                Error Message:
                            </Heading>
                            <Text fontSize={'md'}>{error?.message}</Text>
                        </Flex>
                        <Flex alignItems='flex-start'>
                            <Heading size='sm' margin='10px' marginTop={0} minWidth={'max-content'}>
                                Error Stack:
                            </Heading>
                            <Text overflow={'auto'} fontSize={'md'}>{error?.stack}</Text>
                        </Flex>
                    </Box>
                    <Spacer />
                    <Box paddingTop={'10px'}>
                        <Divider borderColor={'gray.500'} />
                        <Text margin={'10px'} marginBottom={0} fontSize={'md'}>
                            If the issue persists, please report it via the <Link href='https://veevaconnect.com/communities/ATeJ3k8lgAA/about' isExternal {...HyperlinkStyle}>Vault for Developers community<Box as={PiArrowSquareOutLight} display='inline' /></Link> on Veeva Connect.
                        </Text>
                    </Box>
                </Flex>
            </CardBody>
        </Card>
    );
}

const HyperlinkStyle = {
    textDecoration: 'underline',
    color: '#0000EE'
}
