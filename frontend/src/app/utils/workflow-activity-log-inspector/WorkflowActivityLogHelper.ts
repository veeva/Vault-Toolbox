import { MarkerType, Position, type Node, type Edge } from '@xyflow/react';
import dagre from 'dagre';
import JSZip from 'jszip';
import Papa from 'papaparse';

// =============================================================================
// Types
// =============================================================================

/** One parsed row from a workflow activity log CSV. */
export interface WorkflowActivityLogEntry {
    workflow_id: string;
    version: string;
    workflow: string;
    step_id: string;
    step: string;
    state: string;
    event: string;
    status: string;
    start_time: string;
    end_time: string;
    condition: string;
    details: string;
    result: string;
    user: string;
    object: string;
    record: string;
    document: string;
}

/** The two ways the inspector can render grouped log items: a flat list or a process flow diagram. */
export const WorkflowViewMode = {
    List: 'list',
    Process: 'process',
} as const;

export type WorkflowViewMode = (typeof WorkflowViewMode)[keyof typeof WorkflowViewMode];

/** A workflow step or event with its grouped log rows, for the Workflow List and Process views. */
export interface GroupedLogItem {
    id: string;
    isStep: boolean;
    name: string; // Step name or Event name
    firstLogTime: string;
    logs: WorkflowActivityLogEntry[];
    hasError: boolean;
    isCompleted: boolean;
}

/** A single workflow instance (one workflow_id) summarized for the Workflows selector panel. */
export interface WorkflowRecord {
    workflowId: string;
    workflowName: string;
    version: string;
    record: string;
    object: string;
    document: string;
    startTime: string;
    endTime: string;
    hasError: boolean;
}

/** Per-request telemetry produced by the API service layer (see getTelemetryData in ApiService). */
export interface ResponseTelemetry {
    responseStatus?: number;
    responseSizeInKB: string;
    executionTimeInMS: string;
}

/** The JSON error shape Vault returns when a request fails (instead of a file Blob). */
export interface VaultErrorResponse {
    responseStatus?: string;
    errors?: { message: string }[];
}

/** Result of ApiService.downloadWorkflowActivityLog: a ZIP Blob on success, or an error object. */
export interface WorkflowActivityLogDownloadResult {
    response: Blob | VaultErrorResponse;
    responseTelemetry?: ResponseTelemetry;
    responseHeaders?: Headers;
}

/** Active filters applied to the raw logs for the List / Process views. */
export interface LogFilters {
    workflowId?: string;
    workflowName?: string;
    version?: string;
}

/** Filters applied when summarizing workflow records for the Workflows selector panel. */
export interface WorkflowRecordFilters {
    workflowName?: string;
    version?: string;
    recordIdSearch?: string;
    errorsOnly?: boolean;
}

// =============================================================================
// Log Ingestion — reading raw uploaded/downloaded files into log rows
// =============================================================================

/**
 * Parses a log entry's `details` field, which may be a (sometimes quote-escaped) JSON string.
 * Returns the parsed object, or null when absent or not valid JSON.
 */
export function parseLogDetails(rawDetails: string): Record<string, unknown> | null {
    if (!rawDetails || rawDetails.trim() === '') return null;

    let cleanedJson = rawDetails;
    if (cleanedJson.startsWith('"') && cleanedJson.endsWith('"')) {
        cleanedJson = cleanedJson.substring(1, cleanedJson.length - 1);
    }
    cleanedJson = cleanedJson.replace(/""/g, '"');

    try {
        return JSON.parse(cleanedJson);
    } catch (parseError) {
        console.warn('Could not parse log details JSON', parseError);
        return null;
    }
}

/** Reads a File as UTF-8 text. */
function readFileAsText(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            // readAsText always yields a string, but the union includes ArrayBuffer — narrow to be safe.
            const result = event.target?.result;
            resolve(typeof result === 'string' ? result : '');
        };
        reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
        reader.readAsText(file);
    });
}

/**
 * Parses CSV text with PapaParse and resolves with only the rows that look like workflow log entries
 * (those carrying an `event` or `workflow_id`). Parse warnings are logged, not thrown.
 */
