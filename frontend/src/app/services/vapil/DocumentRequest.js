import { getAuthorizationHeader } from '../ApiService.js';
import { getAPIEndpoint, request, RequestMethod } from './VaultRequest.js';

const URL_DOC_TYPES = '/metadata/objects/documents/types';

/**
* Retrieve all document types. These are the top-level of the document
 * type/subtype/classification hierarchy.
 * @returns DocumentTypesResponse, ResponseHeaders
 */
export async function retrieveAllDocumentTypes() {
    const url = getAPIEndpoint(URL_DOC_TYPES);

    const headers = getAuthorizationHeader();
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method
    };

    const retrieveAllDocumentTypesResponse = await request(url, requestOptions);
    const responseHeaders = retrieveAllDocumentTypesResponse?.headers;
    const response = await retrieveAllDocumentTypesResponse.json();

    return { response, responseHeaders };
}