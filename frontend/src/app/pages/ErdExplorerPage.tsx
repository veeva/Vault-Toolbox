import { CSSProperties } from 'react';
import {
    Box,
    FileUploadHiddenInput,
    FileUploadRootProvider,
    Flex,
    IconButton,
    IconButtonProps,
    Separator,
    SeparatorProps,
    Spacer,
    StackProps,
    useFileUpload,
    VStack,
} from '@chakra-ui/react';
import { PiListChecks, PiPlusCircle, PiSliders } from 'react-icons/pi';
import { Panel, PanelGroup } from 'react-resizable-panels';
import ApiHistory from '../components/shared/ApiHistory';
import ContextualHelpButton from '../components/shared/ContextualHelpButton';
import VerticalResizeHandle from '../components/shared/VerticalResizeHandle';
import VaultInfoIsland from '../components/shared/vault-info-island/VaultInfoIsland';
import { Toaster } from '../components/shared/ui-components/toaster';
import { Tooltip } from '../components/shared/ui-components/tooltip';
import useErdExplorer from '../hooks/erd-explorer/useErdExplorer';
import ErdExplorerHeaderRow from '../components/erd-explorer/ErdExplorerHeaderRow';
import ErdExplorerIsland from '../components/erd-explorer/ErdExplorerIsland';
import ErdExplorerSidebar from '../components/erd-explorer/ErdExplorerSidebar';
import ErdImportConfirmDialog from '../components/erd-explorer/ErdImportConfirmDialog';

export default function ErdExplorerPage() {
    const controller = useErdExplorer();
    const {
        activeTab,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebarTab,
        placedObjects,
        exportProject,
        exportPng,
        exportSvg,
        exportMarkdown,
        handleProjectImport,
        pendingImportProject,
        cancelImport,
        confirmImport,
    } = controller;

    const fileUpload = useFileUpload({
        accept: ['.json'],
        maxFiles: 1,
        onFileAccept: (details) => {
            const file = details.files[0];
            if (file) void handleProjectImport(file);
            fileUpload.clearFiles();
        },
    });

    return (
        <Flex justify='flex-start' height='100%' width='100%'>
            <PanelGroup direction='horizontal' autoSaveId='ErdExplorerPage-PanelGroup'>
                <Panel id='erd-explorer-island-panel' order={1}>
                    <FileUploadRootProvider value={fileUpload} asChild>
                        <VStack {...IslandStackStyle}>
                            <FileUploadHiddenInput />
                            <ErdExplorerHeaderRow
                                hasNodes={placedObjects.length > 0}
                                exportProject={exportProject}
                                exportPng={exportPng}
                                exportSvg={exportSvg}
                                exportMarkdown={exportMarkdown}
                                onImport={() => fileUpload.openFilePicker()}
                            />
                            <ErdExplorerIsland controller={controller} />
                            <VaultInfoIsland />
                        </VStack>
                    </FileUploadRootProvider>
                </Panel>

                {!sidebarCollapsed ? (
                    <>
                        <VerticalResizeHandle sidePanelCollapsed={sidebarCollapsed} />
                        <Panel
                            id='erd-explorer-right-panel'
                            order={2}
                            defaultSize={30}
                            minSize={22}
                            maxSize={45}
                            collapsible
                            onCollapse={() => setSidebarCollapsed(true)}
                            onExpand={() => setSidebarCollapsed(false)}
                            style={RightPanelStyle}
                        >
                            <ErdExplorerSidebar controller={controller} />
                        </Panel>
                        <Separator {...VerticalDividerStyle} />
                    </>
                ) : null}
            </PanelGroup>

            <Toaster />
            {pendingImportProject && (
                <ErdImportConfirmDialog
                    onCancel={cancelImport}
                    onMerge={() => confirmImport('merge')}
                    onReplace={() => confirmImport('replace')}
                />
            )}

            <Box height='100vh' flex='0 0'>
                <Flex flexDirection='column' height='100%'>
                    <Tooltip content='Add Objects' showArrow positioning={{ placement: 'left' }}>
                        <IconButton
                            onClick={() => toggleSidebarTab('addObjects')}
                            color={!sidebarCollapsed && activeTab === 'addObjects' ? 'white' : 'veeva_orange_color_mode'}
                            backgroundColor={!sidebarCollapsed && activeTab === 'addObjects' ? 'veeva_orange_color_mode' : 'transparent'}
                            {...SidebarToggleButtonStyle}
                        >
                            <PiPlusCircle size={20} style={{ margin: '4px' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip content='Field Selector' showArrow positioning={{ placement: 'left' }}>
                        <IconButton
                            onClick={() => toggleSidebarTab('fields')}
                            color={!sidebarCollapsed && activeTab === 'fields' ? 'white' : 'veeva_orange_color_mode'}
                            backgroundColor={!sidebarCollapsed && activeTab === 'fields' ? 'veeva_orange_color_mode' : 'transparent'}
                            {...SidebarToggleButtonStyle}
                        >
                            <PiListChecks size={20} style={{ margin: '4px' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip content='View Settings' showArrow positioning={{ placement: 'left' }}>
                        <IconButton
                            onClick={() => toggleSidebarTab('settings')}
                            color={!sidebarCollapsed && activeTab === 'settings' ? 'white' : 'veeva_orange_color_mode'}
                            backgroundColor={!sidebarCollapsed && activeTab === 'settings' ? 'veeva_orange_color_mode' : 'transparent'}
                            {...SidebarToggleButtonStyle}
                        >
                            <PiSliders size={20} style={{ margin: '4px' }} />
                        </IconButton>
                    </Tooltip>
                    <Spacer />
                    <ApiHistory />
                    <ContextualHelpButton
                        tooltip='ERD Explorer'
                        url='https://general.veevavault.dev/vault-toolbox/browser-extension/guides/erd-explorer'
                    />
                </Flex>
            </Box>
        </Flex>
    );
}

const IslandStackStyle: StackProps = {
    height: '100%',
    minWidth: 0,
    backgroundColor: 'veeva_light_gray_color_mode',
    flex: 1,
    boxShadow: 'inset -5px 0 8px -8px rgba(0,0,0,0.3), inset 5px 0 8px -8px rgba(0,0,0,0.3)',
    gap: 0,
};

const RightPanelStyle: CSSProperties = {
    height: '100%',
    overflow: 'hidden',
};

const VerticalDividerStyle: SeparatorProps = {
    orientation: 'vertical',
    borderColor: 'veeva_light_gray.500',
    height: 'auto',
    borderWidth: '1px',
};

const SidebarToggleButtonStyle: IconButtonProps = {
    minWidth: 'auto',
    width: 'auto',
    height: 'auto',
    padding: 0,
    borderRadius: '6px',
    margin: '5px',
};
