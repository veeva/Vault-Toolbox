import { Flex } from '@chakra-ui/react';
import ErrorBoundaryCard from '../components/shared/ErrorBoundaryCard';

export default function ErrorPage({ error, resetErrorBoundary }) {

    return (
        <Flex {...PageFlexStyle}>
            <ErrorBoundaryCard error={error} resetErrorBoundary={resetErrorBoundary} />
        </Flex>
    );
}

const PageFlexStyle = {
    minHeight: '100vh',
    align: 'center',
    justify: 'center',
    backgroundColor: 'veeva_light_gray.color_mode',
    boxShadow: 'inset -5px 0 8px -8px gray, inset 5px 0 8px -8px gray'
};
