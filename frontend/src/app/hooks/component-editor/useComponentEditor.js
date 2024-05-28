import { useState, useEffect } from 'react';
import { executeMdlScript, executeMdlScriptAsync, retrieveAsyncMdlScriptResults, retrieveComponentRecordMdl } from '../../services/ApiService';

export default function useComponentEditor() {
    const [code, setCode] = useState('Select a component record from the tree to view its MDL code');
    const [selectedComponent, setSelectedComponent] = useState('');
    const [consoleOutput, setConsoleOutput] = useState();
    const [isExecutingApiCall, setIsExecutingApiCall] = useState(false);
    const [isExecutingMdl, setIsExecutingMdl] = useState(false);
    const [asyncJobId, setAsyncJobId] = useState('');
    const [showOutstandingAsyncJobWarning, setShowOutstandingAsyncJobWarning] = useState(false);
    const [selectedComponentPendingConfirmation, setSelectedComponentPendingConfirmation] = useState('');
    const [displayComponentTree, setDisplayComponentTree] = useState(true);
    const [mdlTelemetryData, setMdlTelemetryData] = useState({});

    /**
     * Retrieve MDL code for current component record
     */
    const retrieveCode = async () => {
        const { response, responseTelemetry } = await retrieveComponentRecordMdl(selectedComponent);

        if (typeof response === 'string') {
            setCode(response);
        } else {
            setConsoleOutput(response);
            setCode('Error. Could not retrieve MDL code for this component.');
        }

        setMdlTelemetryData(responseTelemetry ? responseTelemetry : {})
    };

    /**
     * Execute current MDL code
     */
    const executeMdl = async () => {
        setIsExecutingMdl(true);
        setIsExecutingApiCall(true);
        const { response, responseTelemetry } = await executeMdlScript(code);
        setIsExecutingApiCall(false);
        setIsExecutingMdl(false);

        // Display the result in console output
        if (response) {
            setConsoleOutput(response);
        }

        setMdlTelemetryData(responseTelemetry ? responseTelemetry : {})
    };

    /**
     * Execute current MDL code (async)
     */
    const executeMdlAsync = async () => {
        setIsExecutingApiCall(true);
        const { response, responseTelemetry } = await executeMdlScriptAsync(code);
        setIsExecutingApiCall(false);
        setConsoleOutput(response);

        // If successful, store the job id
        if (response?.responseStatus === 'SUCCESS' && response?.job_id) {
            setAsyncJobId(response.job_id);
        }

        setMdlTelemetryData(responseTelemetry ? responseTelemetry : {})
    };

    /**
     * Retrieve results of current async MDL job
     */
    const retrieveMdlAsyncResults = async () => {
        setIsExecutingApiCall(true);
        const { response, responseTelemetry } = await retrieveAsyncMdlScriptResults(asyncJobId);
        setIsExecutingApiCall(false);
        setConsoleOutput(response);

        // If successful, we no longer need the current async job id
        if (response?.responseStatus === 'SUCCESS') {
            setAsyncJobId('');
        }

        setMdlTelemetryData(responseTelemetry ? responseTelemetry : {})
    };

    // Store the currently selected component in state
    const onSelect = (selectedKey) => {
        // Warn user if there's an outstanding Async request
        if (asyncJobId) {
            if (selectedComponentPendingConfirmation != selectedKey) {
                setSelectedComponentPendingConfirmation(selectedKey);
                setShowOutstandingAsyncJobWarning(true);
            }
        } else {
            updateSelectedComponent(selectedKey);
        }
    };

    const updateSelectedComponent = (component) => {
        // If changing components, clear outstanding async jobs
        setAsyncJobId('');
        setSelectedComponent(component);
    };

    const closeOutstandingAsyncJobWarning = () => {
        setShowOutstandingAsyncJobWarning(false);
        setSelectedComponentPendingConfirmation('');
    };

    const toggleComponentTree = () => {
        setDisplayComponentTree(!displayComponentTree);
    };

    // When a component record is selected, clear out the previously-selected code/console and fetch the current code
    useEffect(() => {
        if (selectedComponent) {
            setCode('');
            setConsoleOutput();
            retrieveCode();
        }
    }, [selectedComponent]);

    return {
        code,
        setCode,
        selectedComponent,
        setSelectedComponent,
        consoleOutput,
        executeMdl,
        executeMdlAsync,
        retrieveMdlAsyncResults,
        onSelect,
        updateSelectedComponent,
        closeOutstandingAsyncJobWarning,
        toggleComponentTree,
        mdlTelemetryData,
        isExecutingApiCall,
        isExecutingMdl,
        asyncJobId,
        showOutstandingAsyncJobWarning,
        selectedComponentPendingConfirmation,
        displayComponentTree,
    }
}