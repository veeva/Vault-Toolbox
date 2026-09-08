import { useFileUpload } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { toaster } from '../../../components/shared/ui-components/toaster';
import { createFolderOrFile } from '../../../services/ApiService';
import { chunkFile, pollJobStatus } from '../../../services/SharedServices';
import {
    abortUploadSession,
    commitUploadSession,
    createResumableUploadSession,
    uploadToASession,
} from '../../../services/vapil/FileStagingRequest';
import {
    buildDestinationPath,
    deriveFolderCreationPaths,
    FileStagingItem,
    FileStagingTree,
    FolderUploadPhase,
    FolderUploadProgress,
    folderAlreadyExists,
    getExistingFileMeta,
    isItemExistsError,
    uploadErrorFrom,
} from '../../../utils/file-browser/FileBrowserHelper';

const MAX_FILE_SIZE = 536870912000; // 500 GB
const MAX_FILE_PART_SIZE = 52428800; // 50 MB
const UPLOAD_CONCURRENCY = 5; // number of files uploaded in parallel during a folder upload
// Reject larger folder picks up front: folder uploads are one API call per file, so the uploader is capped
// to stay performant, and the browser/Chakra also freezes the tab materializing tens of thousands of File
// objects. Until a streaming picker (File System Access API) lands, cap what the uploader will accept.
// Exported so the picker tooltip and the too-large dialog state the same limit.
export const MAX_FOLDER_UPLOAD_FILES = 10000;

interface UseFileStagingUploadArgs {
    handleReloadFileStagingTreeFolder: (path?: string) => void;
    selectedFileStagingFolder: FileStagingItem | null;
    fileStagingTree: FileStagingTree;
}

interface PendingSingleFileUpload {
    file: File;
    destinationPath: string;
    fileName: string;
    existing: { size: number | null; modifiedDate: string | null };
}

