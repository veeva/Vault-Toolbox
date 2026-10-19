import { Badge, Box, Button, ButtonGroup, Flex, HStack, Separator, Spinner, Text, VStack } from '@chakra-ui/react';
import { PiArrowClockwise } from 'react-icons/pi';
import type { ErdObjectRecord } from '../../../hooks/erd-explorer/useErdExplorerData';
import { useErdFieldSelectorTab, type TypeFilter } from '../../../hooks/erd-explorer/sidebar/useErdFieldSelectorTab';
import { DOCUMENTS_TARGET, FIELD_CATEGORIES, FIELD_CATEGORY_LABELS, type ErdObjectSummary } from '../../../utils/erd-explorer/ErdExplorerTypes';
import FilterGroupLabel from '../FilterGroupLabel';
import FieldToggleRow from './FieldToggleRow';

const TYPE_FILTERS: TypeFilter[] = ['all', ...FIELD_CATEGORIES];
const TYPE_FILTER_LABELS: Record<TypeFilter, string> = {
    all: 'All',
    ...FIELD_CATEGORY_LABELS,
};

interface FieldSelectorTabProps {
    focusedObject: string | null;
    record?: ErdObjectRecord;
    summary?: ErdObjectSummary;
    visibleFieldSet: Set<string>;
    onToggleField: (fieldName: string) => void;
    onSetFields: (fieldNames: string[]) => void;
    onRetry: () => void;
}

