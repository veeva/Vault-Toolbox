import { useEffect, type RefObject } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { type Node } from '@xyflow/react';
import { buildRfNodes, type BuildRfNodesParams } from '../../../utils/erd-explorer/graph/ErdExplorerNodeHelpers';
import type { ErdPositionMap } from '../../../utils/erd-explorer/ErdExplorerTypes';

interface UseErdNodesParams extends Omit<BuildRfNodesParams, 'positionsChanged'> {
    setNodes: Dispatch<SetStateAction<Node[]>>;
    isDraggingRef: RefObject<boolean>;
    prevPositionsRef: RefObject<ErdPositionMap>;
}

/** Derives and sets the React Flow nodes from the current canvas + record state. */
export function useErdNodes({
    placedObjects,
    positions,
    records,
    includeDocuments,
    includeUsersGroups,
    showSourceBadges,
    hiddenJoinNames,
    relationshipsByObject,
    fieldsByObject,
    highlightByNode,
    summaryByName,
    resolveVisibleFieldNames,
    retryObject,
    openObjectDialog,
    setNodes,
    isDraggingRef,
    prevPositionsRef,
}: UseErdNodesParams) {
    useEffect(() => {
        if (isDraggingRef.current) {
            prevPositionsRef.current = positions;
            return;
        }
        const positionsChanged = prevPositionsRef.current !== positions;
        prevPositionsRef.current = positions;

        setNodes((previousNodes) =>
            buildRfNodes(previousNodes, {
                positionsChanged,
                positions,
                placedObjects,
                records,
                includeDocuments,
                includeUsersGroups,
                showSourceBadges,
                hiddenJoinNames,
                relationshipsByObject,
                fieldsByObject,
                highlightByNode,
                summaryByName,
                resolveVisibleFieldNames,
                retryObject,
                openObjectDialog,
            }),
        );
    }, [
        placedObjects,
        records,
        includeDocuments,
        includeUsersGroups,
        showSourceBadges,
        hiddenJoinNames,
        relationshipsByObject,
        fieldsByObject,
        highlightByNode,
        positions,
        summaryByName,
        resolveVisibleFieldNames,
        retryObject,
        openObjectDialog,
        setNodes,
        isDraggingRef,
        prevPositionsRef,
    ]);
}
