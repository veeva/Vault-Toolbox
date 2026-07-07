import { logApiCall } from '../../utils/api-history/ApiHistoryHelper';
import { VAULT_CLIENT_ID, getVaultDNS } from '../ApiService.js';
import { getVaultApiVersion, getCustomApiHeadersFromStorage, isDevBuild } from '../SharedServices';

export const VAULT_API_VERSION = 'v26.1';
export const VAULT_DEVELOPER_TOOLBOX_VERSION = 'v26.1.2';

export const HTTP_HEADER_CONTENT_TYPE = 'Content-Type';
export const HTTP_HEADER_ACCEPT = 'Accept';
export const HTTP_HEADER_VAULT_CLIENT_ID = 'X-VaultAPI-ClientID';
export const HTTP_HEADER_REFERENCE_ID = 'X-VaultAPI-ReferenceId';
export const HTTP_HEADER_AUTHORIZATION = 'Authorization';
export const HTTP_HEADER_CONTENT_LENGTH = 'Content-Length';
export const HTTP_HEADER_CONTENT_MD5 = 'Content-MD5';
export const HTTP_HEADER_FILEPART_NUMBER = 'X-VaultAPI-FilePartNumber';

export const HTTP_CONTENT_TYPE_JSON = 'application/json';
export const HTTP_CONTENT_TYPE_XFORM = 'application/x-www-form-urlencoded';
export const HTTP_CONTENT_TYPE_PLAINTEXT = 'text/plain';
export const HTTP_CONTENT_TYPE_OCTET_STREAM = 'application/octet-stream';

/**
 * Request wrapper that sets default headers, omits cookies, and records the call to API history.
 * @param {String} url
 * @param {Object} options
 * @returns fetch response
 */
export async function request(url, options = {}) {
    const mergedRequestHeaders = {
        ...options.headers,
        ...getDefaultHeaders(),
    };

    return fetchAndLogToHistory(url, {
        ...options,
        headers: mergedRequestHeaders,
        credentials: 'omit', // Prevents sending Vault's cookies
    });
}

/**
 * Performs `fetch` and logs the call results to the in-session API history. Both successful responses
 * and thrown network errors are logged; the response body is read from a clone so the caller still
 * owns the original stream.
 * @param {String} url
 * @param {RequestInit} fetchOptions
 * @returns fetch response
 */
async function fetchAndLogToHistory(url, fetchOptions) {
    const requestStartTime = performance.now();
    const requestMethod = (fetchOptions.method ?? RequestMethod.GET).toString().toUpperCase();
    const requestHeaders = fetchOptions.headers ?? {};
    const requestBody = fetchOptions.body;

    try {
        const fetchResponse = await fetch(url, fetchOptions);

        // The response payload is only captured in dev builds; production builds never read or store it.
        if (isDevBuild()) {
            // Log asynchronously off a clone so the caller is not blocked while we read the body.
            fetchResponse
                .clone()
                .text()
                .then((responseBodyText) => {
                    logApiCall({
                        method: requestMethod,
                        url,
                        durationMs: performance.now() - requestStartTime,
                        requestHeaders,
                        requestBody,
                        responseStatus: fetchResponse.status,
                        responseHeaders: fetchResponse.headers,
                        responseBody: responseBodyText,
                    });
                });
        } else {
            logApiCall({
                method: requestMethod,
                url,
                durationMs: performance.now() - requestStartTime,
                requestHeaders,
                requestBody,
                responseStatus: fetchResponse.status,
                responseHeaders: fetchResponse.headers,
                responseBody: '',
            });
        }

        return fetchResponse;
    } catch (networkError) {
        logApiCall({
            method: requestMethod,
            url,
            durationMs: performance.now() - requestStartTime,
            requestHeaders,
            requestBody,
            responseStatus: null,
            responseHeaders: null,
            responseBody: String(networkError),
        });
        throw networkError;
    }
}

/**
 * Generates headers object containing the client ID and a reference ID with the current Toolbox version.
 * @returns headers object
 */
const getDefaultHeaders = () => {
    // Flatten the user-defined [{ key, value }] rows from session storage into a single headers object. Keys are trimmed
    // and whitespace-only keys are skipped.
    const customHeaders = getCustomApiHeadersFromStorage().reduce((acc, { key, value }) => {
        if (key.trim()) acc[key.trim()] = value;
        return acc;
    }, {});

    return {
        [HTTP_HEADER_VAULT_CLIENT_ID]: VAULT_CLIENT_ID,
        [HTTP_HEADER_REFERENCE_ID]: VAULT_DEVELOPER_TOOLBOX_VERSION,
        ...customHeaders,
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
        return `https://${vaultDNS}/api${endpoint}`;
    }
}

/**
 * Get a fully formed API URL consisting of the Vault DNS, API version, and the API endpoint
 */
export function getPaginationEndpoint(pageUrl) {
    const vaultDns = getVaultDNS();
    const vaultApiVersion = getVaultApiVersion();

    if (pageUrl.startsWith(`https://${vaultDns}`)) {
        return pageUrl;
    }

    if (pageUrl.startsWith(`/api/${vaultApiVersion}`)) {
        return `https://${vaultDns}${pageUrl}`;
    }

    if (pageUrl.startsWith('/api/')) {
        return getAPIEndpoint(pageUrl.slice(5), false);
    }

    return getAPIEndpoint(pageUrl);
}

export const RequestMethod = Object.freeze({
    GET: `GET`,
    POST: `POST`,
    PUT: `PUT`,
    DELETE: `DELETE`,
});
