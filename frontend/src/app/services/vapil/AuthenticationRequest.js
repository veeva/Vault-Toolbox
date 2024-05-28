import { getAuthorizationHeader } from '../ApiService.js';
import { getVaultApiVersion } from '../SharedServices';
import { HTTP_CONTENT_TYPE_XFORM, HTTP_HEADER_AUTHORIZATION, HTTP_HEADER_CONTENT_TYPE, RequestMethod, getAPIEndpoint, request } from './VaultRequest.js';

const URL_API = '';
const URL_AUTH = '/auth';
const URL_KEEP_ALIVE = '/keep-alive';

const USERNAME = 'username';
const PASSWORD = 'password';
const VAULT_DNS = 'vaultDNS';

/**
 * Retrieves api versions supported by the current Vault
 * @param {String} sessionId 
 * @param {String} vaultDNS 
 * @returns ApiVersionResponse, ResponseHeaders
 */
export async function retrieveApiVersions(sessionId, vaultDNS = null) {
    let url = null;
    if (vaultDNS) {
        url = `https://${vaultDNS}/api/`
    } else {
        url = getAPIEndpoint(URL_API, false);
    }

    const headers = sessionId ? {
        [HTTP_HEADER_AUTHORIZATION]: sessionId
    } : getAuthorizationHeader();
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method
    };

    const retrieveApiVersionsResponse = await request(url, requestOptions);
    const responseHeaders = retrieveApiVersionsResponse?.headers;
    const response = await retrieveApiVersionsResponse.json();

    return { response, responseHeaders };
}

/**
 * Authenticate via standard Vault user name and password in a specific Vault Domain.
 * @param {String} username 
 * @param {String} password 
 * @param {String} vaultDNS 
 * @returns AuthenticationResponse, ResponseHeaders
 */
export async function login(username, password, vaultDNS = null) {
    let url = null;
    if (vaultDNS) {
        url = `https://${vaultDNS}/api/${getVaultApiVersion()}${URL_AUTH}`
    } else {
        url = getAPIEndpoint(URL_AUTH);
    }


    const headers = {
        [HTTP_HEADER_CONTENT_TYPE]: [HTTP_CONTENT_TYPE_XFORM]
    };
    const method = RequestMethod.POST;

    const urlencoded = new URLSearchParams();
    urlencoded.append(USERNAME, username);
    urlencoded.append(PASSWORD, password);
    if (vaultDNS) {
        urlencoded.append(VAULT_DNS, vaultDNS);
    }

    const requestOptions = {
        headers,
        method,
        body: urlencoded
    };

    const loginResponse = await request(url, requestOptions);
    const responseHeaders = loginResponse?.headers;
    let response = await loginResponse.json();

    response = await validateLoginResponse(response, url);

    return { response, responseHeaders };
}

/**
 * Developers are now able to keep a Vault API Session alive with a light-weight endpoint that returns SUCCESS
 * when a valid Session Id is supplied. If an invalid Session Id is supplied, Vault returns INVALID_SESSION_ID.
 * Vault always enforces a 48-hour maximum session duration even when used with the Session Keep Alive.
 * @param {String} sessionId 
 * @returns VaultResponse, ResponseHeaders
 */
export async function sessionKeepAlive(sessionId) {
    const url = getAPIEndpoint(URL_KEEP_ALIVE);

    const headers = sessionId ? {
        [HTTP_HEADER_AUTHORIZATION]: sessionId
    } : getAuthorizationHeader();
    const method = RequestMethod.POST;

    const requestOptions = {
        headers,
        method
    };

    const sessionKeepAliveResponse = await request(url, requestOptions);
    const responseHeaders = sessionKeepAliveResponse?.headers;
    const response = await sessionKeepAliveResponse.json();

    return { response, responseHeaders };
}

async function validateLoginResponse(response, userSuppliedApiEndpoint = null) {
    if (response && response?.responseStatus === 'SUCCESS') {
        if (!userSuppliedApiEndpoint) {
            userSuppliedApiEndpoint = getAPIEndpoint('', true);
        }
        const authenticatedVaultId = response?.vaultId;
        let responseUrl = null;
        let validatedLoginResponse = false;

        response?.vaultIds?.forEach((vault) => {
            if (authenticatedVaultId === vault?.id) {
                responseUrl = vault?.url + '/' + getVaultApiVersion();
                if (userSuppliedApiEndpoint.startsWith(responseUrl)){
                    validatedLoginResponse = true;
                    return;
                }
            }
        });

        if (validatedLoginResponse) {
            return response;
        }

        return {
            'responseStatus': 'FAILURE',
            'errors': [
                {
                    'type': 'VaultDNS verification failed',
                    'message': `Response endpoint : ${responseUrl}`
                }
            ]
        };

    }
    return response;
}