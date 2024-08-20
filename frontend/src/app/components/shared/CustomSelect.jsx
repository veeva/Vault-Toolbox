import { Icon } from '@chakra-ui/react';
import { chakraComponents, CreatableSelect, Select } from 'chakra-react-select';
import { PiCaretDownBold } from 'react-icons/pi';

export default function CustomSelect({displayDropdown = true, isCreatable = false, size = 'sm', ...props}) {
    const components = CustomComponents(displayDropdown);

    return (
        <>
            {isCreatable ?
                <CreatableSelect
                    {...props}
                    size={size}
                    components={components}
                />
                : <Select
                    {...props}
                    size={size}
                    components={components}
                />
            }
        </>
    );
}

const CustomComponents = (displayDropdown) => ({
    DropdownIndicator: displayDropdown ? (props) => (
        <chakraComponents.DropdownIndicator {...props}>
            <Icon as={PiCaretDownBold}/>
        </chakraComponents.DropdownIndicator>
    ) : null
});