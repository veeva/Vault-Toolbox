/**
 * Caches the derived object schema in per-tab session storage so reopening the ERD Explorer in the same
 * tab costs nothing. Only objects, fields and relationships are stored — never the raw MDL, and never
 * the canvas.
 *
 * No Vault key is needed, and that rests on an invariant worth stating: `useLogout` (the Logout button
 * in Sidebar.tsx) is the only route to a second Vault within one tab, and it calls
 * `sessionStorage.clear()`. Session expiry does not sign the user out — `isLoggedIn` stays true and
 * calls fail with INVALID_SESSION_ID — so no stale Vault's schema can survive into a new login here.
 * Adding auto-logout-on-expiry or an in-session Vault switcher would break this and require a key.
 */

import { isPlainObject, readObjectRecords, readObjectSummaries } from './ErdExplorerRecordDecoding';
import type { ErdObjectRecord, ErdObjectSummary } from '../ErdExplorerTypes';

const SCHEMA_STORAGE_KEY = 'erdExplorerSchema';

/** The whole-Vault schema as the ERD Explorer holds it: one record per object, plus the picker list. */
export interface ErdSchemaSnapshot {
    records: Record<string, ErdObjectRecord>;
    objectList: ErdObjectSummary[];
}

/** The storable form of a snapshot: only settled records, since a cached error would never clear. */
export function serializeSchema(snapshot: ErdSchemaSnapshot): ErdSchemaSnapshot {
    const records: Record<string, ErdObjectRecord> = {};
    for (const [objectName, record] of Object.entries(snapshot.records)) {
        if (record.status !== 'ready') continue;
        records[objectName] = record;
    }
    return { records, objectList: snapshot.objectList };
}

/** Validate an untrusted blob back into a snapshot, or null when it is unusable. */
export function deserializeSchema(raw: unknown): ErdSchemaSnapshot | null {
    if (!isPlainObject(raw)) return null;
    if (!isPlainObject(raw.records) || !Array.isArray(raw.objectList)) return null;
    return { records: readObjectRecords(raw.records), objectList: readObjectSummaries(raw.objectList) };
}

/** Read the cached schema for this tab, or null when there is none and when it cannot be trusted. */
export function readSchemaCache(): ErdSchemaSnapshot | null {
    try {
        const stored = sessionStorage.getItem(SCHEMA_STORAGE_KEY);
        return stored ? deserializeSchema(JSON.parse(stored)) : null;
    } catch {
        return null;
    }
}

/**
 * Cache the schema for the rest of this tab's session. One write, so it lands whole or not at all —
 * nothing is shed to make it fit, because a partial schema would read back as a complete one.
 */
export function writeSchemaCache(snapshot: ErdSchemaSnapshot): void {
    try {
        sessionStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(serializeSchema(snapshot)));
    } catch {
        // Out of quota, or storage unavailable. The in-memory schema is unaffected.
    }
}
