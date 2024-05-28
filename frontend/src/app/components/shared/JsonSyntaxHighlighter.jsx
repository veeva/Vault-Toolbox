import {memo} from 'react';
import {useColorMode} from '@chakra-ui/react';
import SyntaxHighlighter from 'react-syntax-highlighter';

export default memo(({dataToDisplay}) => {
    const displayData = typeof dataToDisplay === 'string' ? dataToDisplay : JSON.stringify(dataToDisplay, null, 4);
    const {colorMode} = useColorMode();

    return (
        <SyntaxHighlighter
            language='json'
            style={colorMode === 'light' ? veevaJsonStyleLightMode : veevaJsonStyleDarkMode}
            wrapLongLines
        >
            {displayData}
        </SyntaxHighlighter>
    );
});

const veevaJsonStyleLightMode = {
    hljs: {
        display: 'block',
        overflowX: 'auto',
        padding: '0.5em',
        color: '#1B2F54'
    },
    'hljs-subst': {color: '#1B2F54'},
    'hljs-comment': {color: '#888888'},
    'hljs-keyword': {fontWeight: 'bold'},
    'hljs-attribute': {fontWeight: 'bold'},
    'hljs-selector-tag': {fontWeight: 'bold'},
    'hljs-meta-keyword': {fontWeight: 'bold'},
    'hljs-doctag': {fontWeight: 'bold'},
    'hljs-name': {fontWeight: 'bold'},
    'hljs-type': {color: '#DB6015'},
    'hljs-string': {color: '#DB6015'},
    'hljs-number': {color: '#DB6015'},
    'hljs-selector-id': {color: '#DB6015'},
    'hljs-selector-class': {color: '#DB6015'},
    'hljs-quote': {color: '#DB6015'},
    'hljs-template-tag': {color: '#DB6015'},
    'hljs-deletion': {color: '#DB6015'},
    'hljs-title': {
        color: '#DB6015',
        fontWeight: 'bold'
    },
    'hljs-section': {
        color: '#DB6015',
        fontWeight: 'bold'
    },
    'hljs-regexp': {color: '#BC6060'},
    'hljs-symbol': {color: '#BC6060'},
    'hljs-variable': {color: '#BC6060'},
    'hljs-template-variable': {color: '#BC6060'},
    'hljs-link': {color: '#BC6060'},
    'hljs-selector-attr': {color: '#BC6060'},
    'hljs-selector-pseudo': {color: '#BC6060'},
    'hljs-literal': {color: '#78A960'},
    'hljs-built_in': {color: '#397300'},
    'hljs-bullet': {color: '#397300'},
    'hljs-code': {color: '#397300'},
    'hljs-addition': {color: '#397300'},
    'hljs-meta': {color: '#1f7199'},
    'hljs-meta-string': {color: '#4d99bf'},
    'hljs-emphasis': {fontStyle: 'italic'},
    'hljs-strong': {fontWeight: 'bold'}
};

const veevaJsonStyleDarkMode = {
    hljs: {
        display: 'block',
        overflowX: 'auto',
        padding: '0.5em',
        color: '#F2F2F2'
    },
    'hljs-subst': {color: '#1B2F54'},
    'hljs-comment': {color: '#888888'},
    'hljs-keyword': {fontWeight: 'bold'},
    'hljs-attribute': {fontWeight: 'bold'},
    'hljs-selector-tag': {fontWeight: 'bold'},
    'hljs-meta-keyword': {fontWeight: 'bold'},
    'hljs-doctag': {fontWeight: 'bold'},
    'hljs-name': {fontWeight: 'bold'},
    'hljs-type': {color: '#FF7927'}, //sunsetred
    'hljs-string': {color: '#FF7927'},
    'hljs-number': {color: '#FF7927'},
    'hljs-selector-id': {color: '#FF7927'},
    'hljs-selector-class': {color: '#FF7927'},
    'hljs-quote': {color: '#FF7927'},
    'hljs-template-tag': {color: '#FF7927'},
    'hljs-deletion': {color: '#FF7927'},
    'hljs-title': {
        color: '#FF7927',
        fontWeight: 'bold'
    },
    'hljs-section': {
        color: '#FF7927',
        fontWeight: 'bold'
    },
    'hljs-regexp': {color: '#BC6060'},
    'hljs-symbol': {color: '#BC6060'},
    'hljs-variable': {color: '#BC6060'},
    'hljs-template-variable': {color: '#BC6060'},
    'hljs-link': {color: '#BC6060'},
    'hljs-selector-attr': {color: '#BC6060'},
    'hljs-selector-pseudo': {color: '#BC6060'},
    'hljs-literal': {color: '#78A960'},
    'hljs-built_in': {color: '#397300'},
    'hljs-bullet': {color: '#397300'},
    'hljs-code': {color: '#397300'},
    'hljs-addition': {color: '#397300'},
    'hljs-meta': {color: '#1f7199'},
    'hljs-meta-string': {color: '#4d99bf'},
    'hljs-emphasis': {fontStyle: 'italic'},
    'hljs-strong': {fontWeight: 'bold'}
};
