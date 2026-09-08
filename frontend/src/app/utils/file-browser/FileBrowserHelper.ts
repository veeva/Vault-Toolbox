/**
 * Shared helpers for the File Staging file browser: upload path math, CSV listing export, and
 * folder-upload progress display.
 */

export interface FileStagingItem {
    isFolder?: boolean;
    data?: {
        path?: string;
        name?: string;
        size?: number;
        modified_date?: string;
    };
}

export type FileStagingTree = Record<string, FileStagingItem>;

/**
 * From a set of picked files (each carrying a `webkitRelativePath` like "myfolder/sub/a.txt"),
 * work out every folder that must exist in Vault, sorted PARENT-FIRST so each parent is created
 * before its children. Files with no `webkitRelativePath` (a single picked file) contribute no folders.
 *
 * @param files - the files chosen by the user (from a directory picker)
 * @param basePath - the currently-selected Vault folder path, with leading slash (e.g. "/Documents")
 * @returns unique folder paths to create, e.g. ["Documents/myfolder", "Documents/myfolder/sub"]
 */
export const deriveFolderCreationPaths = (files: File[], basePath: string): string[] => {
    const base = basePath.slice(1); // strip the leading "/", matching the existing upload code
    const folderPaths = new Set<string>(); // a Set auto-dedupes shared/repeated folders

    for (const file of files) {
        if (!file.webkitRelativePath) {
            continue; // a lone file with no folder structure contributes no folders
        }
        const segments = file.webkitRelativePath.split('/');
        segments.pop(); // drop the file name — keep only the folder segments

        // Build the path up one level at a time so every parent gets added before its child.
        let accumulated = base;
        for (const segment of segments) {
            accumulated = accumulated ? `${accumulated}/${segment}` : segment;
            folderPaths.add(accumulated);
        }
    }

    // Sort parent-first: a parent always has fewer "/"-separated segments than its children.
    return Array.from(folderPaths).sort((a, b) => a.split('/').length - b.split('/').length);
};

/**
 * Build the full Vault destination path for a single file. Uses the file's `webkitRelativePath`
 * (to recreate folder structure) when present, otherwise just its name. Strips the leading slash
 * from basePath exactly like the existing single-file upload does.
 *
 * @param basePath - the currently-selected Vault folder path, with leading slash (e.g. "/Documents")
 * @param file - the file to place
 * @returns e.g. "Documents/myfolder/sub/a.txt" or "Documents/a.txt"
 */
export const buildDestinationPath = (basePath: string, file: File): string => {
    const relativePath = file.webkitRelativePath || file.name;
    return `${basePath.slice(1)}/${relativePath}`;
};

/**
 * Build the flat-tree KEY for a relative path under a base folder, preserving the leading slash that tree
 * keys use and collapsing the root ("/") case so it never produces a doubled "//". Single-file and folder
 * collision checks both key into the tree this way, so the slash handling lives here in one place.
 * @param basePath - the destination folder path WITH leading slash (e.g. "/Documents" or "/")
 * @param relativePath - a file name or webkitRelativePath under that folder (e.g. "sub/a.txt")
 */
export const buildTreeKey = (basePath: string, relativePath: string): string =>
    `${basePath === '/' ? '' : basePath}/${relativePath}`;

/**
 * Returns metadata for an existing FILE with the given name in the given folder, or null if there is
 * none. Used to warn (with size/date details) before a single-file upload would overwrite it.
 * @param fileStagingTree - the flat path→node File Staging tree
 * @param folderPath - the destination folder path WITH leading slash (e.g. "/Documents" or "/")
 * @param fileName - the picked file's name
 */
export const getExistingFileMeta = (
    fileStagingTree: Record<string, { isFolder?: boolean; data?: { size?: number; modified_date?: string } }>,
    folderPath: string,
    fileName: string,
): { size: number | null; modifiedDate: string | null } | null => {
    const key = buildTreeKey(folderPath, fileName);
    const node = fileStagingTree?.[key];
    if (!node || node.isFolder) {
        return null;
    }
    return { size: node.data?.size ?? null, modifiedDate: node.data?.modified_date ?? null };
};

/**
 * True if the folder being uploaded already exists at the destination. Every file from a directory pick
 * shares the same first path segment (the chosen folder's name), so we check whether a node already exists
 * at basePath/<that name>. Re-uploading into an existing folder is where files can collide, so the caller
 * prompts for skip/overwrite; a brand-new folder has nothing to overwrite and uploads straight away.
 *
 * @param fileStagingTree - the flat path→node File Staging tree
 * @param basePath - the selected Vault folder path WITH leading slash (e.g. "/Documents" or "/")
 * @param files - the picked files (each carrying a webkitRelativePath)
 */
export const folderAlreadyExists = (
    fileStagingTree: Record<string, unknown>,
    basePath: string,
    files: File[],
): boolean => {
    const topFolderName = files[0]?.webkitRelativePath?.split('/')[0];
    if (!topFolderName) {
        return false;
    }
    return Boolean(fileStagingTree[buildTreeKey(basePath, topFolderName)]);
};

