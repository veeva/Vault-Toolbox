const { DEVELOPER_TOOLBOX_LAMBDA_URL } = process.env;

import { getVaultApiVersion } from './SharedServices';
import {
    login as vapilLogin,
    retrieveApiVersions,
    sessionKeepAlive as vapilSessionKeepAlive
} from './vapil/AuthenticationRequest'
import { retrieveAllDocumentTypes as vapilRetrieveAllDocumentTypes } from './vapil/DocumentRequest';
import { retrieveDomainInformation as vapilRetrieveDomainInformation } from './vapil/DomainRequest';
import {
    createFolderOrFile as vapilCreateFolderOrFile,
    downloadItemContent as vapilDownloadItemContent,
    listItemsAtAPath as vapilListItemsAtAPath
} from './vapil/FileStagingRequest';
import {
    executeMdlScript as vapilExecuteMdlScript,
    executeMdlScriptAsync as vapilExecuteMdlScriptAsync,
    retrieveAllComponentMetadata as vapilRetrieveAllComponentMetadata,
    retrieveAsyncMdlScriptResults as vapilRetrieveAsyncMdlScriptResults,
    retrieveComponentRecordMdl as vapilRetrieveComponentRecordMdl,
    retrieveObjectCollection as vapilRetrieveObjectCollection,
    retrieveObjectMetadata as vapilRetrieveObjectMetadata
} from './vapil/MetaDataRequest'
import {
    retrievePicklistValues as vapilRetrievePicklistValues,
} from './vapil/PicklistRequest';
import { query as vapilQuery, queryByPage as vapilQueryByPage } from './vapil/QueryRequest';
import { getAPIEndpoint, HTTP_HEADER_AUTHORIZATION } from './vapil/VaultRequest';

export const VAULT_CLIENT_ID = 'veeva-vault-toolbox';

/**
 * Invokes the AWS Lambda function backend.
 * @param {Object} params 
 * @returns 
 */
