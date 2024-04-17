
/**
 * Determines if user is logged into a Production Vault
 * @returns true if logged into a Production Vault, otherwise false
 */
export function isProductionVault() {
    const domainType = sessionStorage.getItem('domainType');
    if (domainType && domainType === 'Production'){
        return true;
    }
    return false;
}

/**
 * Retrieves Vault ID from session storage
 * @returns Vault ID
 */
export function getVaultId() {
    return sessionStorage.getItem('vaultId');
}