function parseCsvRows(csvText: string, sourceName: string): Promise<WorkflowActivityLogEntry[]> {
    return new Promise<WorkflowActivityLogEntry[]>((resolve, reject) => {
        Papa.parse<WorkflowActivityLogEntry>(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn(`CSV Parsing Warnings for ${sourceName}:`, results.errors);
                }
                resolve(results.data.filter((log) => log.event || log.workflow_id));
            },
            error: (parseError: Error) => reject(parseError),
        });
    });
}

/**
 * Extracts and parses the first `.csv` entry inside a ZIP archive (Blob or File).
 * Throws when the archive contains no CSV.
 */
export async function extractLogRowsFromZip(
    zipData: Blob | File,
    sourceName: string,
): Promise<WorkflowActivityLogEntry[]> {
    const zip = await JSZip.loadAsync(zipData);
    const csvFile = Object.values(zip.files).find((entry) => entry.name.toLowerCase().endsWith('.csv'));
    if (!csvFile) {
        throw new Error(`No CSV found inside ${sourceName}`);
    }
    const csvText = await csvFile.async('text');
    return parseCsvRows(csvText, sourceName);
}

/**
 * Reads one uploaded file into workflow log rows: a `.csv` is read directly; a `.zip` is unzipped and
 * its CSV parsed. Throws for unsupported file types (and for a ZIP with no CSV). Returns `[]` when the
 * file parses but contains no workflow rows — the caller decides how to message that.
 */
export async function extractLogRowsFromFile(file: File): Promise<WorkflowActivityLogEntry[]> {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
        const csvText = await readFileAsText(file);
        return parseCsvRows(csvText, file.name);
    }
    if (fileName.endsWith('.zip')) {
        return extractLogRowsFromZip(file, file.name);
    }
    throw new Error(`Skipping unsupported file type: ${file.name}`);
}

// =============================================================================
// Log Analysis — filtering, grouping, and summarizing rows for the views
// =============================================================================

/** Returns only the rows matching the active workflow-id / name / version filters. */
export function filterLogs(logs: WorkflowActivityLogEntry[], filters: LogFilters): WorkflowActivityLogEntry[] {
    return logs.filter((log) => {
        if (filters.workflowId && log.workflow_id !== filters.workflowId) return false;
        if (filters.workflowName && log.workflow !== filters.workflowName) return false;
        if (filters.version && log.version !== filters.version) return false;
        return true;
    });
}

/**
 * Groups log rows into step/event items for the List and Process views. Each group collects its rows,
 * flags error/completed state, and tracks its earliest log time; the result is sorted by that time.
 */
export function groupLogItems(logs: WorkflowActivityLogEntry[]): GroupedLogItem[] {
    const itemsById = new Map<string, GroupedLogItem>();

    logs.forEach((log) => {
        const isStep = !!log.step;
        const id = isStep ? `step-${log.step}` : `event-${log.event}`;

        // Reuse the existing group for this step/event, or start a new one.
        let group = itemsById.get(id);
        if (!group) {
            group = {
                id,
                isStep,
                name: isStep ? log.step : log.event,
                firstLogTime: log.start_time,
                logs: [],
                hasError: false,
                isCompleted: false,
            };
            itemsById.set(id, group);
        }

        group.logs.push(log);
        if (log.status === 'error' || log.event === 'ERROR') group.hasError = true;
        if (log.event === 'STEP_COMPLETED' || log.status === 'completed') group.isCompleted = true;
        if (new Date(log.start_time) < new Date(group.firstLogTime)) {
            group.firstLogTime = log.start_time;
        }
    });

    return Array.from(itemsById.values()).sort(
        (first, second) => new Date(first.firstLogTime).getTime() - new Date(second.firstLogTime).getTime(),
    );
}

/**
 * Summarizes the raw logs into one WorkflowRecord per workflow_id (respecting the panel filters),
 * widening each record's start/end times to span all of its rows. Sorted by start time.
 */
