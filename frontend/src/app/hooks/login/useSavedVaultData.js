import { useState, useEffect, useRef } from 'react';

export default function useSavedVaultData({ setUserName, setVaultDNS, setFocusToPasswordInput, setFocusToUsernameInput }) {
    const [savedVaultData, setSavedVaultData] = useState([]);
    const savedVaultDataRef = useRef(savedVaultData);

    const SAVED_VAULTS = 'savedVaults';
    const DEFAULT = 'default';
    const VAULT_DNS = 'vaultDNS';
    const USERNAME = 'username';
    const VAULT_SUBDOMAINS = [
        'veevavault.com',
        'veevavault.cn',
        'vaultdev.com',
        'vaultpvm.com'
    ]

     /**
     * Loads the Saved Vaults table from Chrome storage into state.
     * If a default is set, loads those values into input fields.
     */
     const loadSavedVaults = async () => {
        await chrome.storage.local.get(SAVED_VAULTS).then((result) => {
            setSavedVaultData(result[SAVED_VAULTS] ? result[SAVED_VAULTS] : []);

            if (result[SAVED_VAULTS]) {
                const savedVaults = result[SAVED_VAULTS];
                const defaultVaultIndex = savedVaults.findIndex((row) => row[DEFAULT] === true);

                // If a default Vault is set, load those fields into the input form
                if (defaultVaultIndex !== -1) {
                    setVaultDNS(savedVaults[defaultVaultIndex][VAULT_DNS].trim());
                    setUserName(savedVaults[defaultVaultIndex][USERNAME].trim());

                    setFocusToPasswordInput();
                }
            }
        });
    };

    /**
     * Handler for loading Saved Vaults. Also loads defaults when launching from a Vault.
     */
    const setDefaultsOnLoad = async () => {
        // Load saved Vaults from storage
        await loadSavedVaults();

        // If launched from a Vault, load that DNS instead of default
        chrome.runtime.sendMessage({ action: 'getOriginatingUrl' }, (response) => {
            if (response && response.originatingUrl) {
                if (VAULT_SUBDOMAINS.some(subdomain => response.originatingUrl.includes(subdomain))) {
                    const parsedURL = new URL(response.originatingUrl);
                    setVaultDNS(parsedURL.hostname.trim());

                    if (savedVaultDataRef.current.length > 0) {
                        const vaultIndex = savedVaultDataRef.current.findIndex((row) => row[VAULT_DNS] === parsedURL.hostname);

                        // If the originating Vault is in the saved Vault table, load its username
                        if (vaultIndex !== -1) {
                            setUserName(savedVaultDataRef.current[vaultIndex][USERNAME]?.trim());
                            setFocusToPasswordInput();
                        } else {
                            setUserName('');
                            setFocusToUsernameInput();
                        }
                    }
                }
            }
        });
    };

    useEffect(() => {
        savedVaultDataRef.current = savedVaultData;
    }, [savedVaultData]);

    /**
     * Retrieve Saved Vaults defaults on page load.
     */
    useEffect(() => {
        setDefaultsOnLoad();
    }, []);

    return { savedVaultData, setSavedVaultData }
}