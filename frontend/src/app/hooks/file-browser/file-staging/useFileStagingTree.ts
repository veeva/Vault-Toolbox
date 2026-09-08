import { useCallback, useEffect, useState } from 'react';
import { listItemsAtAPath, listItemsAtAPathByPage } from '../../../services/ApiService';
import { downloadFileStagingListingCsv, fileStagingItemsToRows, type FileStagingApiItem } from '../../../utils/file-browser/FileBrowserHelper';

interface FileStagingItemData {
    name?: string;
    path?: string;
    size?: number | null;
    modified_date?: string | null;
}

interface FileStagingTreeNode {
    index: string;
    data: FileStagingItemData;
    isFolder: boolean;
    children: string[];
}

type FileStagingTreeMap = Record<string, FileStagingTreeNode>;

interface ListItemsResponse {
    responseStatus?: string;
    errors?: { type?: string; message?: string }[];
    data?: FileStagingApiItem[];
    responseDetails?: { next_page?: string };
}

const fileStagingRoot: FileStagingTreeNode = {
    index: '/',
    data: {
        name: '/',
        path: '/',
    },
    isFolder: true,
    children: [],
};

export default function useFileStagingTree({ isActive }: { isActive: boolean }) {
    const [fileStagingTree, setFileStagingTree] = useState<FileStagingTreeMap>({});
    const [fileStagingTreeError, setFileStagingTreeError] = useState('');
    const [loadingFileStagingTree, setLoadingFileStagingTree] = useState(false);
    const [loadingFileStagingTreeFolder, setLoadingFileStagingTreeFolder] = useState(false);
    const [exportingFolderPath, setExportingFolderPath] = useState<string | null>(null);
    const [selectedFileStagingFolder, setSelectedFileStagingFolder] = useState<FileStagingTreeNode>({
        ...fileStagingRoot,
    });
    const [selectedFileStagingTreeItems, setSelectedFileStagingTreeItems] = useState<string[]>([
        selectedFileStagingFolder?.index || '/',
    ]);
    const [expandedFileStagingTreeItems, setExpandedFileStagingTreeItems] = useState<string[]>(['/']);

    /**
     * Method that is called recursively to add a File Staging item to the tree, and also check for and add
     * the nested folders leading up to the item (IE: /folder1/folder2/file.txt)
     * @param item - File Staging item
     * @param parts - Array of individual parts from a full path
     * @param parent - Parent to the current part being added
     * @param tree - File Staging tree
     */
    const addToFileStagingTree = useCallback(
        (item: FileStagingApiItem, parts: string[], parent: string, tree: FileStagingTreeMap) => {
            const parentPath = parent === '/' ? '' : parent;
            const partKey = `${parentPath}/${parts[0]}`;
            const isFolder = parts.length > 1 || item.kind === 'folder';

            if (!tree[partKey]) {
                tree[partKey] = {
                    index: partKey,
                    isFolder: isFolder,
                    children: [],
                    data: {
                        name: parts[0],
                        path: partKey,
                        size: item.size || null, // Only exists for files, not folders
                        modified_date: item.modified_date || null, // Only exists for files, not folders
                    },
                };

                tree[parent].children.push(partKey);
            }

            if (parts.length > 1) {
                parts.shift();
                addToFileStagingTree(item, parts, partKey, tree);
            }
        },
        [],
    );

    /**
     * Calls the Vault REST API List Items at a Path endpoint with next_page url
     * @param {String} nextPage - Next page URL
     */
    const retrieveNextPage = useCallback(async (nextPage: string): Promise<ListItemsResponse | undefined> => {
        try {
            const nextPageResponse: ListItemsResponse = await listItemsAtAPathByPage(nextPage);
            if (nextPageResponse?.responseStatus === 'FAILURE') {
                let error = '';
                if (nextPageResponse?.errors?.length) {
                    error = `${nextPageResponse.errors[0].type} : ${nextPageResponse.errors[0].message}`;
                }
                setFileStagingTreeError(error);
                return;
            }
            return nextPageResponse;
        } catch (error) {
            setFileStagingTreeError(error instanceof Error ? error.message : 'Error retrieving next page results');
        }
    }, []);

    /**
     * Builds the File Staging tree from the listItemsAtAPath API
     * @param listItemsResponse - Response from the listItemsAtAPath API
     * @param tmpFileStagingTree - Temporary file staging tree
     */
    const buildFileStagingTree = useCallback(
        async (listItemsResponse: ListItemsResponse, tmpFileStagingTree: FileStagingTreeMap) => {
            for (const item of listItemsResponse.data || []) {
                const parts = item.path.split('/').filter(Boolean);
                addToFileStagingTree(item, parts, '/', tmpFileStagingTree);
            }

            if (listItemsResponse.responseDetails?.next_page) {
                const listItemsPageResponse = await retrieveNextPage(listItemsResponse.responseDetails.next_page);
                if (listItemsPageResponse?.data) {
                    await buildFileStagingTree(listItemsPageResponse, tmpFileStagingTree);
                }
            }
        },
        [addToFileStagingTree, retrieveNextPage],
    );

    /**
     * Calls the Vault REST API to build the File Staging tree
     */
    const retrieveFileStagingTree = useCallback(async () => {
        setLoadingFileStagingTree(true);
        setFileStagingTreeError('');
        const tmpFileStagingTree: FileStagingTreeMap = {
            root: {
                index: 'root',
                data: { name: 'root', path: 'root' },
                isFolder: true,
                children: ['/'],
            },
        };

        tmpFileStagingTree['/'] = JSON.parse(JSON.stringify(fileStagingRoot));

        try {
            const listItemsResponse: ListItemsResponse = await listItemsAtAPath('', true);
            if (listItemsResponse?.responseStatus === 'FAILURE') {
                let error = '';
                if (listItemsResponse?.errors?.length) {
                    error = `${listItemsResponse.errors[0].type} : ${listItemsResponse.errors[0].message}`;
                }
                setFileStagingTreeError(error);
                return;
            }
            if (listItemsResponse.data) {
                await buildFileStagingTree(listItemsResponse, tmpFileStagingTree);
                setFileStagingTree(tmpFileStagingTree);
            }
        } catch (error) {
            setFileStagingTreeError(error instanceof Error ? error.message : 'Error retrieving file staging tree');
        } finally {
            setLoadingFileStagingTree(false);
        }
    }, [buildFileStagingTree]);

    /**
     * Updates the file staging tree with the list items response and calls for next page results if required
     * @param listItemsResponse - Response from the listItemsAtAPath API
     * @param tmpFileStagingTree - Temporary file staging tree as it's being built
     */
    const updateFileStagingTreeFolder = useCallback(
        async (listItemsResponse: ListItemsResponse, tmpFileStagingTree: FileStagingTreeMap) => {
            for (const item of listItemsResponse.data || []) {
                const parts = item.path.split('/').filter(Boolean);
                addToFileStagingTree(item, parts, '/', tmpFileStagingTree);
            }
            if (listItemsResponse.responseDetails?.next_page) {
                const listItemsPageResponse = await retrieveNextPage(listItemsResponse.responseDetails.next_page);
                if (listItemsPageResponse?.data) {
                    await updateFileStagingTreeFolder(listItemsPageResponse, tmpFileStagingTree);
                }
            }
        },
        [addToFileStagingTree, retrieveNextPage],
    );

    /**
     * Calls Vault REST API List Items at a path endpoint for a specific path and updates that folder
     * and all subcomponents in the file staging tree
     * @param selectedFolderPath - Folder path to call the API for and update the tree
     */
    const handleReloadFileStagingTreeFolder = async (selectedFolderPath: string) => {
        try {
            setLoadingFileStagingTreeFolder(true);
            const listItemsResponse: ListItemsResponse = await listItemsAtAPath(selectedFolderPath, true);

            if (listItemsResponse?.responseStatus === 'FAILURE') {
                let error = '';
                if (listItemsResponse?.errors?.length) {
                    error = `${listItemsResponse.errors[0].type} : ${listItemsResponse.errors[0].message}`;
                }
                setFileStagingTreeError(error);
                return;
            }

            const updatedPath = selectedFolderPath.startsWith('/') ? selectedFolderPath : `/${selectedFolderPath}`;
            const tmpFileStagingTree = { ...fileStagingTree };

            const clearSubtree = (tree: FileStagingTreeMap, parentIndex: string) => {
                const children = tree[parentIndex]?.children || [];
                children.forEach((childKey) => {
                    if (tree[childKey]?.isFolder) {
                        clearSubtree(tree, childKey);
                    }
                    delete tree[childKey];
                });
                if (tree[parentIndex]) {
                    tree[parentIndex].children = [];
                }
            };

            clearSubtree(tmpFileStagingTree, updatedPath);

            await updateFileStagingTreeFolder(listItemsResponse, tmpFileStagingTree);
            setFileStagingTree(tmpFileStagingTree);
        } catch (error) {
            setFileStagingTreeError(
                error instanceof Error ? error.message : 'Error reloading file staging tree folder',
            );
        } finally {
            setLoadingFileStagingTreeFolder(false);
        }
    };

    /**
     * Fetches a fresh listing for the given folder, refreshes the tree, and downloads the listing
     * as CSV. A single API call covers both: the same first-page response is used to update the
     * tree node AND to seed the flat items list for the CSV, avoiding a duplicate request.
     * @param selectedFolderPath - Folder path to list and export
     */
    const handleExportFileStagingFolder = async (selectedFolderPath: string) => {
        try {
            setExportingFolderPath(selectedFolderPath);
            setLoadingFileStagingTreeFolder(true);

            const listItemsResponse: ListItemsResponse = await listItemsAtAPath(selectedFolderPath, true);

            if (listItemsResponse?.responseStatus === 'FAILURE') {
                let error = '';
                if (listItemsResponse?.errors?.length) {
                    error = `${listItemsResponse.errors[0].type} : ${listItemsResponse.errors[0].message}`;
                }
                setFileStagingTreeError(error);
                return;
            }

            // Refresh the tree node in-place with the fetched response.
            const updatedPath = selectedFolderPath.startsWith('/') ? selectedFolderPath : `/${selectedFolderPath}`;
            const tmpFileStagingTree = { ...fileStagingTree };
            const clearSubtree = (tree: FileStagingTreeMap, parentIndex: string) => {
                const children = tree[parentIndex]?.children || [];
                children.forEach((childKey) => {
                    if (tree[childKey]?.isFolder) clearSubtree(tree, childKey);
                    delete tree[childKey];
                });
                if (tree[parentIndex]) tree[parentIndex].children = [];
            };
            clearSubtree(tmpFileStagingTree, updatedPath);
            await updateFileStagingTreeFolder(listItemsResponse, tmpFileStagingTree);
            setFileStagingTree(tmpFileStagingTree);

            // Collect the full flat item list for CSV using the same first-page response.
            const items: FileStagingApiItem[] = [...(listItemsResponse?.data || [])];
            let nextPage = listItemsResponse?.responseDetails?.next_page;
            while (nextPage) {
                const pageResponse = await retrieveNextPage(nextPage);
                const pageItems = pageResponse?.data;
                if (!pageItems) {
                    break;
                }
                items.push(...pageItems);
                nextPage = pageResponse?.responseDetails?.next_page;
            }

            const folderName = selectedFolderPath?.split('/').filter(Boolean).pop() || '';
            downloadFileStagingListingCsv(fileStagingItemsToRows(items), folderName);
        } catch (error) {
            setFileStagingTreeError(error instanceof Error ? error.message : 'Error exporting file staging listing');
        } finally {
            setLoadingFileStagingTreeFolder(false);
            setExportingFolderPath(null);
        }
    };

    useEffect(() => {
        if (isActive) {
            retrieveFileStagingTree();
        }
    }, [isActive, retrieveFileStagingTree]);

    return {
        fileStagingTree,
        selectedFileStagingFolder,
        setSelectedFileStagingFolder,
        selectedFileStagingTreeItems,
        setSelectedFileStagingTreeItems,
        expandedFileStagingTreeItems,
        setExpandedFileStagingTreeItems,
        loadingFileStagingTree,
        handleReloadFileStagingTreeFolder,
        handleExportFileStagingFolder,
        loadingFileStagingTreeFolder,
        exportingFolderPath,
        fileStagingTreeError,
    };
}
