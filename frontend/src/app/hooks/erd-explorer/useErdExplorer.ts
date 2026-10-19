import { useCallback, useEffect, useRef, useState } from 'react';
import {
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    type ReactFlowInstance,
} from '@xyflow/react';
import { isExternalTarget } from '../../utils/erd-explorer/ErdExplorerHelper';
import { DOCUMENTS_TARGET } from '../../utils/erd-explorer/ErdExplorerTypes';
import useErdGraph from './useErdGraph';
import { useErdViewSettingsStorage } from './useErdViewSettingsStorage';
import useErdExplorerData from './useErdExplorerData';
import { useErdExports } from './data/useErdExports';
import { useErdEdges } from './canvas/useErdEdges';
import { useErdNodes } from './canvas/useErdNodes';
import { useErdFocusedObjectRelationships } from './relationships-dialog/useErdFocusedObjectRelationships';
import { useErdShiftKeyTracking } from './canvas/useErdShiftKeyTracking';
import { useErdPanToNewObjects } from './canvas/useErdPanToNewObjects';
import { useErdJoinAutoMaterialize } from './canvas/useErdJoinAutoMaterialize';
import { useErdSelectionHighlight } from './canvas/useErdSelectionHighlight';
import { useErdFieldVisibility } from './sidebar/useErdFieldVisibility';
import { useErdDerivedMaps } from './data/useErdDerivedMaps';
import { useErdCanvasActions } from './canvas/useErdCanvasActions';
import { useErdSelection } from './canvas/useErdSelection';
import type { PendingLayout } from './canvas/useErdLayout';

export type ErdSidebarTab = 'addObjects' | 'fields' | 'settings';

/**
 * Orchestrates the ERD Explorer: combines canvas membership (useErdGraph) with fetched metadata
 * (useErdExplorerData) and pure helpers into React Flow nodes/edges, plus the tabbed-sidebar state,
 * object relationships dialog, per-object field visibility, node sizing, and recursive expansion.
 *
 * The diagram itself is a working session: it lives as long as this hook is mounted and is never
 * persisted (saved/restored only via project export/import, see useErdExports). View settings
 * (view toggles + edge colours) are the exception — see useErdViewSettingsStorage.
 * All export/import functions live in useErdExports.
 * Recursive-add BFS logic lives in useErdRecursiveAdd.
 */