export function summarizeWorkflowRecords(
    logs: WorkflowActivityLogEntry[],
    filters: WorkflowRecordFilters,
): WorkflowRecord[] {
    const recordsByWorkflowId = new Map<string, WorkflowRecord>();

    logs.forEach((log) => {
        if (!log.workflow_id) return;
        if (filters.workflowName && log.workflow !== filters.workflowName) return;
        if (filters.version && log.version !== filters.version) return;
        if (filters.recordIdSearch) {
            const searchTerm = filters.recordIdSearch.toLowerCase();
            const matchesRecord = log.record?.toLowerCase().includes(searchTerm);
            const matchesDocument = log.document?.toLowerCase().includes(searchTerm);
            if (!matchesRecord && !matchesDocument) {
                return;
            }
        }

        const isErrorRow = log.status === 'error' || log.event === 'ERROR';

        const existing = recordsByWorkflowId.get(log.workflow_id);
        if (!existing) {
            recordsByWorkflowId.set(log.workflow_id, {
                workflowId: log.workflow_id,
                workflowName: log.workflow,
                version: log.version,
                record: log.record,
                object: log.object,
                document: log.document,
                startTime: log.start_time,
                endTime: log.end_time,
                hasError: isErrorRow,
            });
            return;
        }

        // Flag the record if any of its log rows is an error.
        if (isErrorRow) existing.hasError = true;

        // Widen the record's time window to cover this row.
        if (log.start_time && (!existing.startTime || new Date(log.start_time) < new Date(existing.startTime))) {
            existing.startTime = log.start_time;
        }
        if (log.end_time && (!existing.endTime || new Date(log.end_time) > new Date(existing.endTime))) {
            existing.endTime = log.end_time;
        }
    });

    return Array.from(recordsByWorkflowId.values())
        .filter((record) => !filters.errorsOnly || record.hasError)
        .sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime());
}

/** Distinct, non-empty workflow names across all rows. */
export function getUniqueWorkflowNames(logs: WorkflowActivityLogEntry[]): string[] {
    return Array.from(new Set(logs.map((log) => log.workflow).filter(Boolean)));
}

/** Distinct, non-empty versions, optionally narrowed to a selected workflow name. */
export function getUniqueVersions(logs: WorkflowActivityLogEntry[], selectedWorkflowName: string): string[] {
    const scopedLogs = selectedWorkflowName ? logs.filter((log) => log.workflow === selectedWorkflowName) : logs;
    return Array.from(new Set(scopedLogs.map((log) => log.version).filter(Boolean)));
}

// =============================================================================
// Workflow Process Graph — React Flow nodes/edges + dagre layout for the steps
//
// We build React Flow nodes/edges from the steps, then hand them to dagre to
// auto-position. This mirrors React Flow's own dagre recipe; start there if any
// of the graph code below is unclear:
//   - Layouting guide:   https://reactflow.dev/learn/layouting/layouting
//   - Dagre example:     https://reactflow.dev/examples/layout/dagre
//   - dagre wiki:        https://github.com/dagrejs/dagre/wiki
// =============================================================================

/**
 * Dagre "rank direction" — the axis the step graph flows along. These are dagre's required
 * `rankdir` string values; only the two the UI exposes are defined here. The full set of layout
 * options (rankdir, nodesep, ranksep, …) is documented under "Configuring the Layout":
 * @see https://github.com/dagrejs/dagre/wiki#configuring-the-layout
 */
export type GraphLayoutDirection = 'TB' | 'LR';
export const TOP_TO_BOTTOM: GraphLayoutDirection = 'TB'; // Vertical layout: top → bottom
export const LEFT_TO_RIGHT: GraphLayoutDirection = 'LR'; // Horizontal layout: left → right

// Fixed node box size dagre uses when computing the layout.
const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

interface NodeColor {
    background: string;
    border: string;
}

// Raw hex values — React Flow node styles are plain CSS, so Chakra theme tokens don't resolve here.
const NODE_COLORS: Record<'default' | 'error' | 'completed' | 'selected', NodeColor> = {
    default: { background: 'white', border: '#cbd5e1' }, // white / gray.300
    error: { background: '#fee2e2', border: '#db6015' }, // red.50 / veeva_sunset_red_color_mode
    completed: { background: '#dcfce3', border: '#2F855A' }, // green.50 / veeva_green_pasture_color_mode
    selected: { background: '#fff2dc', border: '#f7981d' }, // beige_color_mode / veeva_orange_color_mode
};
const NODE_TEXT_COLOR = '#1b2f54'; // veeva_midnight_indigo
const NODE_SELECTED_RING = '#f7981d'; // veeva_orange_color_mode
const EDGE_COLOR = '#94a3b8'; // slate.400

