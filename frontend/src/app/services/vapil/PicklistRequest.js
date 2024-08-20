import { getAuthorizationHeader } from '../ApiService.js';
import { getAPIEndpoint, request, RequestMethod } from './VaultRequest.js';

const URL_PICKLIST_NAME = '/objects/picklists/{PICKLIST_NAME}';

/**
 * Retrieve Picklist Values
 * @param {String} picklistName - the picklist name (e.g. default_status__v)
 * @returns PicklistValueResponse
 */
export async function retrievePicklistValues(picklistName) {
    const url = getAPIEndpoint(URL_PICKLIST_NAME.replace('{PICKLIST_NAME}', picklistName));

    const headers = getAuthorizationHeader();
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method
    };

    const retrievePicklistValuesResponse = await request(url, requestOptions);
    const responseHeaders = retrievePicklistValuesResponse?.headers;
    const response = await retrievePicklistValuesResponse.json();

    return { response, responseHeaders };
}