import { getAuthorizationHeader } from '../ApiService.js';
import {
    getAPIEndpoint,
    request,
    RequestMethod,
    HTTP_HEADER_CONTENT_TYPE,
    HTTP_CONTENT_TYPE_OCTET_STREAM,
} from './VaultRequest.js';

const URL_WORKFLOW_ACTIVITY_LOG = '/logs/workflow/{DATE}/file';

interface DownloadWorkflowActivityLogResult {
    response: Blob | Record<string, unknown>;
    responseHeaders?: Headers;
    responseStatus?: number;
}

/**
 * Download Workflow Activity Log
 * @param date - Date in YYYY-MM-DD format
 * @returns VaultResponse, ResponseHeaders, ResponseStatus
 */
export async function downloadWorkflowActivityLog(date: string): Promise<DownloadWorkflowActivityLogResult> {
    const url = getAPIEndpoint(URL_WORKFLOW_ACTIVITY_LOG.replace('{DATE}', date));

    const headers = await getAuthorizationHeader();
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method,
    };

    const downloadWorkflowActivityLogResponse = await request(url, requestOptions);
    const responseHeaders = downloadWorkflowActivityLogResponse?.headers;
    const responseStatus = downloadWorkflowActivityLogResponse?.status;

    let response: Blob | Record<string, unknown>;
    if (responseHeaders?.get(HTTP_HEADER_CONTENT_TYPE)?.startsWith(HTTP_CONTENT_TYPE_OCTET_STREAM)) {
        response = await downloadWorkflowActivityLogResponse.blob();
    } else {
        response = await downloadWorkflowActivityLogResponse.json();
    }

    return { response, responseHeaders, responseStatus };
}
