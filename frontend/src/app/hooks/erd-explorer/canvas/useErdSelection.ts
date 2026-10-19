import { useCallback, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { type Node, type OnNodeDrag, type OnSelectionChangeParams } from '@xyflow/react';
import { isExternalTarget, isUsersGroupsTarget, relationshipsOnlyFieldNames } from '../../../utils/erd-explorer/ErdExplorerHelper';
import type { ErdPositionMap } from '../../../utils/erd-explorer/ErdExplorerTypes';
import type { ErdObjectRecord } from '../useErdExplorerData';
import type useErdGraph from '../useErdGraph';

/** What the bulk field-visibility buttons set the selected objects' fields to. */
export type BulkFieldMode = 'relationships' | 'all' | 'none';

interface UseErdSelectionParams {
    nodes: Node[];
    setNodes: Dispatch<SetStateAction<Node[]>>;
    selectedNodeIds: string[];
    setSelectedNodeIds: Dispatch<SetStateAction<string[]>>;
    setFocusedObject: Dispatch<SetStateAction<string | null>>;
    setObjectDialogTarget: Dispatch<SetStateAction<string | null>>;
    graph: ReturnType<typeof useErdGraph>;
    records: Record<string, ErdObjectRecord>;
}

/**
 * Multi-select and drag handlers: box-select shift-union, selectAll, deleteSelected,
 * bulk field visibility, and node drag commit.
 */
export function useErdSelection({
    nodes,
    setNodes,
    selectedNodeIds,
    setSelectedNodeIds,
    setFocusedObject,
    setObjectDialogTarget,
    graph,
    records,
}: UseErdSelectionParams) {
    const isDraggingRef = useRef(false);
    const boxSelectingRef = useRef(false);
    const selectionRef = useRef<string[]>([]);
    const shiftHeldRef = useRef(false);

    const onSelectionStart = useCallback(() => { boxSelectingRef.current = true; }, []);
    const onSelectionEnd = useCallback(() => {
        window.setTimeout(() => { boxSelectingRef.current = false; }, 0);
    }, []);

    const onSelectionChange = useCallback(
        (params: OnSelectionChangeParams) => {
            const ids = params.nodes.filter((node) => !isUsersGroupsTarget(node.id)).map((node) => node.id);
            if (boxSelectingRef.current && shiftHeldRef.current && selectionRef.current.length > 0) {
                const union = Array.from(new Set([...selectionRef.current, ...ids]));
                if (union.length !== ids.length) {
                    const unionSet = new Set(union);
                    setNodes((previous) =>
                        previous.map((node) => (unionSet.has(node.id) && !node.selected ? { ...node, selected: true } : node)),
                    );
                    selectionRef.current = union;
                    setSelectedNodeIds(union);
                    return;
                }
            }
            selectionRef.current = ids;
            setSelectedNodeIds(ids);
        },
        [setNodes, setSelectedNodeIds],
    );

    const selectAll = useCallback(() => {
        const selectableNodes = nodes.filter((node) => !isUsersGroupsTarget(node.id));
        const allSelected = selectableNodes.length > 0 && selectableNodes.every((node) => node.selected);
        setNodes((previous) => previous.map((node) => ({ ...node, selected: allSelected ? false : !isUsersGroupsTarget(node.id) })));
    }, [nodes, setNodes]);

    const deleteSelected = useCallback(() => {
        const names = selectedNodeIds.filter((nodeId) => !isExternalTarget(nodeId));
        if (names.length === 0) return;
        graph.removeObjects(names);
        setFocusedObject((current) => (names.includes(current ?? '') ? null : current));
        setSelectedNodeIds([]);
        setObjectDialogTarget(null);
    }, [selectedNodeIds, graph, setFocusedObject, setSelectedNodeIds, setObjectDialogTarget]);

    const setFieldsForSelected = useCallback(
        (mode: BulkFieldMode) => {
            const fieldEntries: Record<string, string[]> = {};
            selectedNodeIds.forEach((objectName) => {
                if (isExternalTarget(objectName)) return;
                const fields = records[objectName]?.fields ?? [];
                if (mode === 'none') fieldEntries[objectName] = [];
                else if (fields.length === 0) return;
                else if (mode === 'all') fieldEntries[objectName] = fields.map((field) => field.name);
                else fieldEntries[objectName] = relationshipsOnlyFieldNames(fields);
            });
            if (Object.keys(fieldEntries).length > 0) graph.setVisibleFieldsMany(fieldEntries);
            setObjectDialogTarget(null);
        },
        [selectedNodeIds, records, graph, setObjectDialogTarget],
    );

    const onNodeDragStart: OnNodeDrag = useCallback(() => { isDraggingRef.current = true; }, []);

    const onNodeDragStop: OnNodeDrag = useCallback(
        (_event, draggedNode, draggedNodes) => {
            isDraggingRef.current = false;
            if (draggedNodes.length > 1) {
                const positionsMap: ErdPositionMap = {};
                draggedNodes.forEach((node) => { positionsMap[node.id] = node.position; });
                graph.setPositions(positionsMap);
            } else {
                graph.setPosition(draggedNode.id, draggedNode.position);
            }
        },
        [graph],
    );

    return {
        isDraggingRef,
        shiftHeldRef,
        onSelectionStart,
        onSelectionEnd,
        onSelectionChange,
        selectAll,
        deleteSelected,
        setFieldsForSelected,
        onNodeDragStart,
        onNodeDragStop,
    };
}
