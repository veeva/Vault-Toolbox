import { getAuthorizationHeader, getVaultDNS } from '../ApiService.js';
import { getAPIEndpoint, HTTP_CONTENT_TYPE_JSON, HTTP_CONTENT_TYPE_XFORM, HTTP_HEADER_ACCEPT, HTTP_HEADER_CONTENT_TYPE, request, RequestMethod, VAULT_API_VERSION } from './VaultRequest.js';

const URL_QUERY = '/query';

const HTTP_HEADER_VAULT_DESCRIBE_QUERY = 'X-VaultAPI-DescribeQuery';

/**
 * Perform a Vault query request. Subsequent queries and pagination
 * are needed to retrieve the full result set if the total records returned exceed the "pagesize"
 * parameter in the response.
 * @param {String} query 
 * @returns QueryResponse, ResponseHeaders
 */
export async function query(query) {
    const url = getAPIEndpoint(URL_QUERY);

    const headers = {
        ...getAuthorizationHeader(),
        [HTTP_HEADER_CONTENT_TYPE]: [HTTP_CONTENT_TYPE_XFORM],
        [HTTP_HEADER_VAULT_DESCRIBE_QUERY]: true
    };
    const method = RequestMethod.POST;
    const urlencoded = new URLSearchParams();
    urlencoded.append('q', query);

    const requestOptions = {
        headers,
        method,
        body: urlencoded
    }

    const queryResponse = await request(url, requestOptions);
    const responseHeaders = queryResponse?.headers;
    const response = await queryResponse.json();

    return { response, responseHeaders };
}

/**
 * Perform a paginated query based on the URL from a previous query (previous_page or next_page in the response details).
 * @param {String} pageUrl 
 * @returns QueryResponse, ResponseHeaders
 */
export async function queryByPage(pageUrl) {

    const url = getPaginationEndpoint(pageUrl);

    const headers = {
        ...getAuthorizationHeader(),
        [HTTP_HEADER_ACCEPT]: [HTTP_CONTENT_TYPE_JSON],
        [HTTP_HEADER_CONTENT_TYPE]: [HTTP_CONTENT_TYPE_XFORM],
        [HTTP_HEADER_VAULT_DESCRIBE_QUERY]: true
    };
    const method = RequestMethod.POST;

    const requestOptions = {
        headers,
        method
    };

    const queryResponse = await request(url, requestOptions);
    const responseHeaders = queryResponse?.headers;
    const response = await queryResponse.json();

    return { response, responseHeaders };
}

/**
 * Gets a fully formed API URL consisting of the Vault DNS, API version, and the API endpoint.
 *
 * @param {string} pageUrl The URL from the previous_page or next_page parameter
 * @return {string} URL for the next_page/prev_page endpoint
 */
function getPaginationEndpoint(pageUrl) {
    const vaultDNS = getVaultDNS();

    if (pageUrl.startsWith('https://' + vaultDNS))
    return pageUrl;

    if (pageUrl.startsWith('/api/' + VAULT_API_VERSION))
        return getAPIEndpoint(pageUrl.substring(VAULT_API_VERSION.length + 5), true);

    if (pageUrl.startsWith('/api/'))
        return getAPIEndpoint(pageUrl.substring(5), false);

    return getAPIEndpoint(pageUrl, true);
}