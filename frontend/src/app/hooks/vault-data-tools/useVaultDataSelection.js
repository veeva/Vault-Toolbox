import { useState, useEffect } from 'react';

export default function useVaultDataSelection({ dataType, selectedOptions, setSelectedOptions, vaultObjects, vaultDocumentTypes }) {
    const [disableObjectSelection, setDisableObjectSelection] = useState(false);
    const [disableDocTypeSelection, setDisableDocTypeSelection] = useState(false);

    /*
        Extracts the object or doctype name from the input string
        input - Vault Object or DocType in the format : 'Product (product__v)'
    */
    const extractVaultNames = (input) => {
        if (Array.isArray(input)) {
            return input.map((str) => {
                const match = str.match(/\(([^)]+)\)/);
                return match ? match[1] : null;
            });
        } if (typeof input === 'string') {
            // If it's a single string
            const match = input.match(/\(([^)]+)\)/);
            return match ? match[1] : null;
        }
    };

    const handleAllChecked = (event) => {
        if (dataType === 'DOCUMENTS') {
            setSelectedOptions(event.target.checked ? extractVaultNames(vaultDocumentTypes) : []);
        } else if (dataType === 'OBJECTS') {
            setSelectedOptions(event.target.checked ? extractVaultNames(vaultObjects) : []);
        }
    };

    const handleSingleChecked = (event) => {
        if (event.target.checked) {
            setSelectedOptions([...selectedOptions, extractVaultNames(event.target.name)]);
        } else {
            setSelectedOptions(
                selectedOptions.filter((item) => item !== extractVaultNames(event.target.name))
            );
        }
    };

    // Update selections when data type changes
    useEffect(() => {
        if (dataType === 'ALL') {
            setDisableObjectSelection(true);
            setDisableDocTypeSelection(true);
            setSelectedOptions([]);
        } else if (dataType === 'OBJECTS') {
            setDisableObjectSelection(false);
            setDisableDocTypeSelection(true);
            // Default to selecting all objects
            setSelectedOptions(extractVaultNames(vaultObjects));
        } else if (dataType === 'DOCUMENTS') {
            setDisableObjectSelection(true);
            // Default to selecting all documents
            setSelectedOptions(extractVaultNames(vaultDocumentTypes));
            setDisableDocTypeSelection(false);
        }
    }, [dataType]);

    return { disableObjectSelection, disableDocTypeSelection, extractVaultNames, handleAllChecked, handleSingleChecked }
}