/**
 * Builds the unpositioned React Flow nodes and edges for a workflow's steps:
 * - one node per step item, colored by state (selected wins, then error, then completed, else default);
 * - one edge per "Next step: X" / "Workflow roll back to X" reference found in a step's log results,
 *   but only when X matches a known step (so we never produce an edge to a missing node).
 * Positions are all (0,0) here — `applyDagreLayout` assigns real positions via dagre.
 *
 * The returned objects are React Flow's `Node` / `Edge` shapes:
 * @see https://reactflow.dev/api-reference/types/node
 * @see https://reactflow.dev/api-reference/types/edge
 */
export function buildProcessGraph(
    groupedLogItems: GroupedLogItem[],
    selectedLogItemId?: string,
): { nodes: Node[]; edges: Edge[] } {
    const stepItems = groupedLogItems.filter((item) => item.isStep);
    const stepNames = new Set(stepItems.map((item) => item.name));

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    stepItems.forEach((item) => {
        const isSelected = item.id === selectedLogItemId;

        // Color precedence: a selected node always wins; otherwise error, then completed, else default.
        let nodeColor = NODE_COLORS.default;
        if (item.hasError) {
            nodeColor = NODE_COLORS.error;
        } else if (item.isCompleted) {
            nodeColor = NODE_COLORS.completed;
        }
        if (isSelected) {
            nodeColor = NODE_COLORS.selected;
        }

        nodes.push({
            id: item.name,
            data: { label: item.name },
            position: { x: 0, y: 0 },
            style: {
                background: nodeColor.background,
                border: `2px solid ${nodeColor.border}`,
                borderRadius: '8px',
                width: NODE_WIDTH,
                fontWeight: 'bold',
                fontSize: '12px',
                color: NODE_TEXT_COLOR,
                boxShadow: isSelected ? `0 0 0 2px ${NODE_SELECTED_RING}` : 'none',
            },
        });

        // Each log line may name the step it transitions to; the regex is case-insensitive and run on
        // the original text so the captured name keeps its casing and matches a node id (the step name).
        item.logs.forEach((log) => {
            if (!log.result) return;

            const nextStepMatch = log.result.match(/next step:\s*([^\s,]+)/i);
            const rollbackMatch = log.result.match(/workflow roll back to\s*([^\s,]+)/i);
            const nextStepName = rollbackMatch?.[1] ?? nextStepMatch?.[1] ?? null;

            if (nextStepName && stepNames.has(nextStepName)) {
                edges.push({
                    id: `e-${item.name}-${nextStepName}`,
                    source: item.name,
                    target: nextStepName,
                    // 'smoothstep' is one of React Flow's built-in edge types: https://reactflow.dev/examples/edges/edge-types
                    type: 'smoothstep',
                    // markerEnd draws the arrowhead; MarkerType enumerates the shapes: https://reactflow.dev/api-reference/types/marker-type
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: EDGE_COLOR,
                    },
                    style: { stroke: EDGE_COLOR, strokeWidth: 2 },
                    animated: item.hasError,
                });
            }
        });
    });

    return { nodes, edges };
}

/**
 * Runs dagre's auto-layout for the given direction and returns the nodes with computed (x, y)
 * positions and the correct handle sides (left/right when horizontal, top/bottom when vertical).
 * Edges are returned unchanged (React Flow draws them from the node positions). A fresh dagre graph
 * is created each call so no stale nodes carry over between layouts.
 *
 * The graph object and its setGraph/setNode/setEdge/layout methods come from graphlib (bundled with
 * dagre); the source/target handle sides use React Flow's `Position` enum:
 * @see https://github.com/dagrejs/graphlib/wiki/API-Reference
 * @see https://reactflow.dev/api-reference/types/position
 */
export function applyDagreLayout(
    nodes: Node[],
    edges: Edge[],
    direction: GraphLayoutDirection,
): { nodes: Node[]; edges: Edge[] } {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === LEFT_TO_RIGHT;
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const positionedNodes = nodes.map((node) => {
        // dagre positions are the node's center; React Flow expects the top-left corner.
        const nodeWithPosition = dagreGraph.node(node.id);
        const positionedNode: Node = {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - NODE_WIDTH / 2,
                y: nodeWithPosition.y - NODE_HEIGHT / 2,
            },
        };
        return positionedNode;
    });

    return { nodes: positionedNodes, edges };
}

/**
 * Finds the step whose graph-node id (the step name) matches the given node id.
 */
export function findStepByNodeId(groupedLogItems: GroupedLogItem[], nodeId: string): GroupedLogItem | undefined {
    return groupedLogItems.find((item) => item.isStep && item.name === nodeId);
}
