import { getAuthorizationHeader } from '../ApiService.js';
import { getAPIEndpoint, HTTP_CONTENT_TYPE_JSON, HTTP_CONTENT_TYPE_PLAINTEXT, HTTP_HEADER_ACCEPT, HTTP_HEADER_CONTENT_TYPE, request, RequestMethod } from './VaultRequest.js';

const URL_MDL_COMPONENT_RECORD = '/mdl/components/{SELECTED_COMPONENT}';
const URL_MDL_EXECUTE = '/mdl/execute';
const URL_MDL_EXECUTE_ASYNC = '/mdl/execute_async'
const URL_MDL_EXECUTE_ASYNC_JOB_STATUS = '/mdl/execute_async/{job_id}/results';
const URL_OBJECTS = '/metadata/vobjects';
const URL_OBJECT_NAME = '/metadata/vobjects/{OBJECT_NAME}';
const URL_COMPONENTS = '/metadata/components';

/**
 * Retrieve Component Record MDL
 * @param {String} selectedComponent - the Component Type and Record Name (e.g. Object.product__v)
 * @returns MdlResponse, ResponseHeaders
 */
export async function retrieveComponentRecordMdl(selectedComponent) {
    const url = getAPIEndpoint(URL_MDL_COMPONENT_RECORD.replace('{SELECTED_COMPONENT}', selectedComponent), false);

    const headers = getAuthorizationHeader();
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method
    };

    const retrieveComponentRecordMdlResponse = await request(url, requestOptions);
    const responseHeaders = retrieveComponentRecordMdlResponse?.headers;
    const responseStatus = retrieveComponentRecordMdlResponse?.status;

    let response = null;
    if (responseHeaders.get(HTTP_HEADER_CONTENT_TYPE)?.includes(HTTP_CONTENT_TYPE_PLAINTEXT)) {
        response = await retrieveComponentRecordMdlResponse.text();
    } else {
        response = await retrieveComponentRecordMdlResponse.json();
    }
    
    return { response, responseHeaders, responseStatus };
}

/**
 * This endpoint executes the given MDL script on a vault.
 * @param {String} mdlScript 
 * @returns VaultResponse, ResponseHeaders
 */
export async function executeMdlScript(mdlScript) {
    const url = getAPIEndpoint(URL_MDL_EXECUTE, false);

    const headers = getAuthorizationHeader();
    const method = RequestMethod.POST;

    const requestOptions = {
        headers,
        method,
        body: mdlScript
    };

    const executeMdlScriptResponse = await request(url, requestOptions);
    const responseHeaders = executeMdlScriptResponse?.headers;
    const responseStatus = executeMdlScriptResponse?.status;
    const response = await executeMdlScriptResponse.json();

    return { response, responseHeaders, responseStatus };
}

/**
 * This asynchronous endpoint executes the given MDL script on a vault.
 * @param {String} mdlScript 
 * @returns JobCreateResponse, ResponseHeaders
 */
export async function executeMdlScriptAsync(mdlScript) {
    const url = getAPIEndpoint(URL_MDL_EXECUTE_ASYNC, false);

    const headers = getAuthorizationHeader();
    const method = RequestMethod.POST;

    const requestOptions = {
        headers,
        method,
        body: mdlScript
    };

    const executeMdlScriptAsyncResponse = await request(url, requestOptions);
    const responseHeaders = executeMdlScriptAsyncResponse?.headers;
    const responseStatus = executeMdlScriptAsyncResponse?.status;
    const response = await executeMdlScriptAsyncResponse.json();

    return { response, responseHeaders, responseStatus };
}

/**
 * After submitting a request to deploy an MDL script asynchronously, you can query Vault to determine the results of the request.
 * @param {String} jobId 
 * @returns MdlResponse, ResponseHeaders
 */
export async function retrieveAsyncMdlScriptResults(jobId) {
    const url = getAPIEndpoint(URL_MDL_EXECUTE_ASYNC_JOB_STATUS.replace('{job_id}', jobId), false);

    const headers = getAuthorizationHeader();
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method,
    };

    const retrieveAsyncMdlScriptResultsResponse = await request(url, requestOptions);
    const responseHeaders = retrieveAsyncMdlScriptResultsResponse?.headers;
    const responseStatus = retrieveAsyncMdlScriptResultsResponse?.status;
    const response = await retrieveAsyncMdlScriptResultsResponse.json();

    return { response, responseHeaders, responseStatus };
}

/**
 * Retrieve Object Collection
 * @returns MetaDataObjectBulkResponse, ResponseHeaders
 */
export async function retrieveObjectCollection() {
    const url = getAPIEndpoint(URL_OBJECTS);

    const headers = getAuthorizationHeader();
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method,
    };

    const retrieveObjectCollectionResponse = await request(url, requestOptions);
    const responseHeaders = retrieveObjectCollectionResponse?.headers;
    const response = await retrieveObjectCollectionResponse.json();

    return { response, responseHeaders };
}

/**
 * Retrieve metadata of all component types in your Vault.
 * @returns MetaDataComponentTypeBulkResponse, ResponseHeaders
 */
export async function retrieveAllComponentMetadata() {
    const url = getAPIEndpoint(URL_COMPONENTS);

    const headers = getAuthorizationHeader();
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method
    };

    const retrieveAllComponentMetadataResponse = await request(url, requestOptions);
    const responseHeaders = retrieveAllComponentMetadataResponse?.headers;
    const response = await retrieveAllComponentMetadataResponse.json();

    return { response, responseHeaders };
}

/**
 * Retrieve all metadata configured on a standard or custom Vault Object.
 * @param {String} objectName - object to retrieve
 * @returns MetaDataObjectResponse, ResponseHeaders
 */
export async function retrieveObjectMetadata(objectName) {
    const url = getAPIEndpoint(URL_OBJECT_NAME.replace('{OBJECT_NAME}', objectName), true);

    const headers = {
        ...getAuthorizationHeader(),
        [HTTP_HEADER_ACCEPT]: [HTTP_CONTENT_TYPE_JSON]
    }
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method
    };

    const retrieveObjectMetadataResponse = await request(url, requestOptions);
    const responseHeaders = retrieveObjectMetadataResponse?.headers;
    const response = await retrieveObjectMetadataResponse.json();

    return { response, responseHeaders };
}