import * as monaco from 'monaco-editor-core';

export const mdlLanguageID = 'mdl';
const languageExtensionPoint = { id: mdlLanguageID };

export function setupMdlLanguage() {
    (window).MonacoEnvironment = {
        getWorkerUrl(moduleId, label) {
            return './editor.worker.js';
        }
    };
    
    monaco.languages.register(languageExtensionPoint);
    
    monaco.languages.onLanguage(mdlLanguageID, () => {
        monaco.languages.setMonarchTokensProvider(mdlLanguageID, mdlLanguage);
        monaco.languages.setLanguageConfiguration(mdlLanguageID, richLanguageConfiguration);
    });
}

const richLanguageConfiguration = {
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
    ],
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
    ],
    surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
    ]
};

const mdlLanguage = {
    // Set defaultToken to invalid to see what you do not tokenize yet
    defaultToken: '',
    brackets: [
        { open: '(', close: ')', token: 'delimiter.parenthesis' }
    ],
    keywords: [
        'COMPLETE', 'ADD', 'ALTER', 'CREATE', 'DROP', 'RECREATE', 'RENAME'
    ],
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    // The main tokenizer for our languages
    tokenizer: {
        root: [
            // default text
            [/^Select a component record from the tree to view its MDL code$/, 'entity.mdl.defaulttext'],
            [/^Error. Could not retrieve MDL code for this component.$/, 'entity.mdl.defaulttext'],
            // parenthesis
            [/[()]/, '@brackets'],
            // identifiers and keywords
            [/[a-zA-Z_$][\w$]*/, {
                cases: {
                    '\\b([A-Z ]+)\\b': 'keyword', // Command
                    '\\b([A-Z][a-z])(\\S*?)\\b': 'type.mdl.componenttype', // Component Type
                    '\\b(\\w*__\\w*)\\b': 'variable.mdl.componentrecord', // Component Record
                    '(?<![A-Z])\\b(?!\\w*__\\w*)\\w+\\b(?<!false|true)(?<![0-9])': 'entity.mdl.property',
                    '(?<![A-Z])\\b(?!\\w*__\\w*)\\w+\\b(?<!false|true)(?![0-9])': 'entity.mdl.checksum',
                    '^(true|false)$': 'entity.mdl.boolean',
                    '@default': 'identifier'
                }
            }],
            // whitespace
            { include: '@whitespace' },
            // strings
            [/'.*?'/, 'string'],
            [/".*?"/, 'string']
        ],
        whitespace: [
            [/[ \t\r\n]+/, '']
        ],
        string: [
            [/[^\\"]+/, 'string'],
            [/@escapes/, 'string.escape'],
            [/\\./, 'string.escape.invalid'],
            [/"/, 'string', '@pop']
        ]
    }
};

export const MdlTheme = {
    base: 'vs',
    inherit: true,
    rules: [
        {
            token: 'keyword',
            foreground: 'F7981D'
        },
        {
            token: 'type.mdl.componenttype',
            foreground: '1A76A3',
            fontStyle: 'bold'
        },
        {
            token: 'variable.mdl.componentrecord',
            foreground: '1A76A3',
            fontStyle: 'italic'
        },
        {
            token: 'entity.mdl.property',
            foreground: '1B2F54'
        },
        {
            token: 'entity.mdl.checksum',
            foreground: '1B2F54'
        },
        {
            token: 'entity.mdl.boolean',
            foreground: 'DB6015'
        },
        {
            token: 'string',
            foreground: '2F855A'
        },
        {
            token: 'entity.mdl.defaulttext',
            foreground: '1B2F54'
        }
    ],
    colors: {}
};
