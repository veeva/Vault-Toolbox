import { Box, Input, Text, VStack } from '@chakra-ui/react';
import { PiMagnifyingGlass } from 'react-icons/pi';
import { InputGroup } from '../shared/ui-components/input-group';
import { useErdCanvasObjectSearch, type SearchableItem } from '../../hooks/erd-explorer/canvas/useErdCanvasObjectSearch';

interface CanvasObjectSearchProps {
    objects: SearchableItem[];
    onFocus: (id: string) => void;
    /** Open the results panel upward (for use at the bottom of the viewport). */
    dropUp?: boolean;
}

/** Type-ahead search that finds a placed ERD object and centers the canvas on it. */
export default function CanvasObjectSearch({ objects, onFocus, dropUp = false }: CanvasObjectSearchProps) {
    const {
        userSearchInput,
        isResultsOpen,
        activeIndex,
        inputRef,
        matches,
        chooseMatch,
        handleSearchInputChange,
        handleInputKeyDown,
        handleInputBlur,
    } = useErdCanvasObjectSearch({ objects, onFocus });

    return (
        <Box position='relative' minWidth='200px'>
            <InputGroup
                width='100%'
                borderColor='transparent'
                borderRadius='6px'
                backgroundColor='veeva_light_gray_color_mode'
                startElement={<PiMagnifyingGlass size={16} />}
            >
                <Input
                    ref={inputRef}
                    size='xs'
                    ps='8'
                    placeholder='Find object on canvas…'
                    value={userSearchInput}
                    disabled={objects.length === 0}
                    boxShadow='0 0 4px rgba(0,0,0,0.2)'
                    backgroundColor='white_color_mode'
                    color='text_color_mode'
                    border='transparent'
                    borderRadius='6px'
                    onChange={(event) => handleSearchInputChange(event.target.value)}
                    onFocus={() => handleSearchInputChange(userSearchInput)}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                />
            </InputGroup>
            {isResultsOpen && matches.length > 0 && (
                <VStack {...SearchResultsStyle} top={dropUp ? undefined : '100%'} bottom={dropUp ? '100%' : undefined}>
                    {matches.map((match, index) => (
                        <Box
                            key={match.id}
                            {...SearchResultRowStyle}
                            backgroundColor={index === activeIndex ? 'veeva_light_gray_color_mode' : undefined}
                            onMouseDown={() => chooseMatch(match.id)}
                        >
                            <Text fontSize='sm' truncate>
                                {match.label}
                            </Text>
                            <Text fontSize='2xs' fontFamily='mono' color='gray.500' truncate>
                                {match.id}
                            </Text>
                        </Box>
                    ))}
                </VStack>
            )}
        </Box>
    );
}

const SearchResultsStyle = {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    zIndex: 20,
    align: 'stretch' as const,
    gap: 0,
    marginTop: '2px',
    maxHeight: '260px',
    overflowY: 'auto' as const,
    backgroundColor: 'white_color_mode',
    borderWidth: '1px',
    borderColor: 'gray.300',
    borderRadius: '6px',
    boxShadow: 'md',
};

const SearchResultRowStyle = {
    width: '100%',
    paddingX: 2,
    paddingY: 1,
    cursor: 'pointer',
    _hover: { backgroundColor: 'veeva_light_gray_color_mode' },
};
