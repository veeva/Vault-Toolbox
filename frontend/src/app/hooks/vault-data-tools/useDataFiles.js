import { useEffect, useState } from 'react';
import { createFolderOrFile, listItemsAtAPath } from '../../services/ApiService';

export default function useDataFiles() {
    const [countFiles, setCountFiles] = useState([]);
    const [deleteFiles, setDeleteFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [fetchFilesError, setFetchFilesError] = useState({ hasError: false, errorMessage: '' });
    const [secondsRemaining, setSecondsRemaining] = useState(30);

    /**
     * Retrieves Vault Data Tools files from File Staging. If necessary, creates 
     * required file staging folders for current user.
     * @param {boolean} hasBeenCalledRecursively 
     */
    const fetchFileData = async (hasBeenCalledRecursively) => {
        setFetchFilesError({ hasError: false, errorMessage: '' }); // Clear existing errors

        const userId = sessionStorage.getItem('userId');
        const countFolderPath = `u${userId}/VaultDeveloperToolbox/count`;
        const deleteFolderPath = `u${userId}/VaultDeveloperToolbox/delete`;

        setLoadingFiles(true);

        let tmpCountFiles;
        const countResponse = await listItemsAtAPath(countFolderPath);
        if (countResponse?.responseStatus === 'SUCCESS') {
            if (countResponse?.data) {
                tmpCountFiles = countResponse.data.map((item) => ({
                    fileTimestamp: item.modified_date,
                    filePath: item.path
                }));
            }
        } else if (countResponse?.errors) {
            countResponse.errors.map(async (error) => {
                if (error?.type === 'MALFORMED_URL') {
                    // Create the necessary folders and try again (once)
                    const createFoldersResponse = await createVaultDataToolsFileStagingFolders();
                    if (createFoldersResponse && !hasBeenCalledRecursively) {
                        fetchFileData(true);
                    } else {
                        setFetchFilesError({ hasError: true, errorMessage: 'Error creating necessary file staging folders' });
                    }
                } else {
                    let error = 'Error retrieving count data files'
                    if (countResponse?.errors?.length > 0) {
                        error = `${countResponse?.errors[0]?.type} : ${countResponse?.errors[0]?.message}`
                    }
                    setFetchFilesError({ hasError: true, errorMessage: error })
                }
            });
        }
        setCountFiles(tmpCountFiles);

        let tmpDeleteFiles;
        const deleteResponse = await listItemsAtAPath(deleteFolderPath);
        if (deleteResponse?.responseStatus === 'SUCCESS') {
            if (deleteResponse?.data) {
                tmpDeleteFiles = deleteResponse.data.map((item) => ({
                    fileTimestamp: item.modified_date,
                    filePath: item.path
                }));
            }
        } else if (deleteResponse?.errors) {
            deleteResponse.errors.map(async (error) => {
                if (error?.type === 'MALFORMED_URL') {
                    // Create the necessary folders and try again (once)
                    const createFoldersResponse = await createVaultDataToolsFileStagingFolders();
                    if (createFoldersResponse && !hasBeenCalledRecursively) {
                        fetchFileData(true);
                    } else {
                        setFetchFilesError({ hasError: true, errorMessage: 'Error creating necessary file staging folders' });
                    }
                } else {
                    let error = 'Error retrieving delete data files'
                    if (deleteResponse?.errors?.length > 0) {
                        error = `${deleteResponse?.errors[0]?.type} : ${deleteResponse?.errors[0]?.message}`
                    }
                    setFetchFilesError({ hasError: true, errorMessage: error })
                }
            });
        }
        setDeleteFiles(tmpDeleteFiles);

        setLoadingFiles(false);
    };

    /**
     * Creates folders required for Vault Data Tools
     * @returns true for success, false otherwise
     */
    const createVaultDataToolsFileStagingFolders = async () => {
        const userId = sessionStorage.getItem('userId');
        const vaultToolboxPath = `u${userId}/VaultDeveloperToolbox`;
        const countFolderPath = `${vaultToolboxPath}/count`;
        const deleteFolderPath = `${vaultToolboxPath}/delete`;

        let response = await createFolderOrFile('FOLDER', vaultToolboxPath);
        if (!response?.responseStatus === 'SUCCESS') {
            return false;
        }

        response = await createFolderOrFile('FOLDER', countFolderPath);
        if (!response?.responseStatus === 'SUCCESS') {
            return false;
        }

        response = await createFolderOrFile('FOLDER', deleteFolderPath);
        if (!response?.responseStatus === 'SUCCESS') {
            return false;
        }

        // All folders created successfully
        return true;
    };

    const handleFileRefresh = () => {
        fetchFileData();
        setSecondsRemaining(30);
    };

    // Fetch result from the Vault File Staging area upon load
    useEffect(() => {
        fetchFileData();
    }, []);

    // Fetch results from the Vault File Staging area every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setSecondsRemaining((secondsRemaining) => secondsRemaining - 1);

            if (secondsRemaining === 0) {
                fetchFileData();
                setSecondsRemaining(30);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [secondsRemaining]);

    return { 
        countFiles,
        deleteFiles,
        loadingFiles,
        fetchFilesError,
        secondsRemaining,
        handleFileRefresh
    }
}
