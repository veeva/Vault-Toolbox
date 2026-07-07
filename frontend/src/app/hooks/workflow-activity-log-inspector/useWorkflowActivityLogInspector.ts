import { useState, useCallback, useMemo } from 'react';
import { useFileUpload } from '@chakra-ui/react';
import { downloadWorkflowActivityLog } from '../../services/ApiService';
import { toaster } from '../../components/shared/ui-components/toaster';
import {
    extractLogRowsFromFile,
    extractLogRowsFromZip,
    filterLogs,
    groupLogItems,
    summarizeWorkflowRecords,
    getUniqueWorkflowNames,
    getUniqueVersions,
    WorkflowViewMode,
    type WorkflowActivityLogEntry,
    type GroupedLogItem,
    type ResponseTelemetry,
    type WorkflowActivityLogDownloadResult,
} from '../../utils/workflow-activity-log-inspector/WorkflowActivityLogHelper';

/**
 * Owns all workflow activity log state for the Workflow Activity Log Inspector page: the raw rows,
 * the active filters/selection, file download + upload orchestration, and the derived data the views
 * render. All pure parsing/filtering/grouping lives in WorkflowActivityLogHelper.
 */
export default function useWorkflowActivityLogInspector() {
    const [telemetryData, setTelemetryData] = useState<ResponseTelemetry | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rawLogs, setRawLogs] = useState<WorkflowActivityLogEntry[]>([]);

    // Filters
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
    const [selectedWorkflowName, setSelectedWorkflowName] = useState('');
    const [selectedVersion, setSelectedVersion] = useState('');
    const [recordIdSearch, setRecordIdSearch] = useState('');
    const [showErrorsOnly, setShowErrorsOnly] = useState(false);

    // View state
    const [viewMode, setViewMode] = useState<WorkflowViewMode>(WorkflowViewMode.List);
    const [selectedLogItem, setSelectedLogItem] = useState<GroupedLogItem | null>(null);

    /** Downloads the workflow activity log for a date from Vault and appends its rows to the existing data. */
    const fetchLogData = useCallback(async (date: string) => {
        if (!date) return;
        setIsLoading(true);
        setError(null);

        try {
            const apiResult: WorkflowActivityLogDownloadResult = await downloadWorkflowActivityLog(date);
            setTelemetryData(apiResult.responseTelemetry ?? null);

            // A successful response is the ZIP Blob; a failure is a JSON error object
            const { response } = apiResult;
            if (!(response instanceof Blob)) {
                throw new Error(response.errors?.[0]?.message || 'Failed to download log');
            }

            const newWorkflowLogRows = await extractLogRowsFromZip(response, `Vault API (${date})`);
            if (newWorkflowLogRows.length === 0) {
                throw new Error(`No workflow log data found for ${date}.`);
            }

            // New data is appended to any previously loaded data.
            setRawLogs((existing) => [...existing, ...newWorkflowLogRows]);
            toaster.create({
                title: 'Data Added',
                description: `Loaded ${newWorkflowLogRows.length} log row${newWorkflowLogRows.length > 1 ? 's' : ''}`,
                type: 'success',
                duration: 3000,
            });
        } catch (downloadError) {
            const message = downloadError instanceof Error ? downloadError.message : 'Unknown error';
            setError(message);
            toaster.create({ title: 'Download Failed', description: message, type: 'error', duration: 5000 });
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Parses one or more uploaded files (CSV or ZIP) and appends their rows. Each file is handled
     * independently: an unsupported type, a ZIP with no CSV, or a file with no workflow rows is
     * reported via toast and skipped, leaving previously loaded data untouched.
     */
    const handleFileUpload = useCallback(async (files: File[]) => {
        if (files.length === 0) return;
        setIsUploading(true);
        setError(null);

        try {
            const collectedRows: WorkflowActivityLogEntry[] = [];

            for (const file of files) {
                try {
                    const rows = await extractLogRowsFromFile(file);
                    if (rows.length === 0) {
                        const message = `No workflow log data found in ${file.name}. The file may not be a valid workflow activity log.`;
                        console.warn(message);
                        setError(message);
                        toaster.create({
                            title: 'Invalid Log File',
                            description: message,
                            type: 'error',
                            duration: 5000,
                        });
                        continue;
                    }
                    collectedRows.push(...rows);
                } catch (fileError) {
                    // Thrown by extractLogRowsFromFile for an unsupported type or a ZIP missing a CSV.
                    const message = fileError instanceof Error ? fileError.message : `Failed to read ${file.name}`;
                    console.warn(message);
                    setError(message);
                    const title = message.startsWith('Skipping unsupported') ? 'Unsupported File' : 'Upload Failed';
                    toaster.create({ title, description: message, type: 'error', duration: 5000 });
                }
            }

            // Nothing usable in this upload; per-file errors already shown, so keep existing data.
            if (collectedRows.length === 0) return;

            setRawLogs((existing) => [...existing, ...collectedRows]);
            toaster.create({
                title: 'Data Added',
                description: `Loaded ${collectedRows.length} log row${collectedRows.length > 1 ? 's' : ''}`,
                type: 'success',
                duration: 3000,
            });
        } catch (uploadError) {
            const message = uploadError instanceof Error ? uploadError.message : 'Unknown error';
            setError(message);
            toaster.create({ title: 'Upload Failed', description: message, type: 'error', duration: 5000 });
        } finally {
            setIsUploading(false);
        }
    }, []);

    // Shared Chakra FileUpload context driving used by both the header file upload button and the island dropzone.
    const fileUploadRootProviderAttributes = useFileUpload({
        accept: ['.csv', '.zip'],
        maxFiles: Infinity,
        onFileAccept: (details) => {
            handleFileUpload(details.files);
            fileUploadRootProviderAttributes.clearFiles();
        },
    });

    /** Choosing a workflow name resets the dependent version and workflow-id filters. */
    const selectWorkflowName = useCallback((workflowName: string) => {
        setSelectedWorkflowName(workflowName);
        setSelectedVersion('');
        setSelectedWorkflowId('');
    }, []);

    /** Choosing a version resets the dependent workflow-id filter. */
    const selectVersion = useCallback((version: string) => {
        setSelectedVersion(version);
        setSelectedWorkflowId('');
    }, []);

    /** Selects a workflow record, or clears the selection when the already-active one is chosen again. */
    const toggleSelectedWorkflowId = useCallback((workflowId: string) => {
        setSelectedWorkflowId((current) => (current === workflowId ? '' : workflowId));
    }, []);

    /** Expands a log item, or collapses it when the already-expanded one is chosen again. */
    const toggleSelectedLogItem = useCallback((item: GroupedLogItem) => {
        setSelectedLogItem((current) => (current?.id === item.id ? null : item));
    }, []);

    /** Clears all loaded data, filters, and selection. */
    const clearLogData = useCallback(() => {
        setRawLogs([]);
        setSelectedDate('');
        setSelectedWorkflowId('');
        setSelectedWorkflowName('');
        setSelectedVersion('');
        setRecordIdSearch('');
        setShowErrorsOnly(false);
        setSelectedLogItem(null);
        setError(null);
    }, []);

    // Rows passing the workflow-id / name / version filters, used by the List and Process views.
    const filteredLogs = useMemo(
        () =>
            filterLogs(rawLogs, {
                workflowId: selectedWorkflowId,
                workflowName: selectedWorkflowName,
                version: selectedVersion,
            }),
        [rawLogs, selectedWorkflowId, selectedWorkflowName, selectedVersion],
    );

    // Filtered rows grouped into the step/event items the views render.
    const groupedLogItems = useMemo(() => groupLogItems(filteredLogs), [filteredLogs]);

    // Filter dropdown options (versions narrow to the selected workflow name).
    const uniqueWorkflowNames = useMemo(() => getUniqueWorkflowNames(rawLogs), [rawLogs]);
    const uniqueVersions = useMemo(
        () => getUniqueVersions(rawLogs, selectedWorkflowName),
        [rawLogs, selectedWorkflowName],
    );

    // One summarized record per workflow_id for the Workflows selector panel.
    const workflowRecords = useMemo(
        () =>
            summarizeWorkflowRecords(rawLogs, {
                workflowName: selectedWorkflowName,
                version: selectedVersion,
                recordIdSearch,
                errorsOnly: showErrorsOnly,
            }),
        [rawLogs, selectedWorkflowName, selectedVersion, recordIdSearch, showErrorsOnly],
    );

    return {
        telemetryData,
        isLoading,
        isUploading,
        error,
        rawLogs,
        selectedDate,
        setSelectedDate,
        selectedWorkflowId,
        toggleSelectedWorkflowId,
        selectedWorkflowName,
        selectWorkflowName,
        selectedVersion,
        selectVersion,
        recordIdSearch,
        setRecordIdSearch,
        showErrorsOnly,
        setShowErrorsOnly,
        viewMode,
        setViewMode,
        selectedLogItem,
        setSelectedLogItem,
        toggleSelectedLogItem,
        uniqueWorkflowNames,
        uniqueVersions,
        filteredLogs,
        workflowRecords,
        hasLogData: rawLogs.length > 0,
        groupedLogItems,
        fetchLogData,
        fileUploadRootProviderAttributes,
        clearLogData,
    };
}
