import { Thead, Tr, Th } from '@chakra-ui/react';

export default function DataFilesTableHeader() {
    const headerData = ['Modified Date', 'Operation', 'File'];

    return (
        <Thead {...ThStyle}>
            <Tr>
                {
                    headerData.map((headerValue, headerCount) => (
                        <Th key={headerCount} {...ThStyle} backgroundColor={(sessionStorage.getItem('domainType') === 'Sandbox') ? 'veeva_sandbox_green.500' : 'veeva_midnight_indigo.500'}>
                            {headerValue}
                        </Th>
                    ))
                }
            </Tr>
        </Thead>
    );
}

const ThStyle = {
    color: 'white',
    backgroundColor: 'veeva_sandbox_green.500',
    textAlign: 'left',
    width: '1%',
    whiteSpace: 'nowrap',
    _last: { width: '100%' },
    position: 'sticky',
    top: 0,
    border: 'none',
    zIndex: 10
};
