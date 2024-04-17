import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor-core';

export default function CodeEditor({ code, setCode, language, theme }) {
    const containerRef = useRef();
    const editorRef = useRef();

    if (theme) {
        monaco.editor.defineTheme(language, theme);
        monaco.editor.setTheme(language);
    } else {
        monaco.editor.setTheme('default');
    }

    const EditorSettings = {
        value: code,
        language,
        autoIndent: 'full',
        contextmenu: true,
        fontFamily: 'monospace',
        fontSize: 16,
        lineHeight: 30,
        hideCursorInOverviewRuler: true,
        matchBrackets: 'always',
        minimap: { enabled: false },
        scrollbar: {
            horizontalSliderSize: 8,
            verticalSliderSize: 18
        },
        selectOnLineNumbers: true,
        roundedSelection: false,
        readOnly: false,
        cursorStyle: 'line',
        automaticLayout: true,
        'bracketPairColorization.enabled': false,
        mouseWheelZoom: true,
        stickyScroll: { enabled: true },
        scrollBeyondLastLine: false
    };

    useEffect(() => {
        editorRef.current = monaco.editor.create(containerRef.current, EditorSettings);

        // Update code state as user types code in the editor
        editorRef.current.onDidChangeModelContent(() => {
            setCode(editorRef.current.getValue());
        });

        return () => {
            if (editorRef.current) {
                editorRef.current.dispose();
            }
        };
    }, []);

    // If the code state changes (e.g. due to selecting a new component), update the code in the editor
    useEffect(() => {
        if (editorRef.current && (code !== editorRef.current.getValue())) {
            editorRef.current.setValue(code);
        }
    }, [code]);

    return (
        <div ref={containerRef} style={{ height: '99%' }} />
    );
}
