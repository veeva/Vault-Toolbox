import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            'monaco-editor-core': path.resolve(__dirname, 'node_modules/monaco-editor-core/esm/vs/editor/editor.main.js'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        css: true,
    },
});
