import { useEffect, useState } from 'react';
import { retrieveAllDocumentTypes, retrieveObjectCollection } from '../../services/ApiService';

export default function useVaultData() {
    const [vaultObjects, setVaultObjects] = useState([]);
    const [vaultDocumentTypes, setVaultDocumentTypes] = useState([]);
    const [fetchObjAndDocTypeError, setFetchObjAndDocTypeError] = useState({ hasError: false, errorMessage: '' });

    /**
     * Retrieves Vault Objects and Document Types
     */
    const fetchVaultObjectsAndDocTypes = async () => {
        setFetchObjAndDocTypeError({ hasError: false, errorMessage: '' }); // Clear existing errors

        const objectResponse = await retrieveObjectCollection();

        if (objectResponse?.responseStatus === 'SUCCESS') {
            const vaultObjectsArray = objectResponse.objects.map((object) => `${object.label} (${object.name})`);
            setVaultObjects(vaultObjectsArray.sort());
        } else {
            setFetchObjAndDocTypeError({ hasError: true, errorMessage: `${objectResponse?.errors[0]?.type} : ${objectResponse?.errors[0]?.message}` });
        }

        const docTypesResponse = await retrieveAllDocumentTypes();

        if (docTypesResponse?.responseStatus === 'SUCCESS') {
            const vaultDocTypesArray = docTypesResponse.types.map((doctype) => {
                const valueParts = doctype.value.split('/');
                const docTypeName = valueParts[valueParts.length - 1];
                return `${doctype.label} (${docTypeName})`;
            });
            setVaultDocumentTypes(vaultDocTypesArray.sort());
        } else {
            setFetchObjAndDocTypeError({ hasError: true, errorMessage: `${docTypesResponse?.errors[0]?.type} : ${docTypesResponse?.errors[0]?.message}` });
        }
    };

    // Fetch objects and document types on page load load
    useEffect(() => {
        fetchVaultObjectsAndDocTypes();
    }, []);

    return { vaultObjects, vaultDocumentTypes, fetchObjAndDocTypeError }
}
