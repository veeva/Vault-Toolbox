import { VAULT_CLIENT_ID, getVaultDNS } from '../ApiService.js';
import { getVaultApiVersion } from '../SharedServices';

export const VAULT_API_VERSION = 'v24.2';
export const VAULT_DEVELOPER_TOOLBOX_VERSION = 'v24.2.0';

export const HTTP_HEADER_CONTENT_TYPE = 'Content-Type';
export const HTTP_HEADER_ACCEPT = 'Accept';
export const HTTP_HEADER_VAULT_CLIENT_ID = 'X-VaultAPI-ClientID';
export const HTTP_HEADER_REFERENCE_ID = 'X-VaultAPI-ReferenceId';
export const HTTP_HEADER_AUTHORIZATION = 'Authorization';

export const HTTP_CONTENT_TYPE_JSON = 'application/json';
export const HTTP_CONTENT_TYPE_XFORM = 'application/x-www-form-urlencoded';
export const HTTP_CONTENT_TYPE_PLAINTEXT = 'text/plain'

/**
 * Request wrapper that sets default headers and omits cookies.
 * @param {String} url 
 * @param {Object} options 
 * @returns fetch response
 */
export async function request(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            ...getDefaultHeaders(),
        },
        credentials: 'omit' // Prevents sending Vault's cookies
    });
}

/**
 * Generates headers object containing the client ID and a reference ID with the current Toolbox version.
 * @returns headers object
 */
const getDefaultHeaders = () => {
    return {
        [HTTP_HEADER_VAULT_CLIENT_ID]: VAULT_CLIENT_ID,
        [HTTP_HEADER_REFERENCE_ID]: VAULT_DEVELOPER_TOOLBOX_VERSION
    };
};

/**
 * Get a fully-formed API URL consisting of the Vault DNS, API version, and API endpoint
 */
export function getAPIEndpoint(endpoint, includeVersion = true, vaultDNS = null) {
    if (!vaultDNS) {
        vaultDNS = getVaultDNS();
    }

    if (includeVersion) {
        return `https://${vaultDNS}/api/${getVaultApiVersion()}${endpoint}`;
    } else {
        return `https://${vaultDNS}/api/${endpoint}`;
    }
}

export const RequestMethod = Object.freeze({
    GET: `GET`,
    POST: `POST`,
    PUT: `PUT`,
    DELETE: `DELETE`,
});