import { VAULT_API_VERSION } from './vapil/VaultRequest';
import { retrieveJobStatus } from './ApiService';
import { CustomApiHeader } from '../hooks/shared/useCustomApiHeaders';

export const VAULT_SUBDOMAINS: string[] = ['veevavault.com', 'veevavault.cn', 'vaultdev.com', 'vaultpvm.com'];

/**
 * Determines if user is logged into a Production Vault (excluding DEV/PVM domains). Used to protect against
 * irreversible actions in Production Vaults (e.g. Delete Jobs, MDL changes).
 * @returns true if logged into a Production Vault (excluded DEV/PVM domains), otherwise false
 */
export function isProductionVault(): boolean {
    const domainType: string | null = sessionStorage.getItem('domainType');
    if (domainType && domainType === 'Production') {
        if (!isVaultDevOrPVMDomain()) {
            return true;
        }
    }
    return false;
}

/**
 * Determines if user is logged into a Sandbox Vault
 * @returns true if logged into a Sandbox Vault, otherwise false
 */
export function isSandboxVault(): boolean {
    const domainType: string | null = sessionStorage.getItem('domainType');
    if (domainType && domainType === 'Sandbox') {
        return true;
    }
    return false;
}

/**
 * Retrieves Vault DNS from session storage
 * @returns Vault DNS
 */
export function getVaultDns(): string | null {
    return sessionStorage.getItem('vaultDNS');
}

/**
 * Retrieves Vault ID from session storage
 * @returns Vault ID
 */
export function getVaultId(): string | null {
    return sessionStorage.getItem('vaultId');
}

/**
 * Retrieves Vault Name from session storage
 * @returns Vault Name
 */
export function getVaultName(): string | null {
    return sessionStorage.getItem('vaultName');
}

/**
 * Retrieves Vault Domain Type from session storage
 * @returns Vault Domain Type
 */
export function getVaultDomainType(): string | null {
    return sessionStorage.getItem('domainType');
}

/**
 * Retrieves Vault Username from session storage
 * @returns Vault Username
 */
export function getVaultUsername(): string | null {
    return sessionStorage.getItem('userName');
}

/**
 * Retrieves the current Vault API version, either the manually updated version from session storage or the default
 * @returns Vault API version
 */
export function getVaultApiVersion(): string {
    const currentApiVersion: string | null = sessionStorage.getItem('vaultApiVersion');
    if (currentApiVersion) {
        return currentApiVersion;
    } else {
        return VAULT_API_VERSION;
    }
}

/**
 * Whether this is a development build (`npm run dev`) rather than a production build (`npm run build`).
 * Backed by the IS_DEV_BUILD flag injected per build config via webpack's DefinePlugin.
 */
export function isDevBuild(): boolean {
    return process.env.IS_DEV_BUILD === 'true';
}

/**
 * Retrieves the value of vaultCustomApiHeaders from session storage
 */
export function getCustomApiHeadersFromStorage(): CustomApiHeader[] {
    const storedValue = sessionStorage.getItem('vaultCustomApiHeaders');

    // If value not found in sessionStorage, default to an empty array
    if (!storedValue) return [];

    try {
        return JSON.parse(storedValue);
    } catch {
        return [];
    }
}

/**
 * Determines if Vault is on DEV/PVM domain
 * @returns {boolean}
 */
function isVaultDevOrPVMDomain(): boolean {
    const vaultDNS: string | null = sessionStorage.getItem('vaultDNS');
    const domains: string[] = ['vaultdev.com', 'vaultpvm.com'];

    return domains.some((domain) => vaultDNS?.includes(domain));
}

/**
 * Formats a date/time string to a user-friendly format
 * @param {String} utcDateTimeString - Date/time string in UTC format
 * @returns String value of formatted date/time
 */
export function formatDateTime(utcDateTimeString: string): string {
    const utcDateTimeObj = new Date(utcDateTimeString);

    const formatter = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short',
    });

    // Break the DateTime into structured parts
    const parts = formatter.formatToParts(utcDateTimeObj);

    // Extract relevant parts dynamically and return in our desired format
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    const hour = parts.find((p) => p.type === 'hour')?.value;
    const minute = parts.find((p) => p.type === 'minute')?.value;
    const second = parts.find((p) => p.type === 'second')?.value;
    const timeZoneName = parts.find((p) => p.type === 'timeZoneName')?.value;

    return `${year}-${month}-${day} ${hour}:${minute}:${second} ${timeZoneName}`;
}

/**
 * Formats a number of bytes to a user-friendly format
 * @param {Number} bytes - Number of bytes
 * @returns String value of formatted bytes
 */
export function formatBytesToUserFriendlyFormat(bytes: number) {
    if (bytes < 1024) {
        return `${bytes.toLocaleString()} B`; // Less than 1 KB
    } else if (bytes < 1024 * 1024) {
        const kb = (bytes / 1024).toFixed(1); // Convert to KB with 1 decimal place
        return `${kb.toLocaleString()} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
        const mb = (bytes / (1024 * 1024)).toFixed(1); // Convert to MB with 1 decimal place
        return `${mb.toLocaleString()} MB`;
    } else {
        const gb = (bytes / (1024 * 1024 * 1024)).toFixed(1); // Convert to GB with 1 decimal place
        return `${gb.toLocaleString()} GB`;
    }
}

export interface ReactSelectOption {
    value: any;
    label: string;
}

/**
 * Converts an array of values to an array of options in the format supported by React-Select components.
 * E.g. ['='] becomes [{ value: '=', label: '=' }]
 * @param array - array of values
 */
export const convertArrayToSelectOptions = (array: any[]): ReactSelectOption[] => {
    return array.map((item: any) => ({
        value: item,
        label: item,
    }));
};

/**
 * Polls a job's status until it is complete or times out.
 * @param {string} jobId The ID of the job to poll.
 * @returns {Promise<object>} A promise that resolves to the final job status response.
 */
export async function pollJobStatus(jobId: string): Promise<object> {
    let jobStatusResponse;

    do {
        jobStatusResponse = await retrieveJobStatus(jobId);

        if (
            jobStatusResponse.responseStatus === 'SUCCESS' &&
            ['QUEUED', 'RUNNING'].includes(jobStatusResponse.data.status)
        ) {
            await new Promise((resolve) => setTimeout(resolve, 10000));
        }
    } while (['QUEUED', 'RUNNING'].includes(jobStatusResponse.data.status));

    // Return the final status response
    return jobStatusResponse;
}

/**
 * Breaks a file into an array of smaller chunks (Blobs).
 * @param {File} file The file to be chunked.
 * @returns {Blob[]} An array of Blob objects.
 */
export const chunkFile = (file: File): Blob[] => {
    const CHUNK_SIZE = 50 * 1024 * 1024;
    const chunks: Blob[] = [];

    let offset = 0;
    while (offset < file.size) {
        const end = Math.min(offset + CHUNK_SIZE, file.size);

        chunks.push(file.slice(offset, end));
        offset = end;
    }

    return chunks;
};
