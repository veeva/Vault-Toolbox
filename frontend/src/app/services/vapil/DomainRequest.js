import { getAuthorizationHeader } from '../ApiService.js';
import { getAPIEndpoint, request, RequestMethod } from './VaultRequest.js';

const URL_DOMAIN = '/objects/domain';

/**
 * Domain Admins can use this request to retrieve a list of all vaults currently in their domain.
 * @returns DomainResponse, ResponseHeaders
 */
export async function retrieveDomainInformation() {
    const url = getAPIEndpoint(URL_DOMAIN);

    const headers = getAuthorizationHeader();
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method
    }

    const domainInformationResponse = await request(url, requestOptions);
    const responseHeaders = domainInformationResponse?.headers;
    const response = await domainInformationResponse.json();
    
    return { response, responseHeaders };
}