export default function useErdExplorer() {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    const [activeTab, setActiveTab] = useState<ErdSidebarTab>('addObjects');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [focusedObject, setFocusedObject] = useState<string | null>(null);
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
    const [objectDialogTarget, setObjectDialogTarget] = useState<string | null>(null);

    const graph = useErdGraph();
    const { placedObjects, positions, visibleFields, includeUsersGroups, viewSettings, edgeColors } = graph.state;

    useErdViewSettingsStorage({ viewSettings, edgeColors, hydrateViewSettings: graph.hydrateViewSettings });
    // Takes the placed set so a schema reload that drops a placed object can flag its node instead of
    // leaving it blank.
    const data = useErdExplorerData(placedObjects);

    // Documents is a placeable pseudo-object (added from the picker / found via search) rather than a
    // settings toggle: it shows exactly when the synthetic 'documents' node is on the canvas.
    const includeDocuments = placedObjects.includes(DOCUMENTS_TARGET);

    // After an add, holds the pending tidy so it only runs once the new objects have loaded +
    // measured: a recursive add scopes the reflow to {anchor, names} (existing nodes stay put), while
    // a sidebar add re-tidies the whole canvas (mode: 'full').
    const pendingLayoutRef = useRef<PendingLayout | null>(null);
    // Last-seen positions reference; a new reference means positions changed and the rebuild should
    // honour stored positions over live React Flow positions (makes undo actually move nodes back).
    const prevPositionsRef = useRef(positions);
    // The React Flow instance (captured via onInit) so the header search can pan/zoom to a node.
    const reactFlowRef = useRef<ReactFlowInstance<Node, Edge> | null>(null);
    // The canvas container DOM node, so the object relationships dialog can center itself over the
    // diagram instead of the whole page.
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    // Selecting a tab always expands the sidebar.
    const selectTab = useCallback((tab: ErdSidebarTab) => {
        setActiveTab(tab);
        setSidebarCollapsed(false);
    }, []);

    // ---- Record fetching ---------------------------------------------------------------------------

    // The schema covers almost every placed object. This fills in the rest: the objects Vault lists but
    // has no MDL for, and anything an expired-session error has just been forgotten for.
    const { ensureObjects, records } = data;
    useEffect(() => {
        ensureObjects(placedObjects.filter((name) => !isExternalTarget(name)));
    }, [placedObjects, records, ensureObjects]);

    // ---- Derived maps ------------------------------------------------------------------------------

    const {
        summaryByName,
        relationshipsByObject,
        fieldsByObject,
        joinInfoByName,
        hiddenJoinNames,
        addObjectsList,
        addObjectsNames,
        knownObjects,
        searchableObjects,
    } = useErdDerivedMaps({
        placedObjects,
        records: data.records,
        objectList: data.objectList,
        viewSettings,
    });

    // ---- Auto-materialize hidden join objects ------------------------------------------------------

    useErdJoinAutoMaterialize({
        schemaReady: data.schemaStatus === 'ready',
        hideSimpleJoins: viewSettings.hideSimpleJoinObjects,
        hideComplexJoins: viewSettings.hideComplexJoinObjects,
        placedObjects,
        joinInfoByName,
        relationshipsByObject,
        ensureObjectAsync: data.ensureObjectAsync,
        addJoinObjects: graph.addJoinObjects,
    });

    // ---- Pan to newly-added objects ----------------------------------------------------------------

    useErdPanToNewObjects({ placedObjects, reactFlowRef });

    // ---- Adjacency + highlight ---------------------------------------------------------------------

    const { highlightAnchor, highlightByNode } = useErdSelectionHighlight({
        placedObjects,
        relationshipsByObject,
        fieldsByObject,
        includeDocuments,
        includeUsersGroups,
        hiddenJoinNames,
        joinInfoByName,
        selectedNodeIds,
    });

    // ---- Field visibility --------------------------------------------------------------------------

    const { resolveVisibleFieldNames, toggleField, setFieldsForObject, visibleFieldSetFor } = useErdFieldVisibility({
        records: data.records,
        visibleFields,
        setVisibleFields: graph.setVisibleFields,
    });

    // ---- Edge builder ------------------------------------------------------------------------------

    useErdEdges({
        placedObjects,
        relationshipsByObject,
        fieldsByObject,
        records: data.records,
        includeDocuments,
        includeUsersGroups,
        colorCodeEdges: viewSettings.colorCodeEdges,
        showRelationshipLineLabels: viewSettings.showRelationshipLineLabels,
        edgeColors,
        hiddenJoinNames,
        joinInfoByName,
        highlightAnchor,
        setEdges,
    });

    // ---- Node builder ------------------------------------------------------------------------------

    const selection = useErdSelection({
        nodes,
        setNodes,
        selectedNodeIds,
        setSelectedNodeIds,
        setFocusedObject,
        setObjectDialogTarget,
        graph,
        records: data.records,
    });

    const openObjectDialog = useCallback((name: string) => setObjectDialogTarget(name), []);

    useErdNodes({
        placedObjects,
        positions,
        records: data.records,
        includeDocuments,
        includeUsersGroups,
        showSourceBadges: viewSettings.showSourceBadges,
        hiddenJoinNames,
        relationshipsByObject,
        fieldsByObject,
        highlightByNode,
        summaryByName,
        resolveVisibleFieldNames,
        retryObject: data.retryObject,
        openObjectDialog,
        setNodes,
        isDraggingRef: selection.isDraggingRef,
        prevPositionsRef,
    });

    // ---- Canvas actions ----------------------------------------------------------------------------

    const canvasActions = useErdCanvasActions({
        graph,
        edges,
        nodes,
        setNodes,
        setSelectedNodeIds,
        setFocusedObject,
        setObjectDialogTarget,
        pendingLayoutRef,
        reactFlowRef,
        records: data.records,
        activeTab,
        sidebarCollapsed,
        setSidebarCollapsed,
        selectTab,
        knownObjects,
        addObjectsNames,
        includeUsersGroups,
        ensureObjectAsync: data.ensureObjectAsync,
    });

    useErdShiftKeyTracking({ shiftHeldRef: selection.shiftHeldRef });

    const closeObjectDialog = useCallback(() => setObjectDialogTarget(null), []);

    // ---- Object dialog relationships ------------------------------------------------------------------

    const objectDialogRelationships = useErdFocusedObjectRelationships({
        objectName: objectDialogTarget, records: data.records, placedObjects, includeUsersGroups, knownObjects, addObjectsNames,
    });

    // ---- Exports ----------------------------------------------------------------------------------

    const {
        exportProject,
        applyProject,
        exportMarkdown,
        exportPng,
        exportSvg,
        pendingImportProject,
        handleProjectImport,
        confirmImport,
        cancelImport,
    } = useErdExports({
        placedObjects,
        records: data.records,
        objectList: data.objectList,
        schemaRecords: data.schemaRecords,
        schemaStatus: data.schemaStatus,
        applyImportedSchema: data.applyImportedSchema,
        resolveVisibleFieldNames,
        edges,
        setNodes,
        setSelectedNodeIds,
        reactFlowRef,
        graphState: graph.state,
        applyProjectToGraph: graph.applyProject,
        showRelationshipLineLabels: viewSettings.showRelationshipLineLabels,
    });

    // ---- Return ------------------------------------------------------------------------------------

    return {
        objectList: addObjectsList,
        hiddenJoinNames,
        schemaStatus: data.schemaStatus,
        schemaError: data.schemaError,
        schemaProgress: data.schemaProgress,
        reloadSchema: data.reloadSchema,
        ensureObject: data.ensureObject,
        records: data.records,
        summaryByName,
        singleSelectedObject: highlightAnchor,
        placedObjects,
        objectCount: placedObjects.filter((name) => !hiddenJoinNames.has(name) && !isExternalTarget(name)).length,
        relationshipCount: edges.length,
        removeObject: graph.removeObject,
        retryObject: data.retryObject,
        undo: graph.undo,
        redo: graph.redo,
        canUndo: graph.canUndo,
        canRedo: graph.canRedo,
        viewSettings,
        setViewSetting: graph.setViewSetting,
        edgeColors,
        setEdgeColor: graph.setEdgeColor,
        restoreViewSettingsDefaults: graph.restoreViewSettingsDefaults,
        exportProject,
        applyProject,
        exportMarkdown,
        exportPng,
        exportSvg,
        pendingImportProject,
        handleProjectImport,
        confirmImport,
        cancelImport,
        getRelationships: canvasActions.getRelationships,
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onNodeClick: canvasActions.onNodeClick,
        onNodesDelete: canvasActions.onNodesDelete,
        onNodeDragStart: selection.onNodeDragStart,
        onNodeDragStop: selection.onNodeDragStop,
        onSelectionChange: selection.onSelectionChange,
        onSelectionStart: selection.onSelectionStart,
        onSelectionEnd: selection.onSelectionEnd,
        onInit: canvasActions.onInit,
        searchableObjects,
        focusObject: canvasActions.focusObject,
        clearCanvas: canvasActions.clearCanvas,
        selectedNodeIds,
        selectAll: selection.selectAll,
        deleteSelected: selection.deleteSelected,
        setFieldsForSelected: selection.setFieldsForSelected,
        tidyLayout: canvasActions.tidyLayout,
        activeTab,
        selectTab,
        toggleSidebarTab: canvasActions.toggleSidebarTab,
        sidebarCollapsed,
        setSidebarCollapsed,
        addObjects: canvasActions.addObjects,
        changeObject: canvasActions.changeObject,
        pendingSwap: canvasActions.pendingSwap,
        cancelSwap: canvasActions.cancelSwap,
        addRelatedRecursive: canvasActions.addRelatedRecursive,
        pendingRecursiveConfirm: canvasActions.pendingRecursiveConfirm,
        confirmRecursiveAdd: canvasActions.confirmRecursiveAdd,
        cancelRecursiveAdd: canvasActions.cancelRecursiveAdd,
        focusedObject,
        toggleField,
        setFieldsForObject,
        visibleFieldSetFor,
        objectDialogTarget,
        objectDialogRelationships,
        closeObjectDialog,
        canvasContainerRef,
    };
}
