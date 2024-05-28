import { VStack, Checkbox, CheckboxGroup } from '@chakra-ui/react';

export default function DataSelectionCheckboxGroup({ type, selectedDataType, dataToDisplay, selectedOptions, setSelectedOptions, handleAllChecked, handleSingleChecked, isDisabled, extractVaultNames }) {
    const isAllDataSelected = (selectedDataType === 'ALL');

    return (
        <VStack {...StackStyle}>
            <Checkbox
                isDisabled={isAllDataSelected || isDisabled}
                isChecked={isAllDataSelected || selectedOptions.length === dataToDisplay.length}
                onChange={handleAllChecked}
                defaultChecked
                colorScheme='veeva_midnight_indigo'
                fontWeight='bold'
            >
                Select All
                {' '}
                {type}
            </Checkbox>
            <CheckboxGroup value={selectedOptions} onChange={setSelectedOptions} isDisabled={isAllDataSelected || isDisabled}>
                {dataToDisplay.map((option) => (
                    <Checkbox
                        key={option}
                        name={option}
                        isChecked={isAllDataSelected || selectedOptions.includes(extractVaultNames(option))}
                        onChange={handleSingleChecked}
                        colorScheme='veeva_midnight_indigo'
                        paddingInlineStart='30px'
                    >
                        {option}
                    </Checkbox>
                ))}
            </CheckboxGroup>
        </VStack>
    );
}

const StackStyle = {
    align: 'left',
    padding: '10px',
    margin: '10px',
    backgroundColor: 'white.color_mode',
    borderRadius: '8px',
    overflow: 'auto',
    width: '50%',
    fontSize: 'md'
};