export async function invokeAwsLambdaFunction(params) {
    try {
        // Add session and DNS to all requests
        params.sessionId = sessionStorage.getItem('sessionId');
        params.vaultDNS = sessionStorage.getItem('vaultDNS');

        const lambdaResponse = await fetch(DEVELOPER_TOOLBOX_LAMBDA_URL, {
            method: 'POST',
            body: JSON.stringify(params),
        });

        if (!lambdaResponse.ok) {
            throw new Error(`HTTP error invoking AWS Lambda: ${lambdaResponse.status}`)
        }

        return await lambdaResponse.json();
    } catch (error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Retrieve All Document Types endpoint.
 * @returns Vault Response
 */
export async function retrieveAllDocumentTypes() {
    try {
        const { response } = await vapilRetrieveAllDocumentTypes();
        return response;
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Retrieve All Document Types endpoint.
 * @returns Vault Response
 */
export async function retrieveDomainInformation() {
    try {
        const { response } = await vapilRetrieveDomainInformation();
        return response;
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Query endpoint.
 * @returns Vault Response
 */
export async function query(queryString) {
    try {
        const apiExecutionStartTime = performance.now();
        const { response, responseStatus } = await vapilQuery(queryString);
        const apiExecutionEndTime = performance.now();

        const responseTelemetry = getTelemetryData({
            response,
            responseStatus,
            apiExecutionStartTime,
            apiExecutionEndTime
        });

        return { queryResponse: response, responseTelemetry };
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Query By Page endpoint.
 * @returns Vault Response
 */
export async function queryByPage(pageUrl) {
    try {
        const apiExecutionStartTime = performance.now();
        const { response, responseStatus } = await vapilQueryByPage(pageUrl);
        const apiExecutionEndTime = performance.now();

        const responseTelemetry = getTelemetryData({
            response,
            responseStatus,
            apiExecutionStartTime,
            apiExecutionEndTime
        });

        return { queryResponse: response, responseTelemetry };
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's List Items At Path endpoint.
 * @returns Vault Response
 */
export async function listItemsAtAPath(path) {
    try {
        const { response } = await vapilListItemsAtAPath(path);
        return response;
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Download Item Content endpoint.
 * @returns Vault Response
 */
export async function downloadItemContent(path) {
    try {
        const { response } = await vapilDownloadItemContent(path);
        return response;
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Create Folder or File endpoint.
 * @returns Vault Response
 */
export async function createFolderOrFile(kind, path) {
    try {
        const { response } = await vapilCreateFolderOrFile(kind, path);
        return response;
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Retrieve Component Record MDL endpoint.
 * @returns Vault Response
 */
export async function retrieveComponentRecordMdl(selectedComponent) {
    try {
        const apiExecutionStartTime = performance.now();
        const { response, responseStatus } = await vapilRetrieveComponentRecordMdl(selectedComponent);
        const apiExecutionEndTime = performance.now();

        const responseTelemetry = getTelemetryData({
            response,
            responseStatus,
            apiExecutionStartTime,
            apiExecutionEndTime
        });

        return { response, responseTelemetry };
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Execute MDL Script endpoint.
 * @returns Vault Response
 */
export async function executeMdlScript(mdlScript) {
    try {
        const apiExecutionStartTime = performance.now();
        const { response, responseStatus } = await vapilExecuteMdlScript(mdlScript);
        const apiExecutionEndTime = performance.now();

        const responseTelemetry = getTelemetryData({
            response,
            responseStatus,
            apiExecutionStartTime,
            apiExecutionEndTime
        });

        return { response, responseTelemetry };
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Execute MDL Script Async endpoint.
 * @returns Vault Response
 */
export async function executeMdlScriptAsync(mdlScript) {
    try {
        const apiExecutionStartTime = performance.now();
        const { response, responseStatus } = await vapilExecuteMdlScriptAsync(mdlScript);
        const apiExecutionEndTime = performance.now();

        const responseTelemetry = getTelemetryData({
            response,
            responseStatus,
            apiExecutionStartTime,
            apiExecutionEndTime
        });

        return { response, responseTelemetry };
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Retrieve Async MDL Script Results endpoint.
 * @returns Vault Response
 */
export async function retrieveAsyncMdlScriptResults(jobId) {
    try {
        const apiExecutionStartTime = performance.now();
        const { response, responseStatus } = await vapilRetrieveAsyncMdlScriptResults(jobId);
        const apiExecutionEndTime = performance.now();

        const responseTelemetry = getTelemetryData({
            response,
            responseStatus,
            apiExecutionStartTime,
            apiExecutionEndTime
        });

        return { response, responseTelemetry };
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Retrieve Object Collection endpoint.
 * @returns Vault Response
 */
export async function retrieveObjectCollection() {
    try {
        const { response } = await vapilRetrieveObjectCollection();
        return response;
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Retrieve All Component Metadata endpoint.
 * @returns Vault Response
 */
export async function retrieveAllComponentMetadata() {
    try {
        const { response } = await vapilRetrieveAllComponentMetadata();
        return response;
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Retrieve Object Metadata endpoint.
 * @returns Vault Response
 */
export async function retrieveObjectMetadata(objectName) {
    try {
        const { response } = await vapilRetrieveObjectMetadata(objectName);
        return { response };
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Retrieve Picklist Values endpoint.
 * @returns Vault Response
 */
export async function retrievePicklistValues(picklistName) {
    try {
        const { response } = await vapilRetrievePicklistValues(picklistName);
        return { response };
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the Vault API's Session Keep Alive endpoint.
 * @returns Vault Response
 */
export async function sessionKeepAlive() {
    try {
        const { response } = vapilSessionKeepAlive();
        return response;
    } catch(error) {
        return handleErrors(error);
    }
}

/**
 * Calls the appropriate endpoints to log the user in, either via basic auth or session.
 * @returns Vault response
 */
export async function login(params) {
    if (params.vaultDNS) {
        if (params.sessionId) {
            try {
                let isValid = false;            
                const { response, responseHeaders } = await retrieveApiVersions(params.sessionId, params.vaultDNS);
            
                if (response?.responseStatus === 'SUCCESS') {
                    if (Object.keys(response?.values)?.length > 0) {
                        const responseUrl = response.values[getVaultApiVersion()];
                        isValid = responseUrl === getAPIEndpoint('', true, params.vaultDNS);

                        if (isValid) {
                            if (responseHeaders.get('x-vaultapi-vaultid')) {
                                sessionStorage.setItem('vaultId', responseHeaders.get('x-vaultapi-vaultid'));
                            }
            
                            if (responseHeaders.get('x-vaultapi-userid')) {
                                sessionStorage.setItem('userId', responseHeaders.get('x-vaultapi-userid'));
                            }
                            return response;
                        } else {
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
                    }
                }
            
                return response;
            } catch (error) {
                return handleErrors(error);
            }
        } else if (params.userName && params.password) {
            try {
                const { response, responseHeaders } = await vapilLogin(params.userName, params.password, params.vaultDNS);
                return response;
            } catch (error) {
                return handleErrors(error);
            }
        }
    }
}

/**
 * Retrieves Vault session ID from session storage
 * @returns Authorization header containing the validated session ID
 */
export const getAuthorizationHeader = () => {
    return {
        [HTTP_HEADER_AUTHORIZATION]: sessionStorage.getItem('sessionId'),
    }
}

/**
 * Retrieves Vault DNS from session storage
 * @returns Vault DNS string
 */
export const getVaultDNS = () => {
    const vaultDNS = sessionStorage.getItem('vaultDNS')
    if (vaultDNS) {
        return vaultDNS;
    }
    return null;
}

/**
 * Converts Javascript Error object into the Vault API response format 
 * which Vault Toolbox expects for errors.
 * @param {Object} error object
 * @returns 
 */
export function handleErrors(error) {

    const errorName = error?.name;
    let errorMessage = error?.message;
    if (error?.cause?.message) {
        errorMessage = errorMessage + ' : ' + error?.cause?.message;
    }

    const response = {
        'responseStatus': 'FAILURE',
        'errors': [
            {
                'type': errorName,
                'message': errorMessage
            }
        ]
    };

    return response;
}

/**
 * Calculates telemetry data for provided API response
 * @param response
 * @param responseStatus
 * @param apiExecutionStartTime
 * @param apiExecutionEndTime
 */
function getTelemetryData({ response, responseStatus, apiExecutionStartTime, apiExecutionEndTime }) {
    const responseSizeInKB = (new TextEncoder().encode(JSON.stringify(response)).length / 1024).toFixed(1);
    const executionTimeInMS = (apiExecutionEndTime - apiExecutionStartTime).toFixed(1);

    return {
        responseStatus,
        responseSizeInKB,
        executionTimeInMS
    };
}