import { type Node } from '@xyflow/react';
import { gridPosition, hasSameStringArray, isExternalTarget } from '../ErdExplorerHelper';
import { userGroupTargetsFromFields } from './ErdExplorerEdgeHelpers';
import {
    DOCUMENTS_TARGET,
    ERD_EXTERNAL_NODE_TYPE,
    ERD_OBJECT_NODE_TYPE,
    type ErdField,
    type ErdHighlightDirection,
    type ErdObjectRecord,
    type ErdObjectSummary,
    type ErdPositionMap,
    type ErdRelationship,
} from '../ErdExplorerTypes';

interface CachedObjectNodeData {
    record?: ErdObjectRecord;
    summary?: ErdObjectSummary;
    showSourceBadge?: boolean;
    highlight?: ErdHighlightDirection;
    visibleFieldNames?: string[];
}

export interface BuildRfNodesParams {
    positionsChanged: boolean;
    positions: ErdPositionMap;
    placedObjects: string[];
    records: Record<string, ErdObjectRecord>;
    includeDocuments: boolean;
    includeUsersGroups: boolean;
    showSourceBadges: boolean;
    hiddenJoinNames: Set<string>;
    relationshipsByObject: Record<string, ErdRelationship[]>;
    fieldsByObject: Record<string, ErdField[]>;
    highlightByNode: Map<string, ErdHighlightDirection>;
    summaryByName: Map<string, ErdObjectSummary>;
    resolveVisibleFieldNames: (name: string) => string[];
    retryObject: (name: string) => void;
    openObjectDialog: (name: string) => void;
}

/** Derives all React Flow nodes from the current canvas + record state. Pure — no React. */
export function buildRfNodes(previousNodes: Node[], params: BuildRfNodesParams): Node[] {
    const {
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
    } = params;

    const externalTargetNames = new Set<string>();
    placedObjects.forEach((name) => {
        (relationshipsByObject[name] ?? []).forEach((relationship) => {
            if (relationship.direction !== 'outbound') return;
            if (!isExternalTarget(relationship.target)) return;
            if (relationship.target === DOCUMENTS_TARGET && !includeDocuments) return;
            if (relationship.target !== DOCUMENTS_TARGET && !includeUsersGroups) return;
            externalTargetNames.add(relationship.target);
        });
    });
    if (includeUsersGroups) {
        userGroupTargetsFromFields(placedObjects, fieldsByObject).forEach((target) =>
            externalTargetNames.add(target),
        );
    }
    placedObjects.forEach((name) => {
        if (isExternalTarget(name)) externalTargetNames.add(name);
    });

    const placedSet = new Set(placedObjects);
    const previousById = new Map(previousNodes.map((node) => [node.id, node]));

    const resolveNodePosition = (nodeId: string, fallbackIndex: number) => {
        if (positionsChanged && positions[nodeId]) return positions[nodeId];
        return previousById.get(nodeId)?.position ?? positions[nodeId] ?? gridPosition(fallbackIndex);
    };

    const visiblePlacedNames = placedObjects.filter(
        (name) => !hiddenJoinNames.has(name) && !isExternalTarget(name),
    );
    const objectNodes: Node[] = visiblePlacedNames.map((name, index) => {
        const record = records[name] as ErdObjectRecord | undefined;
        const visibleFieldNameSet = new Set(resolveVisibleFieldNames(name));
        const visibleFieldNames = (record?.fields ?? [])
            .filter((field) => visibleFieldNameSet.has(field.name))
            .map((field) => field.name);
        const summary = summaryByName.get(name);
        const highlight = highlightByNode.get(name);
        const position = resolveNodePosition(name, index);
        const selected = previousById.get(name)?.selected ?? false;

        const previousNode = previousById.get(name);
        if (previousNode && previousNode.type === ERD_OBJECT_NODE_TYPE) {
            const previousNodeData = previousNode.data as unknown as CachedObjectNodeData;
            if (
                previousNode.position.x === position.x &&
                previousNode.position.y === position.y &&
                (previousNode.selected ?? false) === selected &&
                previousNodeData.record === record &&
                previousNodeData.summary === summary &&
                previousNodeData.showSourceBadge === showSourceBadges &&
                previousNodeData.highlight === highlight &&
                hasSameStringArray(previousNodeData.visibleFieldNames ?? [], visibleFieldNames)
            ) {
                return previousNode;
            }
        }

        return {
            id: name,
            type: ERD_OBJECT_NODE_TYPE,
            position,
            selected,
            zIndex: highlight ? 5 : 2,
            data: {
                summary,
                record,
                visibleFieldNames,
                showSourceBadge: showSourceBadges,
                highlight,
                onRetry: () => retryObject(name),
                onOpenDialog: () => openObjectDialog(name),
            },
        };
    });

    let externalNodeIndex = placedObjects.length;
    for (const externalTargetName of externalTargetNames) {
        if (placedSet.has(externalTargetName) && !isExternalTarget(externalTargetName)) continue;
        const externalHighlight = highlightByNode.get(externalTargetName);
        const externalSelected = previousById.get(externalTargetName)?.selected ?? false;
        objectNodes.push({
            id: externalTargetName,
            type: ERD_EXTERNAL_NODE_TYPE,
            position: resolveNodePosition(externalTargetName, externalNodeIndex++),
            zIndex: externalHighlight ? 5 : externalSelected ? 3 : 2,
            selected: externalSelected,
            data: { target: externalTargetName, highlight: externalHighlight },
        });
    }
    const seenNodeIds = new Set<string>();
    return objectNodes.filter((node) => {
        if (seenNodeIds.has(node.id)) return false;
        seenNodeIds.add(node.id);
        return true;
    });
}
