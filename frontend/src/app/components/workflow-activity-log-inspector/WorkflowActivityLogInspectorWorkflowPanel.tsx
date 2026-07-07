import {
    Box,
    BoxProps,
    Flex,
    FlexProps,
    Heading,
    HeadingProps,
    Input,
    Separator,
    SeparatorProps,
    Stack,
    Text,
    TextProps,
    VStack,
} from '@chakra-ui/react';
import { WorkflowRecord } from '../../utils/workflow-activity-log-inspector/WorkflowActivityLogHelper';
import { convertArrayToSelectOptions, ReactSelectOption } from '../../services/SharedServices';
import { Checkbox } from '../shared/ui-components/checkbox';
import CustomSelect from '../shared/CustomSelect';
import WorkflowRecordCard from './WorkflowRecordCard';

interface WorkflowActivityLogInspectorWorkflowPanelProps {
    workflowRecords: WorkflowRecord[];
    hasLogData: boolean;
    recordIdSearch: string;
    setRecordIdSearch: (value: string) => void;
    uniqueWorkflowNames: string[];
    uniqueVersions: string[];
    selectedWorkflowName: string;
    selectWorkflowName: (workflowName: string) => void;
    selectedVersion: string;
    selectVersion: (version: string) => void;
    showErrorsOnly: boolean;
    setShowErrorsOnly: (value: boolean) => void;
    selectedWorkflowId: string;
    toggleSelectedWorkflowId: (workflowId: string) => void;
}

export default function WorkflowActivityLogInspectorWorkflowPanel({
    workflowRecords,
    hasLogData,
    recordIdSearch,
    setRecordIdSearch,
    uniqueWorkflowNames,
    uniqueVersions,
    selectedWorkflowName,
    selectWorkflowName,
    selectedVersion,
    selectVersion,
    showErrorsOnly,
    setShowErrorsOnly,
    selectedWorkflowId,
    toggleSelectedWorkflowId,
}: WorkflowActivityLogInspectorWorkflowPanelProps) {
    if (!hasLogData) {
        return (
            <Box {...EmptyStatePanelStyle}>
                <Flex {...CenteredFillStyle}>
                    <Text fontSize='sm' color='veeva_dark_gray_text_color_mode'>
                        No workflows to display. Add log data to get started.
                    </Text>
                </Flex>
            </Box>
        );
    }

    return (
        <Box {...PanelContainerStyle}>
            <Box {...FiltersContainerStyle}>
                <Box position='sticky'>
                    <Heading {...HeadingStyle}>Workflows</Heading>
                    <Separator {...HorizontalDividerStyle} />
                </Box>
                <VStack align='stretch' gap={3} paddingTop='8px'>
                    <Stack gap={1}>
                        <Text {...FilterLabelStyle}>ID</Text>
                        <Input
                            size='sm'
                            placeholder='Search Record or Document ID'
                            borderColor='light_gray_color_mode'
                            value={recordIdSearch}
                            onChange={(event) => setRecordIdSearch(event.currentTarget.value)}
                        />
                    </Stack>
                    <Stack gap={1}>
                        <Text {...FilterLabelStyle}>Workflow Name</Text>
                        <CustomSelect
                            options={convertArrayToSelectOptions(uniqueWorkflowNames)}
                            value={
                                selectedWorkflowName
                                    ? { label: selectedWorkflowName, value: selectedWorkflowName }
                                    : null
                            }
                            onChange={(selectedOption: ReactSelectOption | null) =>
                                selectWorkflowName(selectedOption?.value || '')
                            }
                            placeholder='All Names'
                            isClearable
                            size='sm'
                        />
                    </Stack>
                    <Flex align='stretch' gap={3}>
                        <Stack gap={1} flex={1} minWidth='0'>
                            <Text {...FilterLabelStyle}>Version</Text>
                            <CustomSelect
                                options={convertArrayToSelectOptions(uniqueVersions)}
                                value={selectedVersion ? { label: selectedVersion, value: selectedVersion } : null}
                                onChange={(selectedOption: ReactSelectOption | null) =>
                                    selectVersion(selectedOption?.value || '')
                                }
                                placeholder='All Versions'
                                isClearable
                                size='sm'
                            />
                        </Stack>
                        <Stack gap={1} flexShrink={0}>
                            <Text {...FilterLabelStyle} visibility='hidden' aria-hidden>
                                Errors
                            </Text>
                            <Flex align='center' flex={1}>
                                <Checkbox
                                    size='sm'
                                    checked={showErrorsOnly}
                                    onCheckedChange={({ checked }) => setShowErrorsOnly(checked === true)}
                                    css={{ '& [data-part="control"]': { borderColor: 'light_gray_color_mode' } }}
                                >
                                    <Text {...FilterLabelStyle}>Errors</Text>
                                </Checkbox>
                            </Flex>
                        </Stack>
                    </Flex>
                </VStack>
            </Box>

            <Box {...RecordListStyle}>
                {workflowRecords.length === 0 ? (
                    <Text fontSize='sm' color='veeva_dark_gray_text_color_mode'>
                        No matching workflows.
                    </Text>
                ) : (
                    <VStack align='stretch' gap={3}>
                        {workflowRecords.map((workflowRecord) => (
                            <WorkflowRecordCard
                                key={workflowRecord.workflowId}
                                workflowRecord={workflowRecord}
                                isSelected={workflowRecord.workflowId === selectedWorkflowId}
                                onSelect={() => toggleSelectedWorkflowId(workflowRecord.workflowId)}
                            />
                        ))}
                    </VStack>
                )}
            </Box>
        </Box>
    );
}

const EmptyStatePanelStyle: BoxProps = {
    flex: 1,
    backgroundColor: 'white_color_mode',
    height: '100%',
    overflow: 'hidden',
    padding: '16px',
};

const CenteredFillStyle: FlexProps = {
    height: '100%',
    align: 'center',
    justify: 'center',
};

const PanelContainerStyle: BoxProps = {
    flex: 1,
    backgroundColor: 'white_color_mode',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
};

const FiltersContainerStyle: BoxProps = {
    height: '100%',
    flex: '0 0',
    backgroundColor: 'white_color_mode',
    paddingBottom: '16px',
    paddingRight: '16px',
    borderBottom: '1px solid',
    borderColor: 'gray.400',
};

const FilterLabelStyle: TextProps = {
    fontSize: 'xs',
    fontWeight: 'bold',
    color: 'veeva_dark_gray_text_color_mode',
};

const RecordListStyle: BoxProps = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
};

const HeadingStyle: HeadingProps = {
    color: 'veeva_orange_color_mode',
    size: 'xl',
    fontWeight: 'bold',
    margin: '5px',
};

const HorizontalDividerStyle: SeparatorProps = {
    borderColor: 'veeva_light_gray.500',
    borderWidth: '1px',
};
