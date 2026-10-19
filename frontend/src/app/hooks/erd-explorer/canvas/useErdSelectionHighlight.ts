import { useMemo } from 'react';
import type { JoinObjectInfo } from '../../../utils/erd-explorer/ErdExplorerHelper';
import { isUsersGroupsTarget } from '../../../utils/erd-explorer/ErdExplorerHelper';
import {
    collapsedJoinsOf,
    deriveEdges,
    deriveJoinEdges,
    deriveUserGroupEdges,
} from '../../../utils/erd-explorer/graph/ErdExplorerEdgeHelpers';
import type { ErdField, ErdHighlightDirection, ErdRelationship } from '../../../utils/erd-explorer/ErdExplorerTypes';

interface UseErdSelectionHighlightParams {
    placedObjects: string[];
    relationshipsByObject: Record<string, ErdRelationship[]>;
    fieldsByObject: Record<string, ErdField[]>;
    includeDocuments: boolean;
    includeUsersGroups: boolean;
    hiddenJoinNames: Set<string>;
    joinInfoByName: Map<string, JoinObjectInfo>;
    selectedNodeIds: string[];
}

/**
 * Derives the adjacency map for all placed objects and the per-node highlight state for the
 * single-selection highlight feature (outbound = green, inbound = red).
 */
export function useErdSelectionHighlight({
    placedObjects,
    relationshipsByObject,
    fieldsByObject,
    includeDocuments,
    includeUsersGroups,
    hiddenJoinNames,
    joinInfoByName,
    selectedNodeIds,
}: UseErdSelectionHighlightParams) {
    const adjacency = useMemo(() => {
        const adjacencyMap = new Map<string, { out: Set<string>; in: Set<string> }>();
        const ensureEntry = (nodeId: string) => {
            let entry = adjacencyMap.get(nodeId);
            if (!entry) {
                entry = { out: new Set(), in: new Set() };
                adjacencyMap.set(nodeId, entry);
            }
            return entry;
        };
        const derivedEdges = deriveEdges(placedObjects, relationshipsByObject, {
            includeDocuments,
            includeUsersGroups,
            includeLifecycleObjects: true,
        });
        const userGroupEdges = deriveUserGroupEdges(placedObjects, fieldsByObject, { includeUsersGroups });
        [...derivedEdges, ...userGroupEdges].forEach((edge) => {
            if (edge.source === edge.target) return;
            if (hiddenJoinNames.has(edge.source) || hiddenJoinNames.has(edge.target)) return;
            ensureEntry(edge.source).out.add(edge.target);
            ensureEntry(edge.target).in.add(edge.source);
        });
        const visibleParentNames = new Set(placedObjects.filter((name) => !hiddenJoinNames.has(name)));
        deriveJoinEdges(collapsedJoinsOf(joinInfoByName, hiddenJoinNames), visibleParentNames).forEach((edge) => {
            ensureEntry(edge.source).out.add(edge.target);
            ensureEntry(edge.target).in.add(edge.source);
        });
        return adjacencyMap;
    }, [placedObjects, relationshipsByObject, fieldsByObject, includeDocuments, includeUsersGroups, hiddenJoinNames, joinInfoByName]);

    const highlightAnchor =
        selectedNodeIds.length === 1 && !isUsersGroupsTarget(selectedNodeIds[0]) ? selectedNodeIds[0] : null;

    const highlightByNode = useMemo(() => {
        const highlightMap = new Map<string, ErdHighlightDirection>();
        if (!highlightAnchor) return highlightMap;
        const adjacentNodes = adjacency.get(highlightAnchor);
        if (!adjacentNodes) return highlightMap;
        adjacentNodes.out.forEach((nodeId) => highlightMap.set(nodeId, 'out'));
        adjacentNodes.in.forEach((nodeId) => {
            if (!highlightMap.has(nodeId)) highlightMap.set(nodeId, 'in');
        });
        return highlightMap;
    }, [highlightAnchor, adjacency]);

    return { highlightAnchor, highlightByNode };
}
