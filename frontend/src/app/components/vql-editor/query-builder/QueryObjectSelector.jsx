import { Box, Center, Flex, Heading, Spinner } from '@chakra-ui/react';
import ApiErrorMessageCard from '../../shared/ApiErrorMessageCard';
import CustomSelect from '../../shared/CustomSelect';

export default function QueryObjectSelector({ vaultObjects, selectedObject, setSelectedObject, loadingVaultObjects, vaultObjectsError }) {

    return (
        <Flex {...FlexStyle}>
            <Box minWidth='75px' marginRight='5px'>
                <Heading size='xs'>Object:</Heading>
            </Box>
            { loadingVaultObjects ?
                <Center><Spinner/></Center>
                : (
                    <Box width='100%'>
                        { vaultObjectsError ? <ApiErrorMessageCard errorMessage={vaultObjectsError}/> :
                            <CustomSelect
                                options={vaultObjects}
                                placeholder='Select an object...'
                                isClearable={true}
                                value={selectedObject}
                                onChange={(newValue) => setSelectedObject(newValue)}
                            />
                        }
                    </Box>
                )
            }
        </Flex>
    );
}

const FlexStyle = {
    align: 'center',
    marginX: '5px',
    marginTop: '10px'
}

