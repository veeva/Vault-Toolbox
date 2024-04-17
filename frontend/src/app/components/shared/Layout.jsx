'use client';

import React from 'react';
import { Flex, Box } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorPage from '../../pages/ErrorPage';
import useVaultSessionKeepAlive from '../../hooks/shared/useVaultSessionKeepAlive';

export default function Layout() {
    useVaultSessionKeepAlive();

    return (
        <Flex height='100vh'>
            <Box flex='none' width='auto'><Sidebar /></Box>
            <Box flex={1} overflow='auto'>
                <ErrorBoundary fallbackRender={ErrorPage}>
                    <Outlet />
                </ErrorBoundary>
            </Box>
        </Flex>
    );
}
