import { Box, Flex, IconButton, Input } from '@chakra-ui/react';
import { PiMinusCircleBold } from 'react-icons/pi';
import CustomSelect from '../../shared/CustomSelect';

export default function QueryFilterRow({
    fieldOptions,
    handleSelectedFilterEdits,
    removeFilterRow,
    filter,
    filterRowIndex,
    operatorOptions,
    booleanValueOptions,
    picklistValueOptions
}) {
    const fieldType = filter?.field?.fieldType;
    const operator = filter?.operator;

    const primaryFields = fieldOptions.find(option => option.label === 'Fields')?.options;
    const referenceOutboundFields = fieldOptions.find(option => option.label === 'Outbound Relationships')?.options;
    const referenceParentFields = fieldOptions.find(option => option.label === 'Parent Relationships')?.options;
    const objectFields = [
        ...primaryFields,
        ...(referenceOutboundFields || []),
        ...(referenceParentFields || [])
    ]?.filter(field => (field.fieldType !== 'RichText' && field.fieldType !== 'LongText'));

    return (
        <Flex key={filterRowIndex} {...FlexStyle}>
            <Box {...FieldBoxStyle}>
                <CustomSelect
                    options={objectFields}
                    placeholder='Field'
                    variant='filled'
                    value={filter.field}
                    onChange={(newValue) => handleSelectedFilterEdits(newValue, filterRowIndex, 'field')}
                />
            </Box>
            <Box {...OperatorBoxStyle}>
                <CustomSelect
                    options={operatorOptions}
                    placeholder='Operator'
                    variant='filled'
                    displayDropdown={false}
                    value={filter.operator}
                    onChange={(newValue) => handleSelectedFilterEdits(newValue, filterRowIndex, 'operator')}
                />
            </Box>
            {fieldType === 'Boolean' ?
                <Box {...SelectValueBoxStyle}>
                    <CustomSelect
                        options={booleanValueOptions}
                        placeholder={fieldType ? `Value (${fieldType})` : 'Value'}
                        variant='filled'
                        displayDropdown={false}
                        value={filter.value?.value}
                        onChange={(newValue) => handleSelectedFilterEdits(newValue?.value, filterRowIndex, 'value')}
                    />
                </Box> :
                <>
                    { fieldType === 'Picklist' ?
                        <Box {...SelectValueBoxStyle}>
                            <CustomSelect
                                options={picklistValueOptions}
                                isMulti={operator.value === 'CONTAINS'}
                                placeholder={fieldType ? `Value (${fieldType})` : 'Value'}
                                variant='filled'
                                displayDropdown={false}
                                value={filter.value}
                                onChange={(newValue) => handleSelectedFilterEdits(newValue, filterRowIndex, 'value')}
                            />
                        </Box>
                        : <Input
                            placeholder={operator.value === 'CONTAINS' ? `Enter comma-separated values (${fieldType})` : (fieldType) ? `Value (${fieldType})` : 'Value'}
                            value={filter.value}
                            onChange={(event) => handleSelectedFilterEdits(event.target.value, filterRowIndex, 'value')}
                            {...InputStyle}
                        />
                    }
                </>
            }
            <IconButton
                {...DeleteRowButtonStyle}
                icon={<PiMinusCircleBold size={18}/>}
                onClick={() => removeFilterRow(filterRowIndex)}
            />
        </Flex>
    );
}

const FlexStyle = {
    align: 'center',
    width: '100%',
}

const FieldBoxStyle = {
    marginRight: '5px',
    height: '100%',
    minWidth: '200px'
}

const OperatorBoxStyle = {
    marginRight: '5px',
    height: '100%',
    minWidth: '110px'
}

const SelectValueBoxStyle = {
    marginRight: '5px',
    height: '100%',
    flexGrow: 1
}

const DeleteRowButtonStyle = {
    variant: 'ghost',
    isRound: true,
    align: 'left',
    marginRight: '5px',
    color: 'veeva_sunset_red.color_mode',
    size: 'sm',
    'aria-label': 'Delete filter row',
}

const InputStyle = {
    height: '100%',
    size: 'sm',
    variant: 'filled',
    marginRight: '5px'
}