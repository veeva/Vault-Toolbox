import { Box, Flex, Progress, Tabs } from '@chakra-ui/react';
import { DIRECT_DATA, FILE_STAGING } from '../../hooks/file-browser/useFileBrowserTabs';
import ApiErrorMessageCard from '../shared/ApiErrorMessageCard';
import DirectDataTree from './direct-data/DirectDataTree';
import FileStagingTree from './file-staging/FileStagingTree';

export default function FileBrowserDirectoryPanel({
    activeTab,
    setActiveTab,
    fileStagingTree,
    selectedFileStagingTreeItems,
    setSelectedFileStagingTreeItems,
    expandedFileStagingTreeItems,
    setExpandedFileStagingTreeItems,
    handleFileStagingFolderClick,
    handleExportFileStagingFolder,
    exportingFolderPath,
    fileStagingTreeError,
    loadingFileStagingTree,
    directDataTree,
    selectedDirectDataTreeItems,
    setSelectedDirectDataTreeItems,
    handleDirectDataFolderClick,
    directDataTreeError,
    loadingDirectDataTree,
    showFileStaging,
    showDirectData,
}) {
    return (
        <Flex {...ParentFlexStyle}>
            <Tabs.Root
                {...DirectoryTabsStyle}
                lazyMount
                unmountOnExit
                value={activeTab}
                onValueChange={(details) => details?.value && setActiveTab(details.value)}
            >
                <Flex {...TabsListFlexStyle}>
                    <Tabs.List {...TabListStyle}>
                        {showFileStaging && (
                            <Tabs.Trigger value={FILE_STAGING} {...TabStyle}>
                                <Flex alignItems='center' justifyContent='center' width='100%'>
                                    File Staging
                                </Flex>
                            </Tabs.Trigger>
                        )}
                        {showDirectData && (
                            <Tabs.Trigger value={DIRECT_DATA} {...TabStyle}>
                                <Flex alignItems='center' justifyContent='center' width='100%'>
                                    Direct Data
                                </Flex>
                            </Tabs.Trigger>
                        )}
                        <Tabs.Indicator {...TabIndicatorStyle} />
                    </Tabs.List>
                </Flex>
                {showFileStaging && (
                    <Tabs.Content value={FILE_STAGING} {...TabContentStyle}>
                        {fileStagingTreeError ? (
                            <ApiErrorMessageCard content='file staging directory' errorMessage={fileStagingTreeError} />
                        ) : loadingFileStagingTree ? (
                            <Progress.Root size='sm' value={null} marginTop={4}>
                                <Progress.Track>
                                    <Progress.Range />
                                </Progress.Track>
                            </Progress.Root>
                        ) : (
                            <Box {...TreeBoxStyle}>
                                <FileStagingTree
                                    fileStagingTree={fileStagingTree}
                                    selectedFileStagingTreeItems={selectedFileStagingTreeItems}
                                    setSelectedFileStagingTreeItems={setSelectedFileStagingTreeItems}
                                    expandedFileStagingTreeItems={expandedFileStagingTreeItems}
                                    setExpandedFileStagingTreeItems={setExpandedFileStagingTreeItems}
                                    handleFileStagingFolderClick={handleFileStagingFolderClick}
                                    handleExportFileStagingFolder={handleExportFileStagingFolder}
                                    exportingFolderPath={exportingFolderPath}
                                />
                            </Box>
                        )}
                    </Tabs.Content>
                )}
                {showDirectData && (
                    <Tabs.Content value={DIRECT_DATA} {...TabContentStyle}>
                        {directDataTreeError ? (
                            <ApiErrorMessageCard content='direct data directory' errorMessage={directDataTreeError} />
                        ) : loadingDirectDataTree ? (
                            <Progress.Root size='sm' value={null} marginTop={4}>
                                <Progress.Track>
                                    <Progress.Range />
                                </Progress.Track>
                            </Progress.Root>
                        ) : (
                            <Box {...TreeBoxStyle}>
                                <DirectDataTree
                                    directDataTree={directDataTree}
                                    selectedDirectDataTreeItems={selectedDirectDataTreeItems}
                                    setSelectedDirectDataTreeItems={setSelectedDirectDataTreeItems}
                                    handleDirectDataFolderClick={handleDirectDataFolderClick}
                                />
                            </Box>
                        )}
                    </Tabs.Content>
                )}
            </Tabs.Root>
        </Flex>
    );
}

const ParentFlexStyle = {
    height: '100%',
    maxHeight: '100%',
    borderRadius: '8px',
    backgroundColor: 'white_color_mode',
};

const DirectoryTabsStyle = {
    position: 'relative',
    variant: 'plain',
    size: 'md',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: '8px',
    minHeight: 0,
};

const TabsListFlexStyle = {
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: 'white_color_mode',
    minHeight: '60px',
    maxHeight: '60px',
    height: '60px',
    position: 'sticky',
    top: 0,
    zIndex: 1,
};

const TabListStyle = {
    overflowX: 'none',
    height: '100%',
    width: '100%',
    minWidth: '100%',
    whiteSpace: 'nowrap',
    borderBottom: 'solid 3px',
    borderBottomColor: 'gray.400',
};

const TabStyle = {
    color: 'veeva_orange_color_mode',
    fontSize: 'lg',
    width: '50%',
    minWidth: 'min-content',
    height: '100%',
    paddingX: '0px',
};

const TabIndicatorStyle = {
    bottom: '-3px',
    height: '3px',
    backgroundColor: 'veeva_orange_color_mode',
    zIndex: 2,
};

const TabContentStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    minHeight: 0, // Allows flex children to shrink
};

const TreeBoxStyle = {
    paddingX: 3,
    overflow: 'auto',
    flex: 1,
    minHeight: 0,
};