export default function useFileStagingUpload({
    handleReloadFileStagingTreeFolder,
    selectedFileStagingFolder,
    fileStagingTree,
}: UseFileStagingUploadArgs) {
    const [creatingFileStagingFolder, setCreatingFileStagingFolder] = useState(false);
    const [newFileStagingFolderName, setNewFileStagingFolderName] = useState('');

    const [isOverwritePromptOpen, setIsOverwritePromptOpen] = useState(false);
    const [pendingFolderFiles, setPendingFolderFiles] = useState<File[]>([]);

    const [isFileExistsDialogOpen, setIsFileExistsDialogOpen] = useState(false);
    const [pendingSingleFileUpload, setPendingSingleFileUpload] = useState<PendingSingleFileUpload | null>(null);

    const [isFolderTooLargeDialogOpen, setIsFolderTooLargeDialogOpen] = useState(false);
    const [oversizedFolderFileCount, setOversizedFolderFileCount] = useState(0);

    // Drives the folder-upload progress modal (creating -> uploading -> done).
    const [folderUploadPhase, setFolderUploadPhase] = useState<FolderUploadPhase>(FolderUploadPhase.Idle);
    const [folderUploadProgress, setFolderUploadProgress] = useState<FolderUploadProgress>({
        completed: 0,
        total: 0,
        failed: 0,
        skipped: 0,
    });
    // Per-file failure details (name + reason) surfaced in the done summary so the user can see WHICH file
    // failed and WHY, not just a count.
    const [folderUploadFailures, setFolderUploadFailures] = useState<{ name: string; reason: string }[]>([]);

    const createFileStagingFolderInputRef = useRef<HTMLInputElement>(null);

    // Set synchronously when the user cancels an in-progress folder upload. The upload loops check it to stop
    // starting new work; the handful of requests already in flight still finish. Reset when an upload starts.
    const cancelUploadRef = useRef(false);

    /**
     * Closes the folder-upload progress modal and resets it to idle.
     */
    const closeFolderUploadModal = () => {
        cancelUploadRef.current = false;
        setFolderUploadPhase(FolderUploadPhase.Idle);
        setFolderUploadProgress({ completed: 0, total: 0, failed: 0, skipped: 0 });
        setFolderUploadFailures([]);
    };

    /**
     * Cancels an in-progress folder upload: stops the loops from starting new files/folders. Requests already
     * in flight still complete, then the modal lands on its summary showing what got done before the cancel.
     */
    const cancelFolderUpload = () => {
        cancelUploadRef.current = true;
    };

    /**
     * ONE accept handler for both the single-file and folder pickers. A folder pick yields files that
     * each carry a `webkitRelativePath`; a single-file pick yields one file without one. We branch on that
     * so the two flows share a single entry point.
     * @param files - the files Chakra accepted from either picker
     */
    const handleFilesAccepted = (files: File[]) => {
        if (files.length < 1 || !selectedFileStagingFolder) {
            return;
        }

        const isFolderUpload = files.some((file) => Boolean(file.webkitRelativePath));
        if (isFolderUpload) {
            // Guard against folders over the supported count. Reject before any folder-creation or upload
            // work so we never leave a partial structure behind. This is the fallback for the cheaper
            // count-only check in handleFolderInputCapture (which runs before Chakra processes the files).
            if (files.length > MAX_FOLDER_UPLOAD_FILES) {
                openFolderTooLargeDialog(files.length);
                return;
            }

            // Ask about overwrite/skip only when the uploaded folder already exists at the destination —
            // that is where files inside can collide. A brand-new folder has nothing to overwrite, so it
            // uploads straight away with no prompt.
            const basePath = selectedFileStagingFolder?.data?.path ?? '';
            if (folderAlreadyExists(fileStagingTree, basePath, files)) {
                setPendingFolderFiles(files);
                setIsOverwritePromptOpen(true);
                return;
            }
            startFolderUpload(files, false);
            return;
        }

        // Single file: warn first if it would overwrite an existing file.
        const file = files[0];
        const filePath = selectedFileStagingFolder?.data?.path ?? '';
        const destinationPath = buildDestinationPath(filePath, file);
        const existing = getExistingFileMeta(fileStagingTree, filePath, file.name);
        if (existing) {
            setPendingSingleFileUpload({ file, destinationPath, fileName: file.name, existing });
            setIsFileExistsDialogOpen(true);
            return;
        }

        runSingleFileUpload(file, destinationPath, false);
    };

    /** Opens the "folder too large" dialog, recording the picked count to display. */
    const openFolderTooLargeDialog = (count: number) => {
        setOversizedFolderFileCount(count);
        setIsFolderTooLargeDialogOpen(true);
    };

    /** Closes the "folder too large" dialog. */
    const closeFolderTooLargeDialog = () => setIsFolderTooLargeDialogOpen(false);

    /**
     * Rejects an oversized folder pick before the picker processes it, avoiding a frozen tab.
     */
    const handleFolderInputCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
        const count = event.target.files?.length ?? 0;
        if (count > MAX_FOLDER_UPLOAD_FILES) {
            event.stopPropagation();
            event.target.value = ''; // reset so the same folder can be picked again later
            openFolderTooLargeDialog(count);
        }
    };

    // Single-file picker: one file, standard (non-directory) browse.
    const fileUploadRootProviderAttributes = useFileUpload({
        maxFiles: 1,
        maxFileSize: MAX_FILE_SIZE,
        onFileAccept: (details) => {
            fileUploadRootProviderAttributes.clearFiles();
            handleFilesAccepted(details.files);
        },
        onFileReject: (details) => {
            fileUploadRootProviderAttributes.clearFiles();
            showRejectionToast(details);
        },
    });

    // Folder picker: native input so webkitRelativePath is preserved across all subfolders.
    // Chakra's useFileUpload de-dupes by name+size+type and drops same-named files in different
    // subdirectories, causing false FILE_EXISTS errors on repeat uploads.
    const nativeFolderInputRef = useRef<HTMLInputElement>(null);

    const handleNativeFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = ''; // reset so the same folder can be re-selected after upload
        if (files.length > 0) {
            handleFilesAccepted(files);
        }
    };

    /**
     * Shared rejection toast for both pickers (e.g. a file exceeds the max size).
     */
    const showRejectionToast = (details: { files: { errors?: string[] }[] }) => {
        if (details.files.length < 1) {
            return;
        }
        const errorMessage = details?.files[0]?.errors?.[0] ?? 'Unexpected error';
        toaster.create({
            title: 'FAILURE',
            description: errorMessage,
            type: 'error',
            duration: 10000,
        });
    };

    /**
     * Handles uploading a file to the selected folder
     * @param file - the file to upload
     * @param destinationPath - the path of the selected folder to upload the file to
     * @param overwrite - whether to overwrite an existing file at the destination
     * @returns {Promise<void>}
     */
    const handleFileUpload = async (file: File, destinationPath: string, overwrite = false) => {
        const response = await createFolderOrFile('FILE', destinationPath, file, overwrite);

        if (response?.responseStatus === 'SUCCESS') {
            return response;
        }

        if (response?.responseStatus === 'FAILURE') {
            throw uploadErrorFrom(response?.errors?.[0], 'Upload Failed');
        }

        throw new Error('Unknown Error Occurred');
    };

    /**
     * Handles uploading a file to the selected folder via resumable file upload endpoint
     * @param file - the file to upload
     * @param destinationPath - the path of the selected folder to upload the file to
     * @param overwrite - whether to overwrite an existing file at the destination
     * @returns {Promise<void>}
     */
    const handleResumableFileUpload = async (file: File, destinationPath: string, overwrite = false) => {
        try {
            const fileSize = file.size;

            const { response: uploadSessionIdResponse } = await createResumableUploadSession(
                destinationPath,
                fileSize,
                overwrite,
            );

            if (!uploadSessionIdResponse || uploadSessionIdResponse.responseStatus !== 'SUCCESS') {
                throw uploadErrorFrom(
                    uploadSessionIdResponse?.errors?.[0],
                    'Failed to create resumable upload session',
                );
            }

            const uploadSessionId = uploadSessionIdResponse.data.id;
            const fileParts = chunkFile(file);

            for (let currentFilePart = 0; currentFilePart < fileParts.length; currentFilePart++) {
                const filepart = fileParts[currentFilePart];
                const partNumber = currentFilePart + 1;

                const { response: uploadFilepartResponse } = await uploadToASession(
                    uploadSessionId,
                    filepart,
                    filepart.size,
                    null,
                    partNumber,
                );

                if (!uploadFilepartResponse || uploadFilepartResponse.responseStatus === 'FAILURE') {
                    await abortUploadSession(uploadSessionId);
                    throw uploadErrorFrom(
                        uploadFilepartResponse?.errors?.[0],
                        `Failed to upload filepart ${partNumber}. Aborting upload session.`,
                    );
                }
            }
            const { response: commitResponse } = await commitUploadSession(uploadSessionId);

            if (!commitResponse || commitResponse.responseStatus === 'FAILURE') {
                await abortUploadSession(uploadSessionId);
                throw uploadErrorFrom(
                    commitResponse?.errors?.[0],
                    'Failed to commit session. Aborting upload session.',
                );
            }

            return pollJobStatus(commitResponse.data.job_id);
        } catch (error) {
            // Intentionally disabled: the error is rethrown and surfaced to the user (single-file toast /
            // folder upload summary), so logging here is redundant noise in the shipped extension. Left
            // commented rather than deleted for quick re-enable when debugging uploads.
            // console.error('Upload failed:', error);
            throw error;
        }
    };

    /**
     * Uploads ONE file, picking the small-file endpoint or the chunked resumable flow by size. The single
     * source of truth for that size decision, shared by the single-file and folder-upload paths.
     * @param file - the file to upload
     * @param destinationPath - full Vault destination path
     * @param overwrite - whether to overwrite an existing file
     */
    const uploadOneFile = (file: File, destinationPath: string, overwrite: boolean) =>
        file.size <= MAX_FILE_PART_SIZE
            ? handleFileUpload(file, destinationPath, overwrite)
            : handleResumableFileUpload(file, destinationPath, overwrite);

    /**
     * Uploads a single file (small or resumable) and shows the standard upload toast.
     * @param file - the file to upload
     * @param destinationPath - full Vault destination path
     * @param overwrite - whether to overwrite an existing file
     */
    const runSingleFileUpload = (file: File, destinationPath: string, overwrite: boolean) => {
        const reloadPath = selectedFileStagingFolder?.data?.path;
        const uploadPromise = uploadOneFile(file, destinationPath, overwrite);

        toaster.promise(uploadPromise, {
            success: () => {
                handleReloadFileStagingTreeFolder(reloadPath?.slice(1));

                return {
                    title: 'SUCCESS',
                    description: `${file.name} uploaded successfully to ${reloadPath?.slice(1)}`,
                    duration: 5000,
                };
            },
            error: (error: unknown) => ({
                title: 'FAILURE',
                description: isItemExistsError(error)
                    ? `${file.name} already exists in this location. Reload the folder and try again.`
                    : error instanceof Error
                      ? error.message
                      : 'Upload failed',
                duration: 10000,
            }),
            loading: {
                title: 'Uploading',
                description: `Uploading to ${reloadPath}`,
            },
        });
    };

    /**
     * Closes the "file already exists" warning without uploading.
     */
    const closeFileExistsDialog = () => {
        setIsFileExistsDialogOpen(false);
        setPendingSingleFileUpload(null);
    };

    /**
     * Confirms overwriting an existing file (single-file upload).
     */
    const confirmSingleFileOverwrite = () => {
        const pending = pendingSingleFileUpload;
        closeFileExistsDialog();
        if (!pending) {
            return;
        }
        runSingleFileUpload(pending.file, pending.destinationPath, true);
    };

    /**
     * Batch-uploads an entire folder, recreating its directory structure in Vault. Creates all
     * needed folders parent-first, then uploads each file, continuing past any individual failure.
     * @param files - files from a directory picker (each carries a webkitRelativePath)
     * @param overwrite - whether existing files should be overwritten
     * @returns {Promise<{succeeded: File[], failed: {file: File, error: Error}[]}>}
     */
    const uploadFolder = async (
        files: File[],
        overwrite = false,
        onProgress?: (settled: number, skipped: number, failed: number) => void,
        onUploadStart?: () => void,
    ) => {
        const basePath = selectedFileStagingFolder?.data?.path ?? '';

        // 1. Create every needed folder, parents before children. An "already exists" failure is fine —
        //    we ignore it so shared parents and re-uploads don't break the batch.
        const folderPaths = deriveFolderCreationPaths(files, basePath);
        for (const folderPath of folderPaths) {
            if (cancelUploadRef.current) {
                break;
            }
            try {
                await createFolderOrFile('FOLDER', folderPath, null);
            } catch {
                // Intentionally ignored — a real problem resurfaces when we upload into it below.
            }
        }
        onUploadStart?.(); // folder structure is ready; switch the modal from "Creating folders" to uploading

        // 2. Upload files with a fixed pool of UPLOAD_CONCURRENCY workers running in parallel. A file that
        //    Vault rejects because it already exists (overwrite=false) is counted as skipped, not failed;
        //    anything else is a real failure (continue-on-error). Workers share a cursor; incrementing it is
        //    synchronous (no await in between), so each file is claimed by exactly one worker.
        const succeeded: File[] = [];
        const skipped: File[] = [];
        const failed: { file: File; error: Error }[] = [];
        let nextIndex = 0;

        const worker = async () => {
            while (nextIndex < files.length && !cancelUploadRef.current) {
                const file = files[nextIndex++];
                const destinationPath = buildDestinationPath(basePath, file);
                try {
                    await uploadOneFile(file, destinationPath, overwrite);
                    succeeded.push(file);
                } catch (error) {
                    if (isItemExistsError(error)) {
                        skipped.push(file);
                    } else {
                        failed.push({ file, error: error as Error });
                    }
                }
                onProgress?.(succeeded.length + skipped.length + failed.length, skipped.length, failed.length);
            }
        };

        await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, files.length) }, () => worker()));

        // 3. Refresh the tree so the new folders/files appear.
        handleReloadFileStagingTreeFolder(basePath.slice(1));

        return { succeeded, skipped, failed };
    };

    /**
     * Closes the overwrite prompt without uploading (cancel).
     */
    const closeOverwritePrompt = () => {
        setIsOverwritePromptOpen(false);
        setPendingFolderFiles([]);
    };

    /**
     * Uploads a folder while driving the progress modal: switches to the 'uploading' phase, updates the
     * X-of-N count after each file, and lands on 'done' (showing a summary the user dismisses) so the
     * modal always resolves visibly instead of looking stuck.
     * @param files - the folder's files
     * @param overwrite - whether existing files should be overwritten
     */
    const startFolderUpload = (files: File[], overwrite: boolean) => {
        if (files.length === 0) {
            return;
        }
        const total = files.length;
        cancelUploadRef.current = false;
        setFolderUploadPhase(FolderUploadPhase.Creating);
        setFolderUploadProgress({ completed: 0, total, failed: 0, skipped: 0 });
        setFolderUploadFailures([]);

        uploadFolder(
            files,
            overwrite,
            (settled, skipped, failed) => setFolderUploadProgress({ completed: settled, total, failed, skipped }),
            () => setFolderUploadPhase(FolderUploadPhase.Uploading),
        )
            .then((result) => {
                setFolderUploadProgress({
                    completed: result.succeeded.length + result.skipped.length + result.failed.length,
                    total,
                    failed: result.failed.length,
                    skipped: result.skipped.length,
                });
                setFolderUploadFailures(
                    result.failed.map(({ file, error }) => ({
                        name: file.webkitRelativePath || file.name,
                        reason: error.message,
                    })),
                );
                setFolderUploadPhase(FolderUploadPhase.Done);
            })
            .catch((error: unknown) => {
                setFolderUploadPhase(FolderUploadPhase.Done);
                toaster.create({
                    title: 'FAILURE',
                    description: error instanceof Error ? error.message : 'Upload failed',
                    type: 'error',
                    duration: 10000,
                });
            });
    };

    /**
     * Runs the pending folder upload (from the overwrite prompt) with the user's chosen overwrite setting.
     * @param overwrite - whether existing files should be overwritten
     */
    const confirmFolderUpload = (overwrite: boolean) => {
        const files = pendingFolderFiles;
        closeOverwritePrompt();
        // overwrite=true replaces existing files; overwrite=false ("Skip existing") leaves them in place —
        // Vault rejects each already-existing file and the upload loop counts those as skipped, not failed.
        startFolderUpload(files, overwrite);
    };

    /**
     * Handles folder creation
     * @param folderName
     * @returns {Promise<void>}
     */
    const handleFolderCreate = async (folderName: string) => {
        const destinationPath = `${selectedFileStagingFolder?.data?.path?.slice(1) ?? ''}/${folderName}`;

        const response = await createFolderOrFile('FOLDER', destinationPath, null);

        if (response?.responseStatus === 'SUCCESS') {
            handleReloadFileStagingTreeFolder(selectedFileStagingFolder?.data?.path?.slice(1));
            return response;
        }

        if (response?.responseStatus === 'FAILURE') {
            throw new Error(response?.errors[0]?.message || 'Upload Failed');
        }
        throw new Error('Unknown Error Occurred');
    };

    const handleCreateFileStagingFolderInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newFileStagingFolderName.trim() !== '') {
            handleFolderCreate(newFileStagingFolderName.trim());
            setCreatingFileStagingFolder(false);
            setNewFileStagingFolderName('');
        }

        if (e.key === 'Escape') {
            setCreatingFileStagingFolder(false);
            setNewFileStagingFolderName('');
        }
    };

    useEffect(() => {
        if (creatingFileStagingFolder) {
            createFileStagingFolderInputRef?.current?.focus();
        }
    }, [creatingFileStagingFolder]);

    return {
        createFileStagingFolderInputRef,
        creatingFileStagingFolder,
        setCreatingFileStagingFolder,
        newFileStagingFolderName,
        setNewFileStagingFolderName,
        fileUploadRootProviderAttributes,
        nativeFolderInputRef,
        handleNativeFolderInputChange,
        handleCreateFileStagingFolderInputKeyDown,
        isOverwritePromptOpen,
        pendingFolderFiles,
        confirmFolderUpload,
        closeOverwritePrompt,
        isFileExistsDialogOpen,
        pendingSingleFileUpload,
        confirmSingleFileOverwrite,
        closeFileExistsDialog,
        isFolderTooLargeDialogOpen,
        oversizedFolderFileCount,
        closeFolderTooLargeDialog,
        handleFolderInputCapture,
        folderUploadPhase,
        folderUploadProgress,
        folderUploadFailures,
        closeFolderUploadModal,
        cancelFolderUpload,
    };
}