const ITEM_EXISTS_ERROR_TYPE = 'ITEM_NAME_EXISTS'; // Vault's error type when a file already exists (overwrite=false)

/**
 * Wrap a Vault API error so callers can branch on its machine-readable `type` (e.g. ITEM_NAME_EXISTS)
 * instead of parsing the human-readable message.
 */
export function uploadErrorFrom(apiError: { type?: string; message?: string } | undefined, fallback: string): Error {
    const err = new Error(apiError?.message || fallback) as Error & { vaultErrorType?: string };
    err.vaultErrorType = apiError?.type;
    return err;
}

/** True when a failed upload was rejected because the file already exists at the destination (a skip). */
export function isItemExistsError(error: unknown): boolean {
    return (error as { vaultErrorType?: string })?.vaultErrorType === ITEM_EXISTS_ERROR_TYPE;
}

export interface FileStagingListingRow {
    kind: 'folder' | 'file';
    name: string;
    path: string;
    size: number | string;
    modifiedDate: string;
}

const CSV_HEADERS: (keyof FileStagingListingRow)[] = ['kind', 'name', 'path', 'size', 'modifiedDate'];

export interface FileStagingApiItem {
    path: string;
    name?: string;
    kind?: string;
    size?: number;
    modified_date?: string;
}

/**
 * Maps File Staging list-items API results into sorted export rows.
 */
export const fileStagingItemsToRows = (items: FileStagingApiItem[]): FileStagingListingRow[] =>
    (items || [])
        .map((item): FileStagingListingRow => ({
            kind: item.kind === 'folder' ? 'folder' : 'file',
            name: item.name || item.path.split('/').filter(Boolean).pop() || '',
            path: item.path,
            size: item.size ?? '',
            modifiedDate: item.modified_date ?? '',
        }))
        .sort((a, b) => a.path.localeCompare(b.path));

/**
 * Escapes a single CSV field — wraps in quotes (and doubles internal quotes) when it contains a comma,
 * quote, or newline.
 */
const escapeCsv = (value: number | string): string => {
    const str = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

/**
 * Serializes listing rows to CSV with a header row.
 */
export const rowsToCsv = (rows: FileStagingListingRow[]): string => {
    const header = CSV_HEADERS.join(',');
    const lines = rows.map((row) => CSV_HEADERS.map((key) => escapeCsv(row[key])).join(','));
    return [header, ...lines].join('\n');
};

/**
 * Triggers a browser download of in-memory text as a file, using the standard
 * blob -> object URL -> hidden anchor click -> revoke pattern.
 * @param fileName - the suggested download file name
 * @param text - the file contents
 * @param mimeType - the blob MIME type (e.g. 'text/csv')
 */
const downloadTextFile = (fileName: string, text: string, mimeType: string): void => {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Downloads the given rows as a CSV, named for the folder they came from.
 */
export const downloadFileStagingListingCsv = (rows: FileStagingListingRow[], folderName: string): void => {
    const suffix = folderName ? `-${folderName}` : '';
    downloadTextFile(`file-staging-listing${suffix}.csv`, rowsToCsv(rows), 'text/csv');
};

// Phases of a folder upload, surfaced to the user through the progress modal.
export const FolderUploadPhase = {
    Idle: 'idle',
    Creating: 'creating',
    Uploading: 'uploading',
    Done: 'done',
} as const;
export type FolderUploadPhase = (typeof FolderUploadPhase)[keyof typeof FolderUploadPhase];

export interface FolderUploadProgress {
    completed: number;
    total: number;
    failed: number;
    skipped: number;
}

/**
 * Display state for the folder-upload progress modal, derived from the current phase and counts.
 */
export const deriveFolderUploadDisplay = (phase: FolderUploadPhase, progress: FolderUploadProgress) => {
    const { completed, total, failed, skipped } = progress;
    const isCreating = phase === FolderUploadPhase.Creating;
    const isUploading = phase === FolderUploadPhase.Uploading;
    const isDone = phase === FolderUploadPhase.Done;
    const succeeded = completed - failed - skipped;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const notUploaded = total - completed;
    const cancelled = isDone && notUploaded > 0;

    const doneParts: string[] = [];
    if (succeeded > 0) doneParts.push(`${succeeded} uploaded`);
    if (skipped > 0) doneParts.push(`${skipped} skipped (already existed, not overwritten)`);
    if (failed > 0) doneParts.push(`${failed} failed`);
    if (cancelled) doneParts.push(`${notUploaded} not uploaded`);
    const doneSummary = doneParts.length > 0 ? `${doneParts.join(', ')}.` : 'Nothing to upload.';

    const title = isCreating
        ? 'Creating folders…'
        : isUploading
          ? 'Uploading folder…'
          : cancelled
            ? 'Upload cancelled'
            : failed > 0
              ? 'Upload finished with errors'
              : succeeded === total
                ? 'Upload complete'
                : 'Upload finished';

    return { isCreating, isUploading, isDone, cancelled, pct, doneSummary, title };
};
