import {
    Box,
    BoxProps,
    Flex,
    FlexProps,
    Tabs,
    Text,
    TextProps,
    VStack,
    TabsRootProps,
    TabsListProps,
    TabsTriggerProps,
    TabsIndicatorProps,
    TabsContentProps,
} from '@chakra-ui/react';
import { PiListDashes, PiTreeStructure } from 'react-icons/pi';
import {
    GroupedLogItem,
    WorkflowViewMode,
} from '../../utils/workflow-activity-log-inspector/WorkflowActivityLogHelper';
import WorkflowActivityLogProcessView from './WorkflowActivityLogProcessView';
import WorkflowActivityLogItemCard from './WorkflowActivityLogItemCard';
import WorkflowActivityLogEmptyState from './WorkflowActivityLogEmptyState';

interface WorkflowActivityLogInspectorIslandProps {
    viewMode: WorkflowViewMode;
    setViewMode: (mode: WorkflowViewMode) => void;
    groupedLogItems: GroupedLogItem[];
    selectedLogItem: GroupedLogItem | null;
    setSelectedLogItem: (item: GroupedLogItem | null) => void;
    toggleSelectedLogItem: (item: GroupedLogItem) => void;
    selectedWorkflowId: string;
}

export default function WorkflowActivityLogInspectorIsland({
    viewMode,
    setViewMode,
    groupedLogItems,
    selectedLogItem,
    setSelectedLogItem,
    toggleSelectedLogItem,
    selectedWorkflowId,
}: WorkflowActivityLogInspectorIslandProps) {
    const hasLogData = groupedLogItems.length > 0;

    return (
        <Box {...IslandContainerStyle}>
            <Tabs.Root
                value={viewMode}
                onValueChange={(details) =>
                    setViewMode(
                        details.value === WorkflowViewMode.Process ? WorkflowViewMode.Process : WorkflowViewMode.List,
                    )
                }
                lazyMount
                unmountOnExit
                {...TabsRootStyle}
            >
                <Tabs.List {...TabsListStyle}>
                    <Tabs.Trigger value={WorkflowViewMode.List} {...TabStyle}>
                        <PiListDashes style={{ marginRight: '8px' }} />
                        List View
                    </Tabs.Trigger>
                    <Tabs.Trigger value={WorkflowViewMode.Process} {...TabStyle}>
                        <PiTreeStructure style={{ marginRight: '8px' }} />
                        Process View
                    </Tabs.Trigger>
                    <Tabs.Indicator {...TabIndicatorStyle} />
                </Tabs.List>

                <Tabs.Content value={WorkflowViewMode.List} {...TabContentStyle}>
                    {!hasLogData ? (
                        <WorkflowActivityLogEmptyState />
                    ) : (
                        <VStack align='stretch' gap={2}>
                            {groupedLogItems.map((item) => (
                                <WorkflowActivityLogItemCard
                                    key={item.id}
                                    item={item}
                                    isSelected={selectedLogItem?.id === item.id}
                                    onToggle={() => toggleSelectedLogItem(item)}
                                />
                            ))}
                        </VStack>
                    )}
                </Tabs.Content>

                <Tabs.Content value={WorkflowViewMode.Process} {...TabContentStyle}>
                    {!hasLogData ? (
                        <WorkflowActivityLogEmptyState />
                    ) : !selectedWorkflowId ? (
                        <Flex {...ProcessPlaceholderWrapperStyle}>
                            <Box {...ProcessPlaceholderBoxStyle}>
                                <Text {...ProcessPlaceholderTextStyle}>
                                    Please select a workflow from the Workflows panel to visualize the process flow.
                                </Text>
                            </Box>
                        </Flex>
                    ) : (
                        <WorkflowActivityLogProcessView
                            groupedLogItems={groupedLogItems}
                            selectedLogItem={selectedLogItem}
                            onNodeClick={setSelectedLogItem}
                        />
                    )}
                </Tabs.Content>
            </Tabs.Root>
        </Box>
    );
}

const IslandContainerStyle: BoxProps = {
    flex: 1,
    minHeight: 0,
    width: 'calc(100% - 20px)',
    margin: '0px 10px 5px 10px',
    backgroundColor: 'white_color_mode',
    borderRadius: '8px',
    boxShadow: '0 0 5px rgba(0,0,0,0.25)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
};

const TabsRootStyle: TabsRootProps = {
    variant: 'plain',
    width: '100%',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
};

const TabsListStyle: TabsListProps = {
    width: '100%',
    borderBottom: 'solid 3px',
    borderBottomColor: 'gray.400',
};

const TabStyle: Omit<TabsTriggerProps, 'value'> = {
    fontSize: 'xl',
    height: '60px',
    paddingX: '20px',
    color: 'veeva_dark_gray_text_color_mode',
    _selected: { color: 'veeva_orange_color_mode' },
    _hover: { color: 'veeva_orange_color_mode' },
};

const TabIndicatorStyle: TabsIndicatorProps = {
    height: '3px',
    backgroundColor: 'veeva_orange_color_mode',
    zIndex: 2,
    bottom: '-3px',
};

const TabContentStyle: Omit<TabsContentProps, 'value'> = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '16px',
    backgroundColor: 'white_color_mode',
};

const ProcessPlaceholderWrapperStyle: FlexProps = {
    height: '100%',
    align: 'center',
    justify: 'center',
    padding: '40px',
};

const ProcessPlaceholderBoxStyle: BoxProps = {
    padding: '24px',
    borderRadius: '8px',
    backgroundColor: 'blue.50',
    border: '1px solid',
    borderColor: 'blue.200',
    width: '100%',
    textAlign: 'center',
};

const ProcessPlaceholderTextStyle: TextProps = {
    fontSize: 'xl',
    fontWeight: 'bold',
    color: 'blue.700',
};
