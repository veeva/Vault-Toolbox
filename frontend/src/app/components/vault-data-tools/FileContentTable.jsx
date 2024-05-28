import { Box, Table, TableContainer, Tr, Td, Th, Thead, Tbody, Center, Spinner, Link } from '@chakra-ui/react';
import {isSandboxVault} from '../../services/SharedServices';

export default function FileContentTable({ size, headers, data, loading, type, handleClick }) {
    return (
        <Box>
            {!loading
                ? (
                    <Box {...BoxStyle}>
                        <TableContainer {...TableContainerStyle}>
                            <Table size={size} {...TableStyle}>
                                <Thead {...THeadStyle}>
                                    <Tr>
                                        {
                                            headers.map((value, i) => <Th key={i} {...TableHeaderStyle} backgroundColor={isSandboxVault() ? 'veeva_sandbox_green.500' : 'veeva_midnight_indigo.500'}>{value}</Th>)
                                        }
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    { (data.length !== 0)
                                        ? data.map((row, i) => (
                                            <Tr key={i}>
                                                { type === 'files'
                                                    ? (
                                                        <>
                                                            <Td>{row.fileTimestamp}</Td>
                                                            <Td {...HyperlinkStyle} onClick={() => handleClick(row.filePath)}><Link>{row.filePath.split('/')[4]}</Link></Td>
                                                        </>
                                                    )
                                                    : (
                                                        <>
                                                            {
                                                                row.map((value, j) => <Td key={j}>{value}</Td>)
                                                            }
                                                        </>
                                                    )}
                                            </Tr>
                                        )) : (
                                            <Tr>
                                                <Td>NO DATA TO DISPLAY</Td>
                                                <Td />
                                            </Tr>
                                        )}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </Box>
                )
                : <Center><Spinner /></Center>}
        </Box>
    );
}

const BoxStyle = {
    borderWidth: '1px',
    fontSize: 'md'
};

const TableContainerStyle = {
    maxWidth: '100%',
    overflowX: 'unset',
    overflowY: 'unset'
};

const TableStyle = {
    variant: 'striped',
    width: 'auto',
};

const THeadStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 'docked',
};

const TableHeaderStyle = {
    color: 'white',
    width: '1%',
    whiteSpace: 'nowrap',
    _last: { width: '100%' },
    position: 'sticky',
    top: 0,
    zIndex: 'docked'
};

const HyperlinkStyle = {
    textDecoration: 'underline',
    color: 'hyperlink_blue.color_mode'
};
