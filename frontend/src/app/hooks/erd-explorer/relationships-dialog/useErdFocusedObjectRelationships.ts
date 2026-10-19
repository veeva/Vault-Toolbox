import { useMemo } from 'react';
import { splitInboundOutbound } from '../../../utils/erd-explorer/ErdExplorerHelper';
import type { ErdRelationshipsByDirection, ErdRelationship } from '../../../utils/erd-explorer/ErdExplorerTypes';
import type { ErdObjectRecord } from '../useErdExplorerData';

interface UseErdFocusedObjectRelationshipsParams {
    objectName: string | null;
    records: Record<string, ErdObjectRecord>;
    placedObjects: string[];
    includeUsersGroups: boolean;
    knownObjects: Set<string>;
    addObjectsNames: Set<string>;
}

interface ErdFocusedObjectRelationshipsResult {
    record?: ErdObjectRecord;
    relationships: ErdRelationshipsByDirection | null;
}

/**
 * Derives the inbound/outbound relationships shown in the object relationships dialog.
 * Supplements the focused object's own relationship list with inbound entries discovered
 * from other placed objects so the dialog is complete even when the API omits inbound refs.
 * Documents always appear regardless of whether the Documents pseudo-object is placed.
 */
export function useErdFocusedObjectRelationships({
    objectName,
    records,
    placedObjects,
    includeUsersGroups,
    knownObjects,
    addObjectsNames,
}: UseErdFocusedObjectRelationshipsParams) {
    return useMemo((): ErdFocusedObjectRelationshipsResult | null => {
        if (!objectName) return null;
        const record = records[objectName];
        if (!record || record.status !== 'ready') return { record, relationships: null };

        let relationships = record.relationships;
        const supplementalInbound: ErdRelationship[] = [];
        for (const placedName of placedObjects) {
            if (placedName === objectName) continue;
            // Explicit annotation needed: TS can't otherwise resolve this indexed access without
            // circularly depending on itself (a second index into the same `records` map, inside a
            // function whose return type references the same record type).
            const placedRecord: ErdObjectRecord | undefined = records[placedName];
            if (!placedRecord || placedRecord.status !== 'ready') continue;
            for (const relationship of placedRecord.relationships) {
                if (relationship.direction === 'outbound' && relationship.target === objectName) {
                    supplementalInbound.push({ name: relationship.name, target: placedName, direction: 'inbound' });
                }
            }
        }
        if (supplementalInbound.length > 0) {
            const existingInboundKeys = new Set(
                relationships
                    .filter((relationship) => relationship.direction === 'inbound')
                    .map((relationship) => `${relationship.target}:${relationship.name}`),
            );
            const uniqueSupplemental = supplementalInbound.filter(
                (relationship) => !existingInboundKeys.has(`${relationship.target}:${relationship.name}`),
            );
            if (uniqueSupplemental.length > 0) relationships = [...relationships, ...uniqueSupplemental];
        }

        const visibleRelationships = splitInboundOutbound(relationships, {
            includeDocuments: true,
            includeUsersGroups,
            includeLifecycleObjects: true,
            selfName: objectName,
            knownObjects,
        });
        return {
            record,
            relationships: {
                inbound: visibleRelationships.inbound.filter((relationship) => addObjectsNames.has(relationship.target)),
                outbound: visibleRelationships.outbound.filter((relationship) => addObjectsNames.has(relationship.target)),
            },
        };
    }, [objectName, records, placedObjects, includeUsersGroups, knownObjects, addObjectsNames]);
}
