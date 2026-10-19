import { useCallback, useState, type RefObject } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
    type Node,
    type Edge,
    type NodeMouseHandler,
    type OnNodesDelete,
    type ReactFlowInstance,
} from '@xyflow/react';
import { isExternalTarget, isUsersGroupsTarget, splitInboundOutbound } from '../../../utils/erd-explorer/ErdExplorerHelper';
import type { ErdObjectRecord } from '../useErdExplorerData';
import type { ErdSidebarTab } from '../useErdExplorer';
import type useErdGraph from '../useErdGraph';
import { useErdLayout, type PendingLayout } from './useErdLayout';
import { useErdRecursiveAdd } from '../relationships-dialog/useErdRecursiveAdd';

interface UseErdCanvasActionsParams {
    graph: ReturnType<typeof useErdGraph>;
    edges: Edge[];
    nodes: Node[];
    setNodes: Dispatch<SetStateAction<Node[]>>;
    setSelectedNodeIds: Dispatch<SetStateAction<string[]>>;
    setFocusedObject: Dispatch<SetStateAction<string | null>>;
    setObjectDialogTarget: Dispatch<SetStateAction<string | null>>;
    pendingLayoutRef: RefObject<PendingLayout | null>;
    reactFlowRef: RefObject<ReactFlowInstance<Node, Edge> | null>;
    records: Record<string, ErdObjectRecord>;
    activeTab: ErdSidebarTab;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: Dispatch<SetStateAction<boolean>>;
    selectTab: (tab: ErdSidebarTab) => void;
    knownObjects: Set<string>;
    addObjectsNames: Set<string>;
    includeUsersGroups: boolean;
    ensureObjectAsync: (name: string) => Promise<ErdObjectRecord>;
}

/**
 * Canvas action handlers: object add/remove/swap, tab navigation, layout, recursive expansion,
 * node/edge click events, and relationship lookup for the Add Objects picker.
 */
