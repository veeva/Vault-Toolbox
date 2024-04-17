import { Flex, Box, IconButton, Tabs, TabPanels, TabPanel, TabList, Tab, TabIndicator, TableContainer, Table, Text, Spacer, HStack, Center, Spinner } from '@chakra-ui/react';
import { PiArrowClockwise } from 'react-icons/pi';
import FileContentsModal from './FileContentsModal';
import DataFilesTableHeader from './DataFilesTableHeader';
import ApiErrorMessageCard from '../shared/ApiErrorMessageCard';
import DataFilesTableBody from './DataFilesTableBody';
import useDataFiles from '../../hooks/vault-data-tools/useDataFiles';
import useDataFileModal from '../../hooks/vault-data-tools/useDataFileModal';

export default function DataFilesPanel() {
    const { countFiles, deleteFiles, loadingFiles, fetchFilesError, secondsRemaining, handleFileRefresh } = useDataFiles();
    const { isModalOpen, selectedCellData, closeModal, handleFileClick } = useDataFileModal();

    return (
        <Tabs {...DataToolsTabsStyle}>
            <Flex flexDirection='column' height='100%' overflow='auto'>
                <Flex overflow='auto' height='100%'>
                    <TabPanels>
                        <TabPanel padding={0}>
                            <HStack>
                                <IconButton icon={<PiArrowClockwise size={20} />} {...RefreshIconButtonStyle} onClick={handleFileRefresh} />
                                <Text>
                                    Auto-refresh in
                                    {' '}
                                    {secondsRemaining}
                                    {' '}
                                    seconds...
                                </Text>
                            </HStack>
                            { loadingFiles
                                ? <Center><Spinner /></Center>
                                : (
                                    <Box>
                                        { !fetchFilesError.hasError
                                            ? (
                                                <Box>
                                                    {(countFiles && deleteFiles)
                                                        ? (
                                                            <TableContainer {...TableContainerStyle}>
                                                                <Table size='md' variant='simple'>
                                                                    <DataFilesTableHeader />
                                                                    <DataFilesTableBody countFiles={countFiles} deleteFiles={deleteFiles} handleClick={handleFileClick} />
                                                                </Table>
                                                            </TableContainer>
                                                        )
                                                        : null}
                                                </Box>
                                            )
                                            : <ApiErrorMessageCard content='files from Vault File Staging' errorMessage={fetchFilesError.errorMessage} />}
                                    </Box>
                                )}
                            {isModalOpen ? <FileContentsModal isOpen={isModalOpen} onClose={closeModal} cellData={selectedCellData} /> : null}
                        </TabPanel>
                    </TabPanels>
                </Flex>
                <Spacer />
                <Box {...TabBoxStyle}>
                    <TabList {...TabListStyle}>
                        <Box width='180px'>
                            <Tab {...TabLabelStyle}>CSV</Tab>
                        </Box>
                        <TabIndicator {...TabIndicatorStyle} />
                    </TabList>
                </Box>
            </Flex>
        </Tabs>
    );
}

const DataToolsTabsStyle = {
    variant: 'unstyled',
    position: 'relative',
    colorScheme: 'veeva_orange',
    size: 'lg',
    maxWidth: '100%',
    height: '100%',
    backgroundColor: 'veeva_sunset_yellow.five_percent_opacity',
    borderBottomRadius: '8px'
};

const TableContainerStyle = {
    maxWidth: '100%',
    overflowX: 'unset',
    overflowY: 'unset',
    color: 'black',
    backgroundColor: 'veeva_sunset_yellow.five_percent_opacity'
};

const TabListStyle = {
    flex: 1,
    height: '60px',
    borderTop: 'solid 3px',
    borderTopColor: 'gray.400',
    borderBottomRadius: '8px'
};

const TabBoxStyle = {
    backgroundColor: 'white',
    position: 'sticky',
    left: '0',
    bottom: '0',
    borderBottomRadius: '8px'
};

const TabLabelStyle = {
    fontSize: 'xl',
    color: 'veeva_orange.500',
    borderBottom: 'none',
    borderBottomRadius: '8px',
    width: '180px'
};

const TabIndicatorStyle = {
    marginTop: '-3px',
    height: '3px',
    backgroundColor: 'veeva_orange.500'
};

const RefreshIconButtonStyle = {
    size: 'sm',
    margin: '5px'
};
