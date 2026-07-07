import {
    Flex,
    Spacer,
    VStack,
    Box,
    IconButton,
    StackProps,
    Separator,
    IconButtonProps,
    SeparatorProps,
    FileUploadRootProvider,
    FileUploadHiddenInput,
} from '@chakra-ui/react';
import { PiFunnelSimple } from 'react-icons/pi';
import { Panel, PanelGroup } from 'react-resizable-panels';
import ContextualHelpButton from '../components/shared/ContextualHelpButton';
import VaultInfoIsland from '../components/shared/vault-info-island/VaultInfoIsland';
import TelemetryData from '../components/shared/TelemetryData';
import VerticalResizeHandle from '../components/shared/VerticalResizeHandle';
import useWorkflowActivityLogInspector from '../hooks/workflow-activity-log-inspector/useWorkflowActivityLogInspector';
import { Toaster } from '../components/shared/ui-components/toaster';
import WorkflowActivityLogInspectorIsland from '../components/workflow-activity-log-inspector/WorkflowActivityLogInspectorIsland';
import WorkflowActivityLogInspectorHeaderRow from '../components/workflow-activity-log-inspector/WorkflowActivityLogInspectorHeaderRow';
import WorkflowActivityLogInspectorWorkflowPanel from '../components/workflow-activity-log-inspector/WorkflowActivityLogInspectorWorkflowPanel';
import ApiHistory from '../components/shared/ApiHistory';
import { CSSProperties, useState } from 'react';

export default function WorkflowActivityLogInspectorPage() {
    const {
        telemetryData,
        isLoading,
        isUploading,
        selectedDate,
        setSelectedDate,
        fetchLogData,
        fileUploadRootProviderAttributes,
        clearLogData,
        viewMode,
        setViewMode,
        groupedLogItems,
        selectedLogItem,
        setSelectedLogItem,
        toggleSelectedLogItem,
        selectedWorkflowId,
        toggleSelectedWorkflowId,
        selectedWorkflowName,
        selectWorkflowName,
        selectedVersion,
        selectVersion,
        recordIdSearch,
        setRecordIdSearch,
        showErrorsOnly,
        setShowErrorsOnly,
        workflowRecords,
        hasLogData,
        uniqueWorkflowNames,
        uniqueVersions,
    } = useWorkflowActivityLogInspector();

    const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
    const toggleSidePanel = () => setSidePanelCollapsed((collapsed) => !collapsed);

    return (
        <Flex justify='flex-start' height='100%' width='100%'>
            <PanelGroup direction='horizontal' autoSaveId='WorkflowActivityLogInspectorPage-PanelGroup'>
                <Panel id='workflow-activity-log-inspector-island-panel' order={1}>
                    <FileUploadRootProvider value={fileUploadRootProviderAttributes} asChild>
                        <VStack {...WorkflowActivityLogInspectorStackStyle}>
                            <FileUploadHiddenInput />
                            <WorkflowActivityLogInspectorHeaderRow
                                selectedDate={selectedDate}
                                setSelectedDate={setSelectedDate}
                                fetchLogData={fetchLogData}
                                clearLogData={clearLogData}
                                isLoading={isLoading}
                                isUploading={isUploading}
                                hasLogData={hasLogData}
                            />
                            <WorkflowActivityLogInspectorIsland
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                groupedLogItems={groupedLogItems}
                                selectedLogItem={selectedLogItem}
                                setSelectedLogItem={setSelectedLogItem}
                                toggleSelectedLogItem={toggleSelectedLogItem}
                                selectedWorkflowId={selectedWorkflowId}
                            />
                            <VaultInfoIsland>
                                <TelemetryData telemetryData={telemetryData} />
                            </VaultInfoIsland>
                        </VStack>
                    </FileUploadRootProvider>
                </Panel>

                {!sidePanelCollapsed ? (
                    <>
                        <VerticalResizeHandle sidePanelCollapsed={sidePanelCollapsed} />
                        <Panel
                            id='workflow-activity-log-inspector-right-panel'
                            order={2}
                            defaultSize={50}
                            minSize={30}
                            maxSize={50}
                            collapsible
                            onCollapse={() => setSidePanelCollapsed(true)}
                            onExpand={() => setSidePanelCollapsed(false)}
                            style={WorkflowActivityLogInspectorWorkflowPanelStyle}
                        >
                            <WorkflowActivityLogInspectorWorkflowPanel
                                workflowRecords={workflowRecords}
                                hasLogData={hasLogData}
                                recordIdSearch={recordIdSearch}
                                setRecordIdSearch={setRecordIdSearch}
                                uniqueWorkflowNames={uniqueWorkflowNames}
                                uniqueVersions={uniqueVersions}
                                selectedWorkflowName={selectedWorkflowName}
                                selectWorkflowName={selectWorkflowName}
                                selectedVersion={selectedVersion}
                                selectVersion={selectVersion}
                                showErrorsOnly={showErrorsOnly}
                                setShowErrorsOnly={setShowErrorsOnly}
                                selectedWorkflowId={selectedWorkflowId}
                                toggleSelectedWorkflowId={toggleSelectedWorkflowId}
                            />
                        </Panel>
                        <Separator {...VerticalDividerStyle} />
                    </>
                ) : null}
            </PanelGroup>
            <Toaster />
            <Box height='100vh' flex='0 0'>
                <Flex flexDirection='column' height='100%'>
                    <IconButton
                        aria-label='Toggle Workflow Selector'
                        onClick={toggleSidePanel}
                        color={!sidePanelCollapsed ? 'white' : 'veeva_orange_color_mode'}
                        backgroundColor={!sidePanelCollapsed ? 'veeva_orange_color_mode' : 'transparent'}
                        {...ToggleSidebarButtonStyle}
                    >
                        <PiFunnelSimple size={20} style={{ margin: '4px' }} />
                    </IconButton>
                    <Spacer />
                    <ApiHistory />
                    <ContextualHelpButton
                        tooltip='Workflow Activity Log Inspector'
                        url='https://general.veevavault.dev/vault-toolbox/browser-extension/guides/workflow-inspector'
                    />
                </Flex>
            </Box>
        </Flex>
    );
}

const WorkflowActivityLogInspectorStackStyle: StackProps = {
    height: '100%',
    minWidth: 0,
    backgroundColor: 'veeva_light_gray_color_mode',
    flex: 1,
    boxShadow: 'inset -5px 0 8px -8px rgba(0,0,0,0.3), inset 5px 0 8px -8px rgba(0,0,0,0.3)',
    gap: 0,
};

const WorkflowActivityLogInspectorWorkflowPanelStyle: CSSProperties = {
    height: '100%',
    overflow: 'hidden',
};

const ToggleSidebarButtonStyle: IconButtonProps = {
    minWidth: 'auto',
    width: 'auto',
    height: 'auto',
    padding: 0,
    borderRadius: '6px',
    margin: '5px',
};

const VerticalDividerStyle: SeparatorProps = {
    orientation: 'vertical',
    borderColor: 'veeva_light_gray.500',
    height: 'auto',
    borderWidth: '1px',
};
