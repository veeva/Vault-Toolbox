import { useCallback, useEffect, useRef, useState } from 'react';
import { toaster } from '../../../components/shared/ui-components/toaster';
import { downloadItemContent } from '../../../services/ApiService';
import { FAILURE, CANCELLED, IN_PROGRESS } from '../useFileDownloadModal';

export default function useFileStagingBrowser({
    fileStagingTree,
    setSelectedFileStagingTreeItems,
    setExpandedFileStagingTreeItems,
    setSelectedFileStagingFolder,
}) {
    const [selectedFileStagingSearchResult, setSelectedFileStagingSearchResult] = useState(null);
    const [fileStagingSearchOptions, setFileStagingSearchOptions] = useState([]);
    const [downloadingFileStagingItemName, setDownloadingFileStagingItemName] = useState(null);
    const [downloadFileStagingItemStatus, setDownloadFileStagingItemStatus] = useState('');
    const downloadStatusRef = useRef(downloadFileStagingItemStatus);

    /**
     * Returns an array of nested paths from a given full path.
     * @param {String} filePath - The full path to a folder
     * @returns {string[]} - An array of nested paths
     */
    const getNestedPaths = (filePath) => {
        const segments = filePath.split('/').filter(Boolean);
        const nestedPaths = ['/'];
        let currentPath = '';

        segments.forEach((segment) => {
            currentPath = `${currentPath}/${segment}`;
            nestedPaths.push(currentPath);
        });

        return nestedPaths.slice(0, -1);
    };

    /**
     * Handles when a folder is selected in the Table Body, Breadcrumbs, or Tree.
     * Expands the Tree to the selected folder, and displays the contents in the Table Body.
     * @param {Object} selectedFolder
     */
    const handleFileStagingFolderClick = (selectedFolder) => {
        setSelectedFileStagingFolder({ ...selectedFolder });
        const nestedPaths = getNestedPaths(selectedFolder.index);

        setExpandedFileStagingTreeItems((previousItems) => [...new Set([...previousItems, ...nestedPaths])]);
        setSelectedFileStagingTreeItems([selectedFolder.index]);

        if (selectedFileStagingSearchResult) {
            setSelectedFileStagingSearchResult(null);
        }
    };

    /**
     * Handles downloading a File Staging item
     * @param item
     * @param setIsFileDownloadModalOpen
     * @returns {Promise<void>}
     */
    const handleDownloadFileStagingItemClick = async (item, setIsFileDownloadModalOpen) => {
        try {
            setDownloadingFileStagingItemName(item?.data?.name);
            setIsFileDownloadModalOpen(true);
            setDownloadFileStagingItemStatus(IN_PROGRESS);
            const downloadItemResponse = await downloadItemContent(item.data.path.replace(/^\//, '')); // Remove the leading / from the item path

            if (downloadItemResponse?.responseStatus === FAILURE || downloadStatusRef.current === CANCELLED) {
                toaster.create({
                    title: `${downloadItemResponse.errors[0].type}`,
                    description: `${downloadItemResponse.errors[0].message}`,
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
                setDownloadingFileStagingItemName(null);
                setDownloadFileStagingItemStatus(FAILURE);
                setIsFileDownloadModalOpen(false);
                return;
            }

            const downloadUrl = URL.createObjectURL(downloadItemResponse);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = item.data.name;
            document.body.appendChild(link);
            link.click();
        } finally {
            setDownloadingFileStagingItemName(null);
            setIsFileDownloadModalOpen(false);
        }
    };

    /**
     * Retrieves and sets the searchable items in the search bar, from the File Staging Tree.
     */
    const retrieveSearchOptions = useCallback(() => {
        const tmpSearchOptions = [];
        const excludedValues = ['root', '/'];

        if (fileStagingTree) {
            Object.values(fileStagingTree).forEach((item) => {
                if (!excludedValues.includes(item.index)) {
                    tmpSearchOptions.push({
                        value: item.index,
                        label: item.data?.name || item.index,
                        path: item.index.split('/').slice(0, -1).join('/') || '/',
                    });
                }
            });
        }
        setFileStagingSearchOptions(tmpSearchOptions);
    }, [fileStagingTree]);

    /**
     * Handles when a search result is clicked.
     * @param {Object} item - File Staging Item
     */
    const handleFileStagingSearchResultClick = (item) => {
        setSelectedFileStagingSearchResult(null); // Clear the selected item
        handleFileStagingFolderClick(
            Object.values(fileStagingTree).find((parentItem) => parentItem.children.includes(item.index)),
        );
        setSelectedFileStagingSearchResult(item);
    };

    /**
     * Update the download status ref whenever the state changes
     */
    useEffect(() => {
        downloadStatusRef.current = downloadFileStagingItemStatus;
    }, [downloadFileStagingItemStatus]);

    /**
     * When a search result is selected, update the selected folder if needed.
     */
    useEffect(() => {
        if (selectedFileStagingSearchResult) {
            const parentFolder = Object.values(fileStagingTree).find((folder) =>
                folder.children.includes(selectedFileStagingSearchResult?.index),
            );
            setSelectedFileStagingFolder(parentFolder);
        }
    }, [selectedFileStagingSearchResult, fileStagingTree, setSelectedFileStagingFolder]);

    useEffect(() => {
        retrieveSearchOptions();
    }, [fileStagingTree, retrieveSearchOptions]);

    return {
        fileStagingSearchOptions,
        selectedFileStagingSearchResult,
        downloadingFileStagingItemName,
        handleFileStagingFolderClick,
        handleDownloadFileStagingItemClick,
        handleFileStagingSearchResultClick,
        downloadFileStagingItemStatus,
        setDownloadFileStagingItemStatus,
    };
}
