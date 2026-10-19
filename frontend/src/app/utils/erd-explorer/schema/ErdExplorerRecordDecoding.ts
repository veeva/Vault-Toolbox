/**
 * Validates untrusted object records and picker summaries back into typed values. Shared by the session
 * cache and the project file so there is one definition of what a valid blob looks like.
 */

import type { ErdField, ErdObjectRecord, ErdObjectSummary, ErdRelationship } from '../ErdExplorerTypes';

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);

/** Read a `name -> record` map, dropping any entry whose shape cannot be trusted. */
export function readObjectRecords(raw: unknown): Record<string, ErdObjectRecord> {
    const records: Record<string, ErdObjectRecord> = {};
    if (!isPlainObject(raw)) return records;
    for (const [objectName, value] of Object.entries(raw)) {
        if (!isPlainObject(value)) continue;
        if (!Array.isArray(value.fields) || !Array.isArray(value.relationships)) continue;
        records[objectName] = {
            status: 'ready',
            fields: value.fields as ErdField[],
            relationships: value.relationships as ErdRelationship[],
            objectClass: typeof value.objectClass === 'string' ? value.objectClass : undefined,
            description: typeof value.description === 'string' ? value.description : undefined,
            partial: value.partial === true ? true : undefined,
            missingFromVault: value.missingFromVault === true ? true : undefined,
        };
    }
    return records;
}

/** Read picker summaries, dropping any entry without a name. */
export function readObjectSummaries(raw: unknown): ErdObjectSummary[] {
    if (!Array.isArray(raw)) return [];
    const objectList: ErdObjectSummary[] = [];
    for (const value of raw) {
        if (!isPlainObject(value) || typeof value.name !== 'string') continue;
        objectList.push({
            name: value.name,
            label: typeof value.label === 'string' ? value.label : value.name,
            labelPlural: typeof value.labelPlural === 'string' ? value.labelPlural : undefined,
            source: typeof value.source === 'string' ? value.source : 'unknown',
        });
    }
    return objectList;
}
