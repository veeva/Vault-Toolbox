import { Box, Button, Flex, Heading, HStack, Radio, RadioGroup, VStack } from '@chakra-ui/react';
import { Fragment } from 'react';
import { PiPlus } from 'react-icons/pi';
import QueryFilterRow from './QueryFilterRow';

export default function WhereClauseBuilder({
    fieldOptions,
    selectedFilters,
    handleSelectedFilterEdits,
    logicalOperator,
    setLogicalOperator,
    operatorOptions,
    booleanValueOptions,
    addNewFilterRow,
    removeFilterRow,
    picklistValueOptions
}) {

    return (
        <Flex {...FlexStyle}>
            <Box minWidth='75px' marginRight='5px'>
                <Heading size='xs'>Where: </Heading>
            </Box>
            <VStack {...VStackStyle}>
                {selectedFilters.length > 1 ?
                    <Flex width='100%' align='center'>
                        <RadioGroup
                            onChange={setLogicalOperator}
                            value={logicalOperator}
                            colorScheme='veeva_midnight_indigo'
                        >
                            <HStack>
                                <Radio value='AND'>AND</Radio>
                                <Radio value='OR'>OR</Radio>
                            </HStack>
                        </RadioGroup>
                    </Flex> : null
                }
                {selectedFilters.map((filter, filterRowIndex) => {
                    return (
                        <Fragment key={`fragment-${filterRowIndex}`}>
                            <QueryFilterRow
                                fieldOptions={fieldOptions}
                                handleSelectedFilterEdits={handleSelectedFilterEdits}
                                filter={filter}
                                filterRowIndex={filterRowIndex}
                                operatorOptions={operatorOptions}
                                booleanValueOptions={booleanValueOptions}
                                picklistValueOptions={picklistValueOptions}
                                removeFilterRow={removeFilterRow}
                            />
                        </Fragment>
                    )
                })}
                <Button
                    {...AddFilterButtonStyle}
                    leftIcon={<PiPlus/>}
                    onClick={addNewFilterRow}
                >
                    Add Filter
                </Button>
            </VStack>
        </Flex>
    );
}

const FlexStyle = {
    marginX: '5px',
    marginY: '10px',
    align: 'top'
}

const VStackStyle = {
    width: '100%',
    align: 'left',
    flexGrow: 1
}

const AddFilterButtonStyle = {
    maxWidth: 'max-content',
    borderRadius: '6px',
    variant: 'outline',
    colorScheme: 'blue',
    size: 'sm',
    'aria-label': 'Add filter row button',
}