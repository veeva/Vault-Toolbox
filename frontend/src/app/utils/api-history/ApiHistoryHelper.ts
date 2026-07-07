import { formatDateTime } from '../../services/SharedServices';

const API_HISTORY_STORAGE_KEY = 'vaultApiHistory';
const MAX_API_HISTORY_ENTRIES = 100;
const MISSING_VALUE_PLACEHOLDER = '—';

const RESPONSE_HEADERS_TO_DISPLAY: Array<{ label: string; storageKey: string }> = [
    { label: 'Status', storageKey: 'x-vaultapi-status' },
    { label: 'ExecutionID', storageKey: 'x-vaultapi-executionid' },
];

/**
 * Returns the API history list from session storage, or an empty array if absent.
 */
export function getApiHistory(): ApiHistoryEntry[] {
    const rawHistory: string | null = sessionStorage.getItem(API_HISTORY_STORAGE_KEY);
    if (!rawHistory) return [];

    try {
        const parsedHistory = JSON.parse(rawHistory);
        return Array.isArray(parsedHistory) ? parsedHistory : [];
    } catch {
        return [];
    }
}

/**
 * Logs a Vault API call to history in session storage by prepending a normalized entry to the existing history array.
 * Drops the oldest entry if the max entries has been met.
 */
export function logApiCall(callInput: LogApiCallInput): void {
    const newHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestampIso: new Date().toISOString(),
        method: callInput.method,
        url: callInput.url,
        durationMs: callInput.durationMs,
        requestHeaders: serializeRequestHeaders(callInput.requestHeaders),
        requestPayload: serializeRequestBody(callInput.requestBody),
        responseStatus: callInput.responseStatus,
        responseHeaders: callInput.responseHeaders ? serializeResponseHeaders(callInput.responseHeaders) : {},
        responseBody: callInput.responseBody,
    };
    const updatedHistoryEntries = [newHistoryEntry, ...getApiHistory()].slice(0, MAX_API_HISTORY_ENTRIES);

    writeApiHistoryToSessionStorage(updatedHistoryEntries);
}

/**
 * Writes the API history list to session storage. If writing the history list results in hitting the session storage
 * memory limit, drops the oldest entries until the list fits within the limit.
 */
function writeApiHistoryToSessionStorage(historyEntries: ApiHistoryEntry[]): void {
    let currentEntries: ApiHistoryEntry[] = historyEntries;
    while (currentEntries.length > 0) {
        try {
            sessionStorage.setItem(API_HISTORY_STORAGE_KEY, JSON.stringify(currentEntries));
            return;
        } catch {
            currentEntries = currentEntries.slice(0, currentEntries.length - 1);
        }
    }
}

/**
 * Normalizes a request-headers object to string values, omitting the authorization header.
 */
function serializeRequestHeaders(headersObject: Record<string, unknown>): Record<string, string> {
    const serializedHeaders: Record<string, string> = {};
    for (const [headerKey, headerValue] of Object.entries(headersObject)) {
        if (headerKey.toLowerCase() === 'authorization') continue;
        serializedHeaders[headerKey] = Array.isArray(headerValue) ? headerValue.join(', ') : String(headerValue);
    }
    return serializedHeaders;
}

/**
 * Converts a Headers instance into a plain key/value object.
 */
function serializeResponseHeaders(responseHeaders: Headers): Record<string, string> {
    const serializedHeaders: Record<string, string> = {};
    responseHeaders.forEach((headerValue, headerKey) => {
        serializedHeaders[headerKey] = headerValue;
    });
    return serializedHeaders;
}

/**
 * Serializes a request body of any supported type into a storable string.
 */
function serializeRequestBody(requestBody: unknown): string | null {
    if (requestBody == null) return null;
    if (typeof requestBody === 'string') return requestBody;
    if (requestBody instanceof URLSearchParams) return requestBody.toString();
    if (requestBody instanceof FormData) return serializeFormData(requestBody);
    if (requestBody instanceof Blob || requestBody instanceof ArrayBuffer) return '[Binary data]';
    return String(requestBody);
}

/**
 * Flattens FormData into a query-string-like representation, replacing files with a placeholder.
 */
function serializeFormData(formData: FormData): string {
    const formDataParts: string[] = [];
    formData.forEach((formEntryValue, formEntryKey) => {
        const valueRepresentation = typeof formEntryValue === 'string' ? formEntryValue : '[File]';
        formDataParts.push(`${formEntryKey}=${valueRepresentation}`);
    });
    return formDataParts.join('&');
}

/**
 * Converts a stored API history entry to the display-ready fields rendered in the API History table.
 */
export function buildDisplayedHistoryRow(
    historyEntry: ApiHistoryEntry,
    isExpanded: boolean,
): Omit<ApiHistoryRow, 'onToggle'> {
    return {
        id: historyEntry.id,
        formattedTime: formatDateTime(historyEntry.timestampIso),
        formattedDuration: formatDuration(historyEntry.durationMs),
        method: historyEntry.method,
        methodColorPalette: getMethodColorPalette(historyEntry.method),
        endpointPath: stripVaultDnsFromUrl(historyEntry.url),
        displayedResponseHeaders: RESPONSE_HEADERS_TO_DISPLAY.map(({ label, storageKey }) =>
            toDisplayedHeader(label, historyEntry.responseHeaders[storageKey]),
        ),
        displayedStatus: formatResponseStatus(historyEntry.responseStatus),
        statusColorPalette: getStatusColorPalette(historyEntry.responseStatus),
        isExpanded,
    };
}

