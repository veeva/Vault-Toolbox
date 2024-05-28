import { Table, TableContainer, Tr, Td, Tbody, Card, CardBody, Box, Heading } from '@chakra-ui/react';
import {
    getVaultDns,
    getVaultDomainType,
    getVaultId,
    getVaultName,
    getVaultUsername
} from '../../services/SharedServices';

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
                                    <Td>{getVaultDns()}</Td>
                                </Tr>
                                <Tr>
                                    <Td {...TableColumnStyle}>Vault ID: </Td>
                                    <Td>{getVaultId()}</Td>
                                </Tr>
                                <Tr>
                                    <Td {...TableColumnStyle}>Vault Name: </Td>
                                    <Td>{getVaultName()}</Td>
                                </Tr>
                                <Tr>
                                    <Td {...TableColumnStyle}>Domain Type: </Td>
                                    <Td>{getVaultDomainType()}</Td>
                                </Tr>
                                <Tr>
                                    <Td {...TableColumnStyle}>User: </Td>
                                    <Td>{getVaultUsername()}</Td>
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
    backgroundColor: 'white.color_mode',
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
