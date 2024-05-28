import { Card, CardBody, Alert, AlertIcon, AlertTitle, AlertDescription, Box } from '@chakra-ui/react';

export default function ApiErrorMessageCard({ content, errorMessage }) {
    const alertTitleText = content ? (`retrieving ${content}`) : 'processing your request';

    return (
        <Card backgroundColor='white.color_mode'>
            <CardBody>
                <Alert status='error' variant='left-accent'>
                    <AlertIcon />
                    <Box>
                        <AlertTitle>
                            Error
                            {' '}
                            {alertTitleText}
                            :
                            {' '}
                        </AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Box>
                </Alert>
            </CardBody>
        </Card>
    );
}