/**
 * Formats a millisecond duration as `N ms` below one second and `N.NN s` above.
 */
function formatDuration(durationMs: number): string {
    if (durationMs < 1000) return `${Math.round(durationMs)} ms`;
    return `${(durationMs / 1000).toFixed(2)} s`;
}

/**
 * Formats a numeric response status for display, falling back to `ERR` when absent.
 */
function formatResponseStatus(responseStatus: number | null): string {
    return responseStatus != null ? String(responseStatus) : 'ERR';
}

/**
 * Strips the origin from a Vault URL, returning pathname plus query string.
 */
function stripVaultDnsFromUrl(fullUrl: string): string {
    try {
        const parsedUrl = new URL(fullUrl);
        return `${parsedUrl.pathname}${parsedUrl.search}`;
    } catch {
        return fullUrl;
    }
}

/**
 * Returns the Chakra color palette token for an HTTP method badge.
 */
function getMethodColorPalette(httpMethod: string): string {
    switch (httpMethod.toUpperCase()) {
        case 'GET':
            return 'blue';
        case 'POST':
            return 'green';
        case 'PUT':
            return 'orange';
        case 'PATCH':
            return 'purple';
        case 'DELETE':
            return 'red';
        default:
            return 'gray';
    }
}

/**
 * Returns the Chakra color palette token for an HTTP response status badge.
 */
function getStatusColorPalette(responseStatus: number | null): string {
    if (responseStatus == null) return 'gray';
    if (responseStatus >= 500) return 'red';
    if (responseStatus >= 400) return 'orange';
    if (responseStatus >= 300) return 'yellow';
    return 'green';
}

/**
 * Builds a payload descriptor object for the syntax-highlighted view, pretty-printing JSON when possible.
 */
export function buildPayload(rawPayload: string | null): ApiHistoryPayload {
    if (rawPayload == null || rawPayload === '') {
        return { rawText: '', language: 'plaintext', isEmpty: true };
    }

    const prettyPrintedJson = tryFormatAsJson(rawPayload);
    if (prettyPrintedJson != null) {
        return { rawText: prettyPrintedJson, language: 'json', isEmpty: false };
    }

    return { rawText: rawPayload, language: 'plaintext', isEmpty: false };
}

/**
 * Returns a pretty-printed version of the payload text if it parses as JSON, otherwise null.
 */
function tryFormatAsJson(rawPayload: string): string | null {
    const trimmedPayload = rawPayload.trim();
    if (!looksLikeJsonStructure(trimmedPayload)) return null;

    try {
        return JSON.stringify(JSON.parse(trimmedPayload), null, 2);
    } catch {
        return null;
    }
}

/**
 * Returns true when the text is bracketed like a JSON object or array.
 */
function looksLikeJsonStructure(trimmedPayload: string): boolean {
    const firstCharacter = trimmedPayload[0];
    const lastCharacter = trimmedPayload[trimmedPayload.length - 1];
    return (firstCharacter === '{' && lastCharacter === '}') || (firstCharacter === '[' && lastCharacter === ']');
}

/**
 * Returns header label/value pairs sorted alphabetically by label.
 */
export function buildSortedHeaderList(headersObject: Record<string, string>): ApiHistoryDisplayedHeader[] {
    return Object.entries(headersObject)
        .map(([headerName, headerValue]) => toDisplayedHeader(headerName, headerValue))
        .sort((firstHeader, secondHeader) => firstHeader.label.localeCompare(secondHeader.label));
}

/**
 * Pairs a label with a header value, substituting a placeholder when missing.
 */
function toDisplayedHeader(label: string, rawValue: string | undefined): ApiHistoryDisplayedHeader {
    return {
        label,
        value: rawValue ? rawValue : MISSING_VALUE_PLACEHOLDER,
    };
}

export interface ApiHistoryEntry {
    id: string;
    timestampIso: string;
    method: string;
    url: string;
    durationMs: number;
    requestHeaders: Record<string, string>;
    requestPayload: string | null;
    responseStatus: number | null;
    responseHeaders: Record<string, string>;
    responseBody: string;
}

export interface ApiHistoryDisplayedHeader {
    label: string;
    value: string;
}

export type ApiHistoryPayloadLanguage = 'json' | 'plaintext';

export interface ApiHistoryPayload {
    rawText: string;
    language: ApiHistoryPayloadLanguage;
    isEmpty: boolean;
}

export interface ApiHistoryExpandedDetails {
    requestPayload: ApiHistoryPayload;
    /** Null in production builds, where the response payload is neither captured nor displayed. */
    responsePayload: ApiHistoryPayload | null;
    allRequestHeaders: ApiHistoryDisplayedHeader[];
    allResponseHeaders: ApiHistoryDisplayedHeader[];
    /** Tab shown first when a row is expanded. */
    defaultTabValue: string;
}

export interface ApiHistoryRow {
    id: string;
    formattedTime: string;
    formattedDuration: string;
    method: string;
    methodColorPalette: string;
    endpointPath: string;
    displayedResponseHeaders: ApiHistoryDisplayedHeader[];
    displayedStatus: string;
    statusColorPalette: string;
    isExpanded: boolean;
    onToggle: () => void;
}

interface LogApiCallInput {
    method: string;
    url: string;
    durationMs: number;
    requestHeaders: Record<string, unknown>;
    requestBody: unknown;
    responseStatus: number | null;
    responseHeaders: Headers | null;
    responseBody: string;
}
