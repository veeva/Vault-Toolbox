import { Box, Text } from '@chakra-ui/react';
import { Select, chakraComponents } from 'chakra-react-select';
import { useMemo } from 'react';
import { PiMagnifyingGlass } from 'react-icons/pi';
import useFileBrowserSearch from '../../../hooks/file-browser/useFileBrowserSearch';
import { InputGroup } from '../../shared/ui-components/input-group';

const MAX_SEARCH_RESULTS = 100;

const Input = (props) => <chakraComponents.Input {...props} isHidden={false} />;

export default function FileStagingBrowserSearchBar({
    fileStagingTree,
    handleFileStagingSearchResultClick,
    fileStagingSearchOptions,
}) {
    const {
        searchValue: fileStagingSearchValue,
        searchInputValue: fileStagingSearchInputValue,
        onSearchValueChange: onFileStagingSearchValueChange,
        onSearchInputChange: onFileStagingSearchInputChange,
    } = useFileBrowserSearch({
        fileTree: fileStagingTree,
        handleSearchResultClick: handleFileStagingSearchResultClick,
    });

    // Match on the full path (option.value) so a pasted path fragment finds the folder; built lazily and capped because react-select renders every option and froze on large vaults.
    const visibleOptions = useMemo(() => {
        const query = fileStagingSearchInputValue.trim().toLowerCase();
        if (!query) {
            return [];
        }
        const matches = [];
        for (const option of fileStagingSearchOptions) {
            if (String(option.value).toLowerCase().includes(query)) {
                matches.push(option);
                if (matches.length >= MAX_SEARCH_RESULTS) {
                    break;
                }
            }
        }
        return matches;
    }, [fileStagingSearchInputValue, fileStagingSearchOptions]);

    return (
        <InputGroup marginX='5px' flexGrow={1} startElement={<PiMagnifyingGlass size={24} />}>
            <Box width='100%' marginRight='6px'>
                <Select
                    options={visibleOptions}
                    filterOption={() => true}
                    isClearable
                    value={fileStagingSearchValue}
                    inputValue={fileStagingSearchInputValue}
                    onInputChange={onFileStagingSearchInputChange}
                    onChange={onFileStagingSearchValueChange}
                    controlShouldRenderValue={false}
                    formatOptionLabel={(option) => (
                        <Box>
                            <Text>{option.label}</Text>
                            {option.path ? (
                                <Text fontSize='xs' color='dimmed_text_color_mode'>
                                    {option.path}
                                </Text>
                            ) : null}
                        </Box>
                    )}
                    placeholder='Type to search file staging...'
                    noOptionsMessage={() =>
                        fileStagingSearchInputValue.length === 0
                            ? 'Type at least 1 character to search'
                            : 'No results found'
                    }
                    components={{
                        Input: Input,
                        DropdownIndicator: () => null,
                        IndicatorSeparator: () => null,
                    }}
                    menuPortalTarget={document.body}
                    chakraStyles={{
                        control: (provided) => ({
                            ...provided,
                            ...SelectComponentStyles,
                        }),
                        menu: (provided) => ({
                            ...provided,
                        }),
                    }}
                />
            </Box>
        </InputGroup>
    );
}

const SelectComponentStyles = {
    paddingLeft: '3rem',
    boxShadow: '0 0 5px rgba(0,0,0,0.25)',
    backgroundColor: 'white_color_mode',
    color: 'text_color_mode',
    border: 'transparent',
    borderRadius: 'md',
};
