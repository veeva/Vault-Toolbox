import { Table, TableContainer, Tr, Td, Tbody, Card, CardBody, Box, Heading } from '@chakra-ui/react';

export default function VaultInfoTable() {
    return (
        <Card {...VaultInfoCardStyle}>
            <CardBody>
                <Box>
                    <Heading {...TableHeaderStyle}>
                        Vault Information
                    </Heading>
                    <TableContainer>
                        <Table variant='simple' size='sm'>
                            <Tbody>
                                <Tr>
                                    <Td {...TableColumnStyle}>Vault DNS: </Td>
                                    <Td>{sessionStorage.getItem('vaultDNS')}</Td>
                                </Tr>
                                <Tr>
                                    <Td {...TableColumnStyle}>Vault ID: </Td>
                                    <Td>{sessionStorage.getItem('vaultId')}</Td>
                                </Tr>
                                <Tr>
                                    <Td {...TableColumnStyle}>Vault Name: </Td>
                                    <Td>{sessionStorage.getItem('vaultName')}</Td>
                                </Tr>
                                <Tr>
                                    <Td {...TableColumnStyle}>Domain Type: </Td>
                                    <Td>{sessionStorage.getItem('domainType')}</Td>
                                </Tr>
                                <Tr>
                                    <Td {...TableColumnStyle}>User: </Td>
                                    <Td>{sessionStorage.getItem('userName')}</Td>
                                </Tr>
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Box>
            </CardBody>
        </Card>
    );
}

const VaultInfoCardStyle = {
    marginY: '25',
    boxShadow: '0 0 5px rgba(0,0,0,0.2)'
};

const TableHeaderStyle = {
    size: 'md',
    textTransform: 'capitalize',
    fontWeight: 'normal',
    padding: '5px'
};

const TableColumnStyle = {
    fontWeight: 'bold',
    textAlign: 'right'
};
