import { Tbody, Tr, Td, Link } from '@chakra-ui/react';

export default function DataFilesTableBody({ countFiles, deleteFiles, handleClick }) {
    const OPERATIONS = {
        DELETE: 'DELETE',
        COUNT: 'COUNT'
    };

    const files = [...countFiles, ...deleteFiles];
    files.sort((fileA, fileB) => new Date(fileB?.fileTimestamp) - new Date(fileA?.fileTimestamp));

    return (
        <Tbody>
            { (files.length !== 0)
                ? files.map((dataFile, dataFileCount) => {
                    let operation = '';
                    if (dataFile?.filePath?.includes(OPERATIONS.DELETE.toLowerCase())) {
                        operation = OPERATIONS.DELETE;
                    } else if (dataFile?.filePath?.includes(OPERATIONS.COUNT.toLowerCase())) {
                        operation = OPERATIONS.COUNT;
                    }
                    return (
                        <Tr key={dataFileCount}>
                            <Td {...TdStyle}>{dataFile.fileTimestamp}</Td>
                            <Td {...TdStyle}>{operation}</Td>
                            <Td {...HyperlinkStyle} onClick={() => handleClick(dataFile.filePath)}><Link>{dataFile.filePath.split('/')[4]}</Link></Td>
                        </Tr>
                    );
                })
                : (
                    <Tr>
                        <Td>NO FILES FOUND</Td>
                        <Td />
                    </Tr>
                )}
        </Tbody>
    );
}

const TdStyle = {
    borderBottom: 'solid thin',
    borderColor: 'gray.300',
    verticalAlign: 'top'
};

const HyperlinkStyle = {
    borderBottom: 'solid thin',
    borderColor: 'gray.300',
    verticalAlign: 'top',
    textDecoration: 'underline',
    color: '#0000EE'
};
