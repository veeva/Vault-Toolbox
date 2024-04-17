import { useState } from 'react';

export default function useSavedVaultsPopover({ savedVaultData, setSavedVaultData, onClose }) {
    const [isEditable, setIsEditable] = useState(false);

    const SAVED_VAULTS = 'savedVaults';

    /**
     *  Toggles edit mode. Saves changes when toggling out of edit-mode (since that means user clicked save).
     */
    const toggleEditMode = () => {
        // If it was editable, save the changes
        if (isEditable) {
            chrome.storage.local.set({ [SAVED_VAULTS]: savedVaultData });
        }

        setIsEditable(!isEditable);
    };

    /**
     * Handles closing popover. Discards unsaved changes.
     */
    const handlePopoverClosed = () => {
        // If closed without saving, discard changes
        if (isEditable) {
            setIsEditable(false);
            chrome.storage.local.get([SAVED_VAULTS]).then((result) => {
                setSavedVaultData(result[SAVED_VAULTS] ? result[SAVED_VAULTS] : []);
            });
        }
        onClose();
    };

    return { isEditable, toggleEditMode, handlePopoverClosed }
}