export function useErdCanvasActions({
    graph,
    edges,
    nodes,
    setNodes,
    setSelectedNodeIds,
    setFocusedObject,
    setObjectDialogTarget,
    pendingLayoutRef,
    reactFlowRef,
    records,
    activeTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    selectTab,
    knownObjects,
    addObjectsNames,
    includeUsersGroups,
    ensureObjectAsync,
}: UseErdCanvasActionsParams) {
    const [pendingSwap, setPendingSwap] = useState<string | null>(null);

    const onInit = useCallback((instance: ReactFlowInstance<Node, Edge>) => {
        reactFlowRef.current = instance;
    }, [reactFlowRef]);

    const clearCanvas = useCallback(() => {
        graph.clear();
        setSelectedNodeIds([]);
        reactFlowRef.current?.setCenter(150, 100, { zoom: 1, duration: 300 });
    }, [graph, setSelectedNodeIds, reactFlowRef]);

    const focusObject = useCallback(
        (objectId: string) => {
            const instance = reactFlowRef.current;
            const node = instance?.getNode(objectId);
            if (!instance || !node) return;
            const nodeWidth = node.measured?.width ?? 240;
            const nodeHeight = node.measured?.height ?? 120;
            instance.setCenter(node.position.x + nodeWidth / 2, node.position.y + nodeHeight / 2, {
                zoom: Math.max(instance.getZoom(), 0.8),
                duration: 400,
            });
            setNodes((previous) => previous.map((currentNode) => ({ ...currentNode, selected: currentNode.id === objectId })));
            setFocusedObject(objectId);
        },
        [reactFlowRef, setNodes, setFocusedObject],
    );

    const toggleSidebarTab = useCallback(
        (tab: ErdSidebarTab) => {
            if (tab === activeTab && !sidebarCollapsed) setSidebarCollapsed(true);
            else selectTab(tab);
        },
        [activeTab, sidebarCollapsed, selectTab, setSidebarCollapsed],
    );

    /**
     * Load each object's metadata before it is placed, so a join that collapses into a many-to-many
     * edge is never rendered as a node and then taken away.
     */
    const loadBeforePlacing = useCallback(
        (names: string[]) => Promise.all(names.filter((name) => !isExternalTarget(name)).map(ensureObjectAsync)),
        [ensureObjectAsync],
    );

    const addObjects = useCallback(
        async (names: string[]) => {
            await loadBeforePlacing(names);
            if (pendingSwap) {
                const swapPosition = graph.state.positions[pendingSwap];
                graph.removeObject(pendingSwap);
                graph.addObjects(names);
                if (swapPosition && names[0]) graph.setPosition(names[0], swapPosition);
                setPendingSwap(null);
            } else {
                // Mirrors the "Tidy" button: once the newly-placed objects have loaded + measured,
                // re-tidy the whole canvas rather than just scoping the reflow to the new cluster.
                pendingLayoutRef.current = { anchor: null, names, mode: 'full' };
                graph.addObjects(names);
            }
        },
        [graph, pendingSwap, pendingLayoutRef, loadBeforePlacing],
    );

    const changeObject = useCallback(
        (objectName: string) => {
            setPendingSwap(objectName);
            setObjectDialogTarget(null);
            selectTab('addObjects');
        },
        [selectTab, setObjectDialogTarget],
    );

    const cancelSwap = useCallback(() => setPendingSwap(null), []);

    const { tidyLayout } = useErdLayout({
        edges, nodes, graph, records, setNodes, pendingLayoutRef, reactFlowRef,
    });

    const commitRecursiveAdd = useCallback(
        async (seed: string, names: string[]) => {
            if (names.length === 0) return;
            await loadBeforePlacing(names);
            pendingLayoutRef.current = { anchor: seed, names };
            graph.addObjects(names);
        },
        [graph, pendingLayoutRef, loadBeforePlacing],
    );

    const { addRelatedRecursive, pendingRecursiveConfirm, confirmRecursiveAdd, cancelRecursiveAdd } = useErdRecursiveAdd({
        knownObjects,
        placedObjects: graph.state.placedObjects,
        ensureObjectAsync,
        onConfirmedAdd: commitRecursiveAdd,
        onClose: () => setObjectDialogTarget(null),
    });

    const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
        if (isExternalTarget(node.id)) return;
        setFocusedObject(node.id);
    }, [setFocusedObject]);

    const onNodesDelete: OnNodesDelete = useCallback(
        (deletedNodes) => {
            const names = deletedNodes.map((node) => node.id).filter((nodeId) => !isUsersGroupsTarget(nodeId));
            if (names.length > 0) graph.removeObjects(names);
            setFocusedObject((current) => (names.includes(current ?? '') ? null : current));
        },
        [graph, setFocusedObject],
    );

    const getRelationships = useCallback(
        (objectName: string) => {
            // Synthetic external targets (Documents/Users/Groups) are not Vault objects, so they have no
            // record to settle to 'ready' — without this they'd be stuck loading forever.
            if (isExternalTarget(objectName)) return { inbound: [], outbound: [] };
            const record = records[objectName];
            if (!record || record.status !== 'ready') return null;
            const visibleRelationships = splitInboundOutbound(record.relationships, {
                includeDocuments: true,
                includeUsersGroups,
                includeLifecycleObjects: false,
                selfName: objectName,
                knownObjects,
            });
            return {
                inbound: visibleRelationships.inbound.filter((relationship) => addObjectsNames.has(relationship.target)),
                outbound: visibleRelationships.outbound.filter((relationship) => addObjectsNames.has(relationship.target)),
            };
        },
        [records, includeUsersGroups, knownObjects, addObjectsNames],
    );

    return {
        pendingSwap,
        onInit,
        clearCanvas,
        focusObject,
        toggleSidebarTab,
        addObjects,
        changeObject,
        cancelSwap,
        tidyLayout,
        addRelatedRecursive,
        pendingRecursiveConfirm,
        confirmRecursiveAdd,
        cancelRecursiveAdd,
        onNodeClick,
        onNodesDelete,
        getRelationships,
    };
}
