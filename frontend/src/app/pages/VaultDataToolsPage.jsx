import { VStack, Flex, Box } from '@chakra-ui/react';
import { PanelGroup, Panel } from 'react-resizable-panels';
import VaultInfoIsland from '../components/shared/VaultInfoIsland';
import DataToolsHeaderRow from '../components/vault-data-tools/DataToolsHeaderRow';
import DataToolsIsland from '../components/vault-data-tools/DataToolsIand';
import useVaultDataTools from '../hooks/vault-data-tools/useVaultDataTools';

export default function VaultDataToolsPage() {
    const { 
        countData, 
        deleteData, 
        submittingCountJob, 
        submittingDeleteJob, 
        dataType, 
        setDataType, 
        selectedOptions, 
        setSelectedOptions 
    } = useVaultDataTools();

    return (
        <Flex justify='flex-start' height='100%'>
            <PanelGroup direction='horizontal'>
                <Panel id='data-tools-panel' order={1}>
                    <VStack {...DataToolsStackStyle}>
                        <DataToolsHeaderRow
                            countData={countData}
                            deleteData={deleteData}
                            submittingCountJob={submittingCountJob}
                            submittingDeleteJob={submittingDeleteJob}
                            dataType={dataType}
                            selectedOptions={selectedOptions}
                        />
                        <DataToolsIsland
                            dataType={dataType}
                            setDataType={setDataType}
                            selectedOptions={selectedOptions}
                            setSelectedOptions={setSelectedOptions}
                        />
                        <VaultInfoIsland />
                    </VStack>
                </Panel>
            </PanelGroup>
            <Box height='100vh' flex='0 0' minWidth='38px' />
        </Flex>
    );
}

const DataToolsStackStyle = {
    height: '100%',
    backgroundColor: 'veeva_light_gray.color_mode',
    flex: 1,
    boxShadow: 'inset -5px 0 8px -8px rgba(0,0,0,0.3), inset 5px 0 8px -8px rgba(0,0,0,0.3)',
    spacing: 0
};
