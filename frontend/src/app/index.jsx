import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from './context/AuthContext';
import { veevaTheme } from './utils/VeevaTheme';
import App from './App';

const index = (
    <AuthProvider>
        <ChakraProvider theme={veevaTheme}>
            <App />
        </ChakraProvider>
    </AuthProvider>
);

const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
root.render(index);
