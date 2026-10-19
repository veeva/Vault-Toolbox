import { useEffect } from 'react';
import type { Edge } from '@xyflow/react';
import { buildRfEdges, type BuildRfEdgesParams } from '../../../utils/erd-explorer/graph/ErdExplorerEdgeHelpers';

type UseErdEdgesParams = BuildRfEdgesParams & {
    setEdges: (edges: Edge[]) => void;
};

/** Derives and sets the React Flow edges from the current canvas + relationship state. */
export function useErdEdges({
    placedObjects,
    relationshipsByObject,
    fieldsByObject,
    records,
    includeDocuments,
    includeUsersGroups,
    colorCodeEdges,
    showRelationshipLineLabels,
    edgeColors,
    hiddenJoinNames,
    joinInfoByName,
    highlightAnchor,
    setEdges,
}: UseErdEdgesParams) {
    useEffect(() => {
        setEdges(buildRfEdges({
            placedObjects,
            relationshipsByObject,
            fieldsByObject,
            records,
            includeDocuments,
            includeUsersGroups,
            colorCodeEdges,
            showRelationshipLineLabels,
            edgeColors,
            hiddenJoinNames,
            joinInfoByName,
            highlightAnchor,
        }));
    }, [
        placedObjects,
        relationshipsByObject,
        fieldsByObject,
        includeDocuments,
        includeUsersGroups,
        colorCodeEdges,
        showRelationshipLineLabels,
        hiddenJoinNames,
        joinInfoByName,
        edgeColors,
        highlightAnchor,
        records,
        setEdges,
    ]);
}
