/**
 * Turns parsed object MDL plus the object list into the ERD Explorer's record map. Pure and free of any
 * API import so it tests without a network, a renderer or a browser.
 */

import { isExternalTarget, relationshipKey } from '../ErdExplorerHelper';
import { deriveAllRelationships, type ParsedObjectMdl } from './ErdExplorerMdlParsing';
import type { ErdField, ErdObjectRecord, ErdObjectSummary } from '../ErdExplorerTypes';

/**
 * One record per object. Objects whose MDL parsed get their real fields; the rest get a `partial`
 * placeholder carrying the inbound relationships derived from the objects that point at them.
 */
export function buildSchemaRecords(
    parsedByObject: Map<string, ParsedObjectMdl>,
    objectList: ErdObjectSummary[],
): Record<string, ErdObjectRecord> {
    const fieldsByObject = new Map<string, ErdField[]>();
    for (const [objectName, parsedObject] of parsedByObject) {
        fieldsByObject.set(objectName, parsedObject.fields);
    }
    const relationshipsByObject = deriveAllRelationships(fieldsByObject);

    const records: Record<string, ErdObjectRecord> = {};
    for (const [objectName, parsedObject] of parsedByObject) {
        records[objectName] = {
            status: 'ready',
            fields: parsedObject.fields,
            relationships: relationshipsByObject.get(objectName) ?? [],
            objectClass: parsedObject.objectClass,
            description: parsedObject.description,
        };
    }

    for (const objectSummary of objectList) {
        if (records[objectSummary.name]) continue;
        records[objectSummary.name] = {
            status: 'ready',
            fields: [],
            relationships: relationshipsByObject.get(objectSummary.name) ?? [],
            partial: true,
        };
    }

    return records;
}

/**
 * Fold a per-object fetch into the placeholder it replaces, keeping the relationships the schema derived.
 * The object-metadata endpoint returns no inbound entries for objects that have no MDL of their own.
 */
export function mergeEnrichedRecord(
    fetchedRecord: ErdObjectRecord,
    placeholderRecord: ErdObjectRecord | undefined,
): ErdObjectRecord {
    if (fetchedRecord.status !== 'ready' || !placeholderRecord) return fetchedRecord;

    const alreadyPresent = new Set(fetchedRecord.relationships.map(relationshipKey));
    const missing = placeholderRecord.relationships.filter(
        (relationship) => !alreadyPresent.has(relationshipKey(relationship)),
    );
    if (missing.length === 0) return fetchedRecord;

    return { ...fetchedRecord, relationships: [...fetchedRecord.relationships, ...missing] };
}

interface SettleRecordsInput {
    /** Records held outside the schema: imported from a project file, or fetched per object. */
    heldRecords: Record<string, ErdObjectRecord>;
    schemaRecords: Record<string, ErdObjectRecord>;
    placedObjects: string[];
}

/**
 * Settle the held records against a schema that has just landed. The live schema is authoritative, so
 * anything it knows in full supersedes the held copy, and anything it has never heard of is no longer in
 * this Vault — including a placed object the schema used to have and a reload has dropped.
 */
export function settleRecordsAgainstSchema({
    heldRecords,
    schemaRecords,
    placedObjects,
}: SettleRecordsInput): Record<string, ErdObjectRecord> {
    const settled: Record<string, ErdObjectRecord> = {};

    for (const [objectName, heldRecord] of Object.entries(heldRecords)) {
        const schemaRecord = schemaRecords[objectName];
        if (schemaRecord && !schemaRecord.partial) continue;
        // A request still running, or one that already failed, is not ours to reinterpret.
        if (!schemaRecord && heldRecord.status === 'ready') {
            settled[objectName] = { ...heldRecord, partial: true, missingFromVault: true };
            continue;
        }
        settled[objectName] = heldRecord;
    }

    // A placed object the schema has no record for was placed from a schema that has since dropped it.
    // It keeps its node rather than vanishing, and is flagged so nothing tries to fetch it.
    for (const objectName of placedObjects) {
        if (settled[objectName] || schemaRecords[objectName] || isExternalTarget(objectName)) continue;
        settled[objectName] = {
            status: 'ready',
            fields: [],
            relationships: [],
            partial: true,
            missingFromVault: true,
        };
    }

    return settled;
}