/** Per-object field visibility: category filters + checkbox list. Default = reference (key) fields. */
export default function FieldSelectorTab({
    focusedObject,
    record,
    summary,
    visibleFieldSet,
    onToggleField,
    onSetFields,
    onRetry,
}: FieldSelectorTabProps) {
    const fields = record?.fields ?? [];
    const {
        typeFilter,
        setTypeFilter,
        showOnlyVisible,
        toggleShowOnlyVisible,
        shownFields,
        referenceFieldNames,
    } = useErdFieldSelectorTab({ fields, visibleFieldSet });

    if (!focusedObject || focusedObject === DOCUMENTS_TARGET) {
        return (
            <VStack align='stretch' height='100%'>
                <Flex {...TabTitleStyle}>
                    <Text fontSize='xl' fontWeight='bold' color='veeva_orange_color_mode'>Field Selector</Text>
                </Flex>
                <VStack flex={1} justify='center' padding='24px'>
                    <Text fontSize='sm' color='gray.500' textAlign='center'>
                        {focusedObject === DOCUMENTS_TARGET
                            ? 'Documents is not an object.'
                            : 'Select exactly one object on the canvas to manage its fields.'}
                    </Text>
                </VStack>
            </VStack>
        );
    }

    return (
        <VStack align='stretch' gap={2} height='100%' overflow='hidden'>
            <Flex {...TabTitleStyle}>
                <Text fontSize='xl' fontWeight='bold' color='veeva_orange_color_mode'>Field Selector</Text>
            </Flex>
            <VStack align='stretch' gap={2} flex={1} padding='12px' overflow='hidden'>
            <Box>
                <HStack justify='space-between'>
                    <Text fontWeight='bold' fontSize='sm' truncate>
                        {summary?.label ?? focusedObject}
                    </Text>
                    {summary?.source && (
                        <Badge size='sm' textTransform='capitalize'>
                            {summary.source}
                        </Badge>
                    )}
                </HStack>
                <Text fontSize='xs' fontFamily='mono' color='gray.500' truncate>
                    {focusedObject}
                </Text>
            </Box>
            <Separator borderColor='veeva_light_gray.500' borderWidth='0.5px' />

            {record?.status === 'loading' && (
                <HStack gap={2} padding='16px'>
                    <Spinner size='sm' color='veeva_orange_color_mode' />
                    <Text fontSize='sm' color='gray.500'>
                        Loading fields…
                    </Text>
                </HStack>
            )}
            {record?.status === 'error' && (
                <VStack gap={2} padding='16px' align='start'>
                    <Text fontSize='sm' color='veeva_sunset_red_color_mode'>
                        {record.error ?? 'Failed to load fields.'}
                    </Text>
                    <Button size='xs' variant='outline' onClick={onRetry}>
                        <PiArrowClockwise style={{ marginRight: 6 }} /> Retry
                    </Button>
                </VStack>
            )}

            {record?.status === 'ready' && record.partial && (
                <VStack gap={1} padding='16px' align='start'>
                    <Text fontSize='sm' color={record.missingFromVault ? 'veeva_sunset_red_color_mode' : 'gray.500'}>
                        {record.missingFromVault ? 'No longer in this Vault.' : 'Fields unavailable for this object.'}
                    </Text>
                    <Text fontSize='xs' color='dimmed_text_color_mode'>
                        {record.missingFromVault
                            ? 'It was on the diagram when it was saved, but this Vault no longer has it.'
                            : 'This Vault exposes it without an MDL definition, so its field list cannot be read.'}
                    </Text>
                </VStack>
            )}

            {record?.status === 'ready' && !record.partial && (
                <>
                    <HStack align='flex-start' gap={4} wrap='wrap'>
                        <VStack align='stretch' gap={2}>
                            <FilterGroupLabel>Categories</FilterGroupLabel>
                            <ButtonGroup size='xs' attached variant='outline'>
                                {TYPE_FILTERS.map((filterOption) => (
                                    <Button
                                        key={filterOption}
                                        onClick={() => setTypeFilter(filterOption)}
                                        backgroundColor={typeFilter === filterOption ? 'veeva_orange_color_mode' : undefined}
                                        color={typeFilter === filterOption ? 'white' : undefined}
                                        borderColor='light_gray_color_mode'
                                    >
                                        {TYPE_FILTER_LABELS[filterOption]}
                                    </Button>
                                ))}
                            </ButtonGroup>
                        </VStack>
                        <VStack align='stretch' gap={2}>
                            <FilterGroupLabel>State</FilterGroupLabel>
                            <ButtonGroup size='xs' attached variant='outline'>
                                <Button
                                    onClick={toggleShowOnlyVisible}
                                    backgroundColor={showOnlyVisible ? 'veeva_orange_color_mode' : undefined}
                                    color={showOnlyVisible ? 'white' : undefined}
                                    borderColor='light_gray_color_mode'
                                >
                                    Selected
                                </Button>
                            </ButtonGroup>
                        </VStack>
                        <VStack align='stretch' gap={2}>
                            <FilterGroupLabel>Quick select</FilterGroupLabel>
                            <ButtonGroup size='xs' attached variant='outline'>
                                <Button borderColor='light_gray_color_mode' onClick={() => onSetFields(fields.map((field) => field.name))}>
                                    All
                                </Button>
                                <Button borderColor='light_gray_color_mode' onClick={() => onSetFields(referenceFieldNames)}>
                                    Relationships
                                </Button>
                                <Button borderColor='light_gray_color_mode' onClick={() => onSetFields([])}>
                                    None
                                </Button>
                            </ButtonGroup>
                        </VStack>
                    </HStack>

                    <VStack align='stretch' gap={0} flex={1} overflowY='auto' minHeight={0}>
                        {shownFields.map((field) => (
                            <FieldToggleRow
                                key={field.name}
                                field={field}
                                checked={visibleFieldSet.has(field.name)}
                                onToggle={() => onToggleField(field.name)}
                            />
                        ))}
                        {shownFields.length === 0 && (
                            <Text fontSize='xs' color='gray.500' padding='8px'>
                                No fields in the selected categories.
                            </Text>
                        )}
                    </VStack>
                </>
            )}
            </VStack>
        </VStack>
    );
}

const TabTitleStyle = {
    borderBottom: 'solid 3px',
    borderBottomColor: 'gray.400',
    padding: '8px 12px',
    width: '100%',
};
