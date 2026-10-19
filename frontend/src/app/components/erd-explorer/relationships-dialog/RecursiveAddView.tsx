import { Button, ButtonGroup, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { DIRECTION_FILTERS, type DirectionFilter } from '../../../hooks/erd-explorer/relationships-dialog/useErdObjectRelationshipsDialog';

interface RecursiveAddViewProps {
    depth: number;
    depthText: string;
    setDepthText: (text: string) => void;
    /** Clamps the typed depth to a valid level count once the field is left or Enter is pressed. */
    normalizeDepthInput: () => void;
    directionFilter: DirectionFilter;
    setDirectionFilter: (filter: DirectionFilter) => void;
    onAddRecursive: (depth: number, directions: { inbound: boolean; outbound: boolean }) => void;
    onClose: () => void;
}

/** Dialog tab panel for configuring and triggering recursive object expansion. */
export default function RecursiveAddView({
    depth,
    depthText,
    setDepthText,
    normalizeDepthInput,
    directionFilter,
    setDirectionFilter,
    onAddRecursive,
    onClose,
}: RecursiveAddViewProps) {
    const includeInbound = directionFilter !== 'outbound';
    const includeOutbound = directionFilter !== 'inbound';

    return (
        <VStack align='stretch' gap={2} padding='12px'>
            <Text fontSize='xs' color='gray.500'>
                Add objects related up to N levels away. Choose which directions to follow. Expansions of 100+
                new objects warn first; 500+ are refused.
            </Text>
            <HStack gap={2}>
                <Input
                    size='xs'
                    type='number'
                    min={1}
                    value={depthText}
                    onChange={(event) => setDepthText(event.target.value)}
                    onBlur={normalizeDepthInput}
                    onKeyDown={(event) => { if (event.key === 'Enter') normalizeDepthInput(); }}
                    width='72px'
                    borderColor='light_gray_color_mode'
                    aria-label='Number of levels'
                />
                <Text fontSize='sm' color='gray.500'>
                    level{depth > 1 ? 's' : ''}
                </Text>
                <ButtonGroup size='xs' attached variant='outline'>
                    {DIRECTION_FILTERS.map((filterOption) => (
                        <Button
                            key={filterOption}
                            onClick={() => setDirectionFilter(filterOption)}
                            backgroundColor={directionFilter === filterOption ? 'veeva_orange_color_mode' : undefined}
                            color={directionFilter === filterOption ? 'white' : undefined}
                            borderColor='light_gray_color_mode'
                            textTransform='capitalize'
                        >
                            {filterOption}
                        </Button>
                    ))}
                </ButtonGroup>
            </HStack>
            <Button
                size='sm'
                backgroundColor='veeva_twilight_blue.500'
                color='white'
                onClick={() => {
                    onAddRecursive(depth, { inbound: includeInbound, outbound: includeOutbound });
                    onClose();
                }}
            >
                Add related
            </Button>
        </VStack>
    );
}
