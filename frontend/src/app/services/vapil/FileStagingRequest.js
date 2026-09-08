import { getAuthorizationHeader } from '../ApiService.js';
import {
    getAPIEndpoint,
    getPaginationEndpoint,
    HTTP_CONTENT_TYPE_JSON,
    HTTP_CONTENT_TYPE_OCTET_STREAM,
    HTTP_HEADER_ACCEPT,
    HTTP_HEADER_CONTENT_LENGTH,
    HTTP_HEADER_CONTENT_MD5,
    HTTP_HEADER_CONTENT_TYPE,
    HTTP_HEADER_FILEPART_NUMBER,
    request,
    RequestMethod,
} from './VaultRequest.js';

const URL_FILE_STAGING_LIST_ITEMS_IN_PATH = '/services/file_staging/items/';
const URL_FILE_STAGING_GET_ITEM_CONTENT = '/services/file_staging/items/content/';
const URL_FILE_STAGING_CREATE_FILE_OR_FOLDER = '/services/file_staging/items';
const URL_FILE_STAGING_DELETE_FILE_OR_FOLDER = '/services/file_staging/items{ITEM}';
const URL_FILE_STAGING_CREATE_RESUMABLE_UPLOAD_SESSION = '/services/file_staging/upload';
const URL_FILE_STAGING_HANDLE_UPLOAD_SESSION = '/services/file_staging/upload/{UPLOAD_SESSION_ID}';

/**
 * Return a list of files and folders for the specified path.
 * Paths are different for Admin users (Vault Owners and System Admins) and non-Admin users.
 * @param {String} item - the file path of the item
 * @param {Boolean} recursive - If true, the response will contain the contents of all subfolders. If not specified, the default value is false.
 * @returns FileStagingItemBulkResponse, ResponseHeaders
 */
export async function listItemsAtAPath(item, recursive = false) {
    let url = getAPIEndpoint(`${URL_FILE_STAGING_LIST_ITEMS_IN_PATH}${item}`);

    if (recursive) {
        url += `?recursive=${recursive}`;
    }

    const headers = await getAuthorizationHeader();
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method,
    };

    const listItemsAtAPathResponse = await request(url, requestOptions);
    const responseHeaders = listItemsAtAPathResponse?.headers;
    const response = await listItemsAtAPathResponse.json();

    return { response, responseHeaders };
}

/**
 * Return a list of files and folders for the specified page url.
 * Paths are different for Admin users (Vault Owners and System Admins) and non-Admin users.
 * @param {String} pageUrl - full path to the page (including https://{vaultDNS}/api/{version}/)
 * @returns FileStagingItemBulkResponse, ResponseHeaders
 */
export async function listItemsAtAPathByPage(pageUrl) {
    let url = getPaginationEndpoint(pageUrl);

    const headers = await getAuthorizationHeader();
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method,
    };

    const listItemsAtAPathByPageResponse = await request(url, requestOptions);
    const responseHeaders = listItemsAtAPathByPageResponse?.headers;
    const response = await listItemsAtAPathByPageResponse.json();

    return { response, responseHeaders };
}

/**
 * Retrieve the content of a specified file from the file staging server.
 * Use the Range header to create resumable downloads for large files, or to continue downloading a file if your session is interrupted.
 * @param {String} item - the file path of the item
 * @returns VaultResponse, ResponseHeaders
 */
export async function downloadItemContent(item) {
    const url = getAPIEndpoint(`${URL_FILE_STAGING_GET_ITEM_CONTENT}${item}`);

    const headers = await getAuthorizationHeader();
    const method = RequestMethod.GET;

    const requestOptions = {
        headers,
        method,
    };

    const downloadItemContentResponse = await request(url, requestOptions);
    const responseHeaders = downloadItemContentResponse?.headers;

    let response;
    if (responseHeaders.get(HTTP_HEADER_CONTENT_TYPE).startsWith('application/octet-stream')) {
        response = await downloadItemContentResponse.blob();
    } else {
        response = await downloadItemContentResponse.json();
    }

    return { response, responseHeaders };
}

