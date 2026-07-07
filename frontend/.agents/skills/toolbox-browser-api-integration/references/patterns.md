# Vault API Integration: Patterns & Templates

## VAPIL Request Template (`src/app/services/vapil/*.js`)

When creating a new VAPIL service file, follow this structure:

```javascript
import { getAuthorizationHeader } from '../ApiService.js';
import {
    getAPIEndpoint,
    HTTP_CONTENT_TYPE_JSON,
    HTTP_HEADER_CONTENT_TYPE,
    request,
    RequestMethod,
} from './VaultRequest.js';

const URL_ENDPOINT = '/your/endpoint';

/**
 * Describe what this API call does.
 * @param {Object} params
 * @returns {Promise<{response, responseHeaders, responseStatus}>}
 */
export async function yourApiCall(params) {
    const url = getAPIEndpoint(URL_ENDPOINT);
    const authorizationHeader = await getAuthorizationHeader();

    const headers = {
        ...authorizationHeader,
        [HTTP_HEADER_CONTENT_TYPE]: HTTP_CONTENT_TYPE_JSON,
    };

    const requestOptions = {
        headers,
        method: RequestMethod.POST, // or GET/PUT/DELETE
        body: JSON.stringify(params),
    };

    const fetchResponse = await request(url, requestOptions);
    const responseHeaders = fetchResponse?.headers;
    const responseStatus = fetchResponse?.status;
    const response = await fetchResponse.json();

    return { response, responseHeaders, responseStatus };
}
```

## ApiService Facade Template (`src/app/services/ApiService.js`)

When exposing the VAPIL call to the application, use this template:

```javascript
import { yourApiCall as vapilYourApiCall } from './vapil/YourRequest';

/**
 * Public facade method for the Your API endpoint.
 * @param {Object} params
 * @returns {Promise<VaultResponse>}
 */
export async function yourApiCall(params) {
    try {
        const apiExecutionStartTime = performance.now();
        const { response, responseStatus, responseHeaders } = await vapilYourApiCall(params);
        const apiExecutionEndTime = performance.now();

        // Optional: Include telemetry for performance-critical calls
        const responseTelemetry = getTelemetryData({
            response,
            responseStatus,
            apiExecutionStartTime,
            apiExecutionEndTime,
        });

        return { response, responseTelemetry, responseHeaders };
    } catch (error) {
        return { response: handleErrors(error) };
    }
}
```
