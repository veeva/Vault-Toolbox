import { Box, Flex, Spacer, VStack } from '@chakra-ui/react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import FileBrowserDirectoryPanel from '../components/file-browser/FileBrowserDirectoryPanel';
import FileBrowserHeaderRow from '../components/file-browser/FileBrowserHeaderRow';
import FileBrowserIsland from '../components/file-browser/FileBrowserIsland';
import ApiHistory from '../components/shared/ApiHistory';
import ContextualHelpButton from '../components/shared/ContextualHelpButton';
import VaultInfoIsland from '../components/shared/vault-info-island/VaultInfoIsland';
import { useSettings } from '../context/SettingsContext';
import useDirectDataBrowser from '../hooks/file-browser/direct-data/useDirectDataBrowser';
import useDirectDataTree from '../hooks/file-browser/direct-data/useDirectDataTree';
import useFileStagingBrowser from '../hooks/file-browser/file-staging/useFileStagingBrowser';
import useFileStagingTree from '../hooks/file-browser/file-staging/useFileStagingTree';
import { useFileBrowserTabs, DIRECT_DATA, FILE_STAGING } from '../hooks/file-browser/useFileBrowserTabs';

export default function FileBrowserPage() {
    const { settings } = useSettings();
    const showFileStaging = settings?.fileBrowser?.featureSettings?.showFileStaging !== false;
    const showDirectData = settings?.fileBrowser?.featureSettings?.showDirectData !== false;

    const { activeTab, setActiveTab } = useFileBrowserTabs({ showFileStaging, showDirectData });

    const {
        fileStagingTree,
        loadingFileStagingTree,
        selectedFileStagingFolder,
        setSelectedFileStagingFolder,
        selectedFileStagingTreeItems,
        setSelectedFileStagingTreeItems,
        expandedFileStagingTreeItems,
        setExpandedFileStagingTreeItems,
        fileStagingTreeError,
        loadingFileStagingTreeFolder,
        handleReloadFileStagingTreeFolder,
        handleExportFileStagingFolder,
        exportingFolderPath,
    } = useFileStagingTree({ isActive: activeTab === FILE_STAGING && showFileStaging });

    const {
        fileStagingSearchOptions,
        selectedFileStagingSearchResult,
        downloadingFileStagingItemName,
        handleFileStagingFolderClick,
        handleDownloadFileStagingItemClick,
        handleFileStagingSearchResultClick,
        downloadFileStagingItemStatus,
        setDownloadFileStagingItemStatus,
    } = useFileStagingBrowser({
        fileStagingTree,
        setSelectedFileStagingTreeItems,
        setExpandedFileStagingTreeItems,
        setSelectedFileStagingFolder,
    });

    const {
        directDataTree,
        selectedDirectDataFolder,
        setSelectedDirectDataFolder,
        selectedDirectDataTreeItems,
        setSelectedDirectDataTreeItems,
        loadingDirectDataTree,
        directDataTreeError,
    } = useDirectDataTree({ isActive: activeTab === DIRECT_DATA && showDirectData });

    const {
        downloadingDirectDataFileName,
        handleDownloadDirectDataItemClick,
        directDataSearchOptions,
        selectedDirectDataSearchResult,
        handleDirectDataSearchResultClick,
        handleDirectDataFolderClick,
        downloadDirectDataItemStatus,
        setDownloadDirectDataItemStatus,
    } = useDirectDataBrowser({
        directDataTree,
        setSelectedDirectDataFolder,
    });

    return (
        <Flex justify='flex-start' height='100%' width='100%'>
            <VStack {...FileBrowserStackStyle}>
                <FileBrowserHeaderRow
                    activeTab={activeTab}
                    fileStagingTree={fileStagingTree}
                    handleFileStagingSearchResultClick={handleFileStagingSearchResultClick}
                    fileStagingSearchOptions={fileStagingSearchOptions}
                    directDataTree={directDataTree}
                    handleDirectDataSearchResultClick={handleDirectDataSearchResultClick}
                    directDataSearchOptions={directDataSearchOptions}
                    showFileStaging={showFileStaging}
                    showDirectData={showDirectData}
                />
                <PanelGroup
                    direction='horizontal'
                    autoSaveId='FileBrowserPage-PanelGroup'
                    style={{
                        height: 'calc(100% - 20px)',
                        paddingBottom: '5px',
                    }}
                >
                    <Panel
                        id='file-browser-directory-panel'
                        defaultSize={25}
                        minSize={20}
                        maxSize={50}
                        style={FileBrowserDirectoryPanelStyle}
                    >
                        <FileBrowserDirectoryPanel
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            fileStagingTree={fileStagingTree}
                            selectedFileStagingTreeItems={selectedFileStagingTreeItems}
                            setSelectedFileStagingTreeItems={setSelectedFileStagingTreeItems}
                            expandedFileStagingTreeItems={expandedFileStagingTreeItems}
                            setExpandedFileStagingTreeItems={setExpandedFileStagingTreeItems}
                            handleFileStagingFolderClick={handleFileStagingFolderClick}
                            handleExportFileStagingFolder={handleExportFileStagingFolder}
                            exportingFolderPath={exportingFolderPath}
                            fileStagingTreeError={fileStagingTreeError}
                            loadingFileStagingTree={loadingFileStagingTree}
                            directDataTree={directDataTree}
                            selectedDirectDataTreeItems={selectedDirectDataTreeItems}
                            setSelectedDirectDataTreeItems={setSelectedDirectDataTreeItems}
                            handleDirectDataFolderClick={handleDirectDataFolderClick}
                            directDataTreeError={directDataTreeError}
                            loadingDirectDataTree={loadingDirectDataTree}
                            showFileStaging={showFileStaging}
                            showDirectData={showDirectData}
                        />
                    </Panel>
                    <Panel id='file-browser-island-panel' style={FileBrowserIslandPanelStyle}>
                        <FileBrowserIsland
                            activeTab={activeTab}
                            fileStagingTree={fileStagingTree}
                            selectedFileStagingFolder={selectedFileStagingFolder}
                            handleReloadFileStagingTreeFolder={handleReloadFileStagingTreeFolder}
                            handleFileStagingFolderClick={handleFileStagingFolderClick}
                            handleDownloadFileStagingItemClick={handleDownloadFileStagingItemClick}
                            downloadingFileStagingItemName={downloadingFileStagingItemName}
                            loadingFileStagingTree={loadingFileStagingTree}
                            loadingFileStagingTreeFolder={loadingFileStagingTreeFolder}
                            selectedFileStagingSearchResult={selectedFileStagingSearchResult}
                            downloadFileStagingItemStatus={downloadFileStagingItemStatus}
                            setDownloadFileStagingItemStatus={setDownloadFileStagingItemStatus}
                            selectedDirectDataFolder={selectedDirectDataFolder}
                            directDataTree={directDataTree}
                            downloadingDirectDataFileName={downloadingDirectDataFileName}
                            handleDownloadDirectDataItemClick={handleDownloadDirectDataItemClick}
                            loadingDirectDataTree={loadingDirectDataTree}
                            selectedDirectDataSearchResult={selectedDirectDataSearchResult}
                            showFileStaging={showFileStaging}
                            showDirectData={showDirectData}
                            downloadDirectDataItemStatus={downloadDirectDataItemStatus}
                            setDownloadDirectDataItemStatus={setDownloadDirectDataItemStatus}
                        />
                    </Panel>
                </PanelGroup>
                <VaultInfoIsland />
            </VStack>
            <Box height='100vh' flex='0 0'>
                <Flex flexDirection='column' height='100%'>
                    <Spacer />
                    <ApiHistory />
                    <ContextualHelpButton
                        tooltip='File Browser Help'
                        url='https://general.veevavault.dev/vault-toolbox/browser-extension/guides/file-browser/'
                    />
                </Flex>
            </Box>
        </Flex>
    );
}

const FileBrowserStackStyle = {
    height: '100%',
    minWidth: 0,
    backgroundColor: 'veeva_light_gray_color_mode',
    flex: 1,
    boxShadow: 'inset -5px 0 8px -8px rgba(0,0,0,0.3), inset 5px 0 8px -8px rgba(0,0,0,0.3)',
    gap: 0,
};

const FileBrowserDirectoryPanelStyle = {
    height: 'calc(100% - 10px)',
    marginTop: '10px',
    marginLeft: '10px',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)',
    borderRadius: '8px',
    backgroundColor: 'white_color_mode',
};

const FileBrowserIslandPanelStyle = {
    height: 'calc(100% - 10px)',
    margin: '10px 10px 0px',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)',
    borderRadius: '8px',
};
