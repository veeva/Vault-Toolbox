import { Box, Center, Flex, Heading, Spacer, Spinner, Text } from '@chakra-ui/react';
import ApiErrorMessageCard from '../../shared/ApiErrorMessageCard';
import CustomSelect from '../../shared/CustomSelect';

export default function QueryFieldsSelector({ selectedFields, setSelectedFields, fieldOptions, fieldOptionsError, loadingObjectMetadata }) {

    return (
        <Flex {...FlexStyle}>
            <Box minWidth='75px' marginRight='5px'>
                <Heading size='xs'>Fields:</Heading>
            </Box>
            { loadingObjectMetadata ?
                <Center><Spinner/></Center>
                : (
                    <Box width='100%'>
                        { fieldOptionsError ? <ApiErrorMessageCard errorMessage={fieldOptionsError}/> :
                            <CustomSelect
                                options={fieldOptions}
                                placeholder='Select fields...'
                                size='sm'
                                isClearable={true}
                                isMulti
                                closeMenuOnSelect={false}
                                hasStickyGroupHeaders
                                value={selectedFields}
                                onChange={(newValue) => setSelectedFields(newValue)}
                                formatGroupLabel={formatGroupLabel}
                                chakraStyles={{
                                    valueContainer: provided => ({
                                        ...provided,
                                        maxHeight: '50vh',
                                        overflowY: 'auto'
                                    }),
                                    menuList: provided => ({
                                        ...provided,
                                        height: '70vh',
                                        minHeight: '70vh'
                                    }),
                                    groupHeading: provided => ({
                                        ...provided,
                                        backgroundColor: 'veeva_light_gray.color_mode'
                                    })
                                }}
                            />
                        }
                    </Box>
                )
            }
        </Flex>
    );
}

const formatGroupLabel = (data) => (
    <Flex align='center'>
        <Text>{data.label}</Text>
        <Spacer/>
        <Text>{data.options.length}</Text>
    </Flex>
);

const FlexStyle = {
    align: 'center',
    marginX: '5px',
    marginTop: '10px'
}

