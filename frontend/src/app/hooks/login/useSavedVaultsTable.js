import { useState, useEffect, useRef } from 'react';

export default function useSavedVaultsTable({ savedVaultData, setSavedVaultData, setVaultDNS, setUsername, setFocusToPasswordInput, isEditable }) {
    const [defaultVaultRowIndex, setDefaultVaultRowIndex] = useState(-1);
    const newEditableRowRef = useRef(null);

    const DEFAULT = 'default';
    const VAULT_DNS = 'vaultDNS';
    const USERNAME = 'username';

    /**
     * Loads the DNS/username from a row in the Saved Vaults table into the input form.
     * @param {Number} rowIndex - index of the selected row
     */
    const handleRowClick = (rowIndex) => {
        const selectedVault = savedVaultData[rowIndex];
        if (selectedVault && !isEditable) {
            setVaultDNS(selectedVault?.vaultDNS?.trim());
            setUsername(selectedVault?.username?.trim());

            setFocusToPasswordInput();
        }
    };

    /**
     * Handles updates to the Saved Vaults table.
     * @param {String} newValue - new value of the field being updated
     * @param {Number} rowIndex - index of the updated row
     * @param {String} field - field within the row being updated
     */
    const handleSavedVaultEdits = (newValue, rowIndex, field) => {
        const rowIndexAsNumber = Number(rowIndex);

        const updatedSavedVaults = [...savedVaultData];
        updatedSavedVaults[rowIndexAsNumber] = { ...updatedSavedVaults[rowIndexAsNumber], [field]: newValue };

        // If we updated the default field, change the default value on all other rows to false
        if (field === DEFAULT) {
            updatedSavedVaults.map((row, index) => {
                if (row[DEFAULT] === true && index !== rowIndexAsNumber) {
                    row[DEFAULT] = false;
                }
                return row;
            });
        }

        setSavedVaultData(updatedSavedVaults);
    };

    /**
     * Updates the default row in the Saved Vaults table.
     * @param {Number} rowIndex - index of the updated row
     */
    const handleDefaultRowChanged = (rowIndex) => {
        // If this row is already selected, de-select it
        if (rowIndex === defaultVaultRowIndex) {
            setDefaultVaultRowIndex(-1);
            handleSavedVaultEdits(false, rowIndex, DEFAULT);
        } else {
            setDefaultVaultRowIndex(rowIndex);
            handleSavedVaultEdits(true, rowIndex, DEFAULT);
        }
    };

    /**
     * Adds a new editable row to the Saved Vaults table.
     */
    const addNewEditableRow = () => {
        const newEditableRow = {
            [VAULT_DNS]: '',
            [USERNAME]: '',
            [DEFAULT]: false
        };

        setSavedVaultData((prevSavedVaultData) => [...prevSavedVaultData, newEditableRow]);
    };

    /**
     * Removes a row from the Saved Vaults table.
     * @param {Number} rowToRemove - index of the row to remove
     */
    const removeRow = (rowToRemove) => {
        setSavedVaultData(savedVaultData.filter((_, savedVaultRowIndex) => savedVaultRowIndex !== rowToRemove));
    };

    /**
     * Set focus to first Editable component in a new row.
     */
    const focusOnNewRow = () => {
        if (newEditableRowRef.current) {
            newEditableRowRef.current.focus();
        }
    };

    /**
     * Update default vault row index whenever savedVaultData is updated (to display checkbox buttons correctly)
     */
    useEffect(() => {
        setDefaultVaultRowIndex(savedVaultData?.findIndex((row) => row[DEFAULT] === true));
    }, [savedVaultData]);


    return {
        defaultVaultRowIndex,
        newEditableRowRef,
        handleRowClick,
        handleSavedVaultEdits,
        handleDefaultRowChanged,
        addNewEditableRow,
        removeRow,
        focusOnNewRow
    }
}