/**
 * Upload files or folders up to 50MB to the File Staging Server.
 * @param {String} kind - the type of the item, either FILE or FOLDER
 * @param {String} path - path of the item
 * @param {File} file - file object when kind is FILE
 * @param {Boolean} overwrite - when kind is FILE, whether to overwrite an existing file with the same name. Defaults to false.
 * @returns - FileStagingItemResponse, ResponseHeaders
 */
export async function createFolderOrFile(kind, path, file = null, overwrite = false) {
    const url = getAPIEndpoint(URL_FILE_STAGING_CREATE_FILE_OR_FOLDER);
    const authorizationHeader = await getAuthorizationHeader();

    const headers = {
        ...authorizationHeader,
        [HTTP_HEADER_ACCEPT]: [HTTP_CONTENT_TYPE_JSON],
    };
    const method = RequestMethod.POST;

    const formdata = new FormData();
    formdata.append('kind', kind);
    formdata.append('path', path);

    if (file !== null) {
        formdata.append('file', file);
    }

    if (overwrite && kind === 'FILE') {
        formdata.append('overwrite', overwrite);
    }

    const requestOptions = {
        headers,
        method,
        body: formdata,
    };

    const createFolderOrFileResponse = await request(url, requestOptions);
    const responseHeaders = createFolderOrFileResponse?.headers;
    const response = await createFolderOrFileResponse.json();

    return { response, responseHeaders };
}

/**
 * Delete an individual file or folder from the File Staging Server.
 * @param {String} path - path of the item
 * @param {Boolean} recursive - for folders, whether to delete the contents of the folder and all subfolders
 * @returns - FileStagingItemResponse, ResponseHeaders
 */
export async function deleteFolderOrFile(path, recursive = true) {
    let url = getAPIEndpoint(URL_FILE_STAGING_DELETE_FILE_OR_FOLDER.replace('{ITEM}', path), true);
    const authorizationHeader = await getAuthorizationHeader();

    if (recursive) {
        url += `?recursive=${recursive}`;
    }

    const headers = {
        ...authorizationHeader,
        [HTTP_HEADER_ACCEPT]: [HTTP_CONTENT_TYPE_JSON],
    };
    const method = RequestMethod.DELETE;

    const requestOptions = {
        headers,
        method,
    };

    const deleteFolderOrFileResponse = await request(url, requestOptions);
    const responseHeaders = deleteFolderOrFileResponse?.headers;
    const response = await deleteFolderOrFileResponse.json();

    return { response, responseHeaders };
}

/**
 * Create Resumable Upload Session
 *
 * Initiate a multipart upload session and return an upload session ID. The upload_session_id, can be used to upload
 * file parts, resume an interrupted session, retrieve information about a session, and, if necessary, abort a session.
 * @param path - path of the item in the file staging area
 * @param size - total size in bytes of the file
 * @param overwrite - whether to overwrite an existing file with the same name
 * @returns FileStagingSessionResponse
 */
export async function createResumableUploadSession(path, size, overwrite) {
    const url = getAPIEndpoint(URL_FILE_STAGING_CREATE_RESUMABLE_UPLOAD_SESSION);
    const authorizationHeader = await getAuthorizationHeader();

    const headers = {
        ...authorizationHeader,
        [HTTP_HEADER_ACCEPT]: [HTTP_CONTENT_TYPE_JSON],
    };
    const method = RequestMethod.POST;

    const formdata = new FormData();
    formdata.append('path', path);
    formdata.append('size', size);
    formdata.append('overwrite', overwrite);

    const requestOptions = {
        headers,
        method,
        body: formdata,
    };

    const createResumableUploadSessionResponse = await request(url, requestOptions);
    const response = await createResumableUploadSessionResponse.json();

    return { response };
}

