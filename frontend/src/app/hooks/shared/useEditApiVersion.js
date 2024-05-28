import {useEffect, useState} from 'react';
import {getVaultApiVersion, getVaultDns} from '../../services/SharedServices';
import {retrieveApiVersions} from '../../services/vapil/AuthenticationRequest';

export default function useEditApiVersion({ onClose }) {
    const [selectedApiVersion, setSelectedApiVersion] = useState(getVaultApiVersion());
    const [apiVersions, setApiVersions] = useState([]);
    const [vaultApiVersionsError, setVaultApiVersionsError] = useState({ hasError: false, errorMessage: '' });
    const [loadingVaultApiVersions, setLoadingVaultApiVersions] = useState(false);

    /**
     * Retrieves the current Vault's API Versions
     * @returns {Promise<void>}
     */
    const getApiVersions = async () => {
        setVaultApiVersionsError({ hasError: false, errorMessage: '' });
        setLoadingVaultApiVersions(true);

        const { response } = await retrieveApiVersions(sessionStorage.getItem('sessionId'), getVaultDns());
        if (response?.responseStatus === 'SUCCESS') {
            if (response?.values) {
                const apiVersionsArray = Object.keys(response.values).map(key => key);
                setApiVersions(apiVersionsArray.reverse());
            }
        } else {
            let error = '';
            if (response?.errors?.length > 0) {
                error = `${response.errors[0].type} : ${response.errors[0].message}`
            }
            setVaultApiVersionsError({ hasError: true, errorMessage: error });
        }

        setLoadingVaultApiVersions(false);
    }

    /**
     * Handles closing the select API version modal.
     */
    const handleModalClose = () => {
        setSelectedApiVersion('');
        onClose();
    }

    /**
     * Handles saving the selected API version.
     */
    const handleSave = () => {
        sessionStorage.setItem('vaultApiVersion', selectedApiVersion);
        onClose();
    }

    /**
     * Retrieve the Vault's API Versions when the Modal is rendered
     */
    useEffect(() => {
        getApiVersions();
    }, []);

    return {
        selectedApiVersion,
        setSelectedApiVersion,
        apiVersions,
        vaultApiVersionsError,
        loadingVaultApiVersions,
        handleSave,
        handleModalClose
    }
}