import { Flex, Box, Text, RadioGroup, Radio, Center, Spinner } from '@chakra-ui/react';
import ApiErrorMessageCard from '../shared/ApiErrorMessageCard';
import DataSelectionCheckboxGroup from './DataSelectionCheckboxGroup';
import useVaultData from '../../hooks/vault-data-tools/useVaultData';
import useVaultDataSelection from '../../hooks/vault-data-tools/useVaultDataSelection';

export default function DataSelectionPanel({ dataType, setDataType, selectedOptions, setSelectedOptions }) {
    const { vaultObjects, vaultDocumentTypes, fetchObjAndDocTypeError } = useVaultData();
    const { disableObjectSelection, disableDocTypeSelection, extractVaultNames, handleAllChecked, handleSingleChecked } = useVaultDataSelection({ dataType, selectedOptions, setSelectedOptions, vaultObjects, vaultDocumentTypes });

    return (
        <Flex {...SelectionBoxStyle}>
            { !fetchObjAndDocTypeError.hasError
                ? (
                    <>
                        <Box flex='0 0 auto'>
                            <RadioGroup onChange={setDataType} value={dataType} colorScheme='veeva_midnight_indigo' margin='10px'>
                                <Text fontWeight='bold' fontSize='md' display='inline' marginLeft='5px'>Data Type:</Text>
                                <Radio value='ALL' marginLeft='10px'>All Data</Radio>
                                <Radio value='OBJECTS' marginLeft='10px'>Objects</Radio>
                                <Radio value='DOCUMENTS' marginLeft='10px'>Documents</Radio>
                            </RadioGroup>
                        </Box>
                        { (vaultObjects.length !== 0 && vaultDocumentTypes.length !== 0)
                            ? (
                                <Flex flex='1 1 auto' overflow='auto' marginX='10px'>
                                    <DataSelectionCheckboxGroup
                                        type='Objects'
                                        selectedDataType={dataType}
                                        dataToDisplay={vaultObjects}
                                        selectedOptions={selectedOptions}
                                        setSelectedOptions={setSelectedOptions}
                                        handleAllChecked={handleAllChecked}
                                        handleSingleChecked={handleSingleChecked}
                                        isDisabled={disableObjectSelection}
                                        extractVaultNames={extractVaultNames}
                                    />
                                    <DataSelectionCheckboxGroup
                                        type='Document Types'
                                        selectedDataType={dataType}
                                        dataToDisplay={vaultDocumentTypes}
                                        selectedOptions={selectedOptions}
                                        setSelectedOptions={setSelectedOptions}
                                        handleAllChecked={handleAllChecked}
                                        handleSingleChecked={handleSingleChecked}
                                        isDisabled={disableDocTypeSelection}
                                        extractVaultNames={extractVaultNames}
                                    />
                                </Flex>
                            )
                            : <Center><Spinner /></Center>}
                    </>
                )
                : <ApiErrorMessageCard content='Vault objects and document types' errorMessage={fetchObjAndDocTypeError.errorMessage} />}
        </Flex>
    );
}

const SelectionBoxStyle = {
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'veeva_light_gray.100'
};