/**
 * Upload to a Session
 *
 * The session owner can upload parts of a file to an active upload session. By default, you can upload up to 2000 parts
 * per upload session, and each part can be up to 50MB.
 *
 * @param uploadSessionId - the session id of the resumable upload session
 * @param filepart - the file part being uploaded
 * @param fileContentLength - the size of the file part in bytes
 * @param fileMD5 - the MD5 checksum of the file part being uploaded
 * @param filepartNumber - the part number, which uniquely identifies a file part and defines its position within the file
 * @returns FileStagingSessionPartResponse
 */
export async function uploadToASession(uploadSessionId, filepart, fileContentLength, fileMD5, filepartNumber) {
    const url = getAPIEndpoint(
        URL_FILE_STAGING_HANDLE_UPLOAD_SESSION.replace('{UPLOAD_SESSION_ID}', uploadSessionId),
        true,
    );
    const authorizationHeader = await getAuthorizationHeader();

    const headers = {
        ...authorizationHeader,
        [HTTP_HEADER_ACCEPT]: [HTTP_CONTENT_TYPE_JSON],
        [HTTP_HEADER_CONTENT_TYPE]: [HTTP_CONTENT_TYPE_OCTET_STREAM],
        [HTTP_HEADER_CONTENT_LENGTH]: [fileContentLength],
        ...(fileMD5 && { [HTTP_HEADER_CONTENT_MD5]: [fileMD5] }),
        [HTTP_HEADER_FILEPART_NUMBER]: filepartNumber,
    };

    const method = RequestMethod.PUT;

    const requestOptions = {
        headers,
        method,
        body: filepart,
    };

    const uploadToASessionResponse = await request(url, requestOptions);
    const responseHeaders = uploadToASessionResponse?.headers;
    const response = await uploadToASessionResponse.json();

    return { response, responseHeaders };
}

/**
 * Commit Upload Session
 *
 * Mark an upload session as complete and assemble all previously uploaded parts to create a file.
 *
 * @param uploadSessionId - the session ID of the resumable upload session
 * @returns FileStagingJobResponse
 */
export async function commitUploadSession(uploadSessionId) {
    const url = getAPIEndpoint(
        URL_FILE_STAGING_HANDLE_UPLOAD_SESSION.replace('{UPLOAD_SESSION_ID}', uploadSessionId),
        true,
    );
    const authorizationHeader = await getAuthorizationHeader();

    const headers = {
        ...authorizationHeader,
        [HTTP_HEADER_ACCEPT]: [HTTP_CONTENT_TYPE_JSON],
        [HTTP_HEADER_CONTENT_TYPE]: [HTTP_CONTENT_TYPE_JSON],
    };

    const method = RequestMethod.POST;

    const requestOptions = {
        headers,
        method,
    };

    const commitUploadSessionResponse = await request(url, requestOptions);
    const responseHeaders = commitUploadSessionResponse?.headers;
    const response = await commitUploadSessionResponse.json();

    return { response, responseHeaders };
}

/**
 * Abort Upload Session
 *
 * Abort an active upload session and purge all uploaded file parts. Admin users can see and abort all upload sessions,
 * while non-Admin users can only see and abort sessions where they are the owner.
 *
 * @param uploadSessionId
 * @returns VaultResponse
 */
export async function abortUploadSession(uploadSessionId) {
    const url = getAPIEndpoint(
        URL_FILE_STAGING_HANDLE_UPLOAD_SESSION.replace('{UPLOAD_SESSION_ID}', uploadSessionId),
        true,
    );
    const authorizationHeader = await getAuthorizationHeader();

    const headers = {
        ...authorizationHeader,
        [HTTP_HEADER_ACCEPT]: [HTTP_CONTENT_TYPE_JSON],
    };

    const method = RequestMethod.DELETE;

    const requestOptions = {
        headers,
        method,
    };

    const abortUploadSessionResponse = await request(url, requestOptions);
    const responseHeaders = abortUploadSessionResponse?.headers;
    const response = await abortUploadSessionResponse.json();

    return { response, responseHeaders };
}
