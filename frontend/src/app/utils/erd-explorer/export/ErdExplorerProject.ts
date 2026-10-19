import {
    defaultEdgeColors,
    defaultViewSettings,
    type ErdEdgeColors,
    type ErdGraphState,
    type ErdProjectPayload,
    type ViewSettings,
} from '../../../hooks/erd-explorer/erdReducer';
import { pickByName, relationshipKey } from '../ErdExplorerHelper';
import { isPlainObject, readObjectRecords, readObjectSummaries } from '../schema/ErdExplorerRecordDecoding';
import type { ErdObjectRecord, ErdObjectSummary } from '../ErdExplorerTypes';

/**
 * A portable ERD Explorer "project file": a self-contained snapshot of a diagram. It carries the objects
 * and their layout, the display settings, and the object metadata needed to draw the nodes and edges — so
 * importing one renders the whole diagram with no Vault calls. Every file is stamped with the Vault it
 * came from, and importing into a different Vault is refused.
 */

export const ERD_PROJECT_VERSION = 2;

const PROJECT_KIND = 'vault-toolbox-erd-explorer';

/** Which Vault a project file was exported from. The name and DNS exist only for the mismatch message. */
export interface ErdProjectVaultStamp {
    vaultId: string;
    vaultName?: string;
    vaultDNS?: string;
}

export interface ErdProjectFile extends ErdProjectPayload, ErdProjectVaultStamp {
    version: number;
    /** Marker so we can recognise our own files and reject unrelated JSON. */
    kind: typeof PROJECT_KIND;
    /** Per-object metadata for the placed objects, so the diagram needs no Vault call to render. */
    records: Record<string, ErdObjectRecord>;
    /** Picker summaries for the placed objects, so nodes show their labels. */
    objectList: ErdObjectSummary[];
}

interface SerializeProjectInput {
    state: ErdGraphState;
    records: Record<string, ErdObjectRecord>;
    objectList: ErdObjectSummary[];
    vault: ErdProjectVaultStamp;
}

/** Build a project file from the current canvas, carrying metadata for the placed objects only. */
export function serializeProject({ state, records, objectList, vault }: SerializeProjectInput): ErdProjectFile {
    const objects = [...state.placedObjects];
    const placed = new Set(objects);

    const scopedRecords: Record<string, ErdObjectRecord> = {};
    for (const [objectName, record] of Object.entries(records)) {
        if (placed.has(objectName) && record.status === 'ready') scopedRecords[objectName] = record;
    }

    return {
        kind: PROJECT_KIND,
        version: ERD_PROJECT_VERSION,
        vaultId: vault.vaultId,
        vaultName: vault.vaultName,
        vaultDNS: vault.vaultDNS,
        objects,
        positions: pickByName(state.positions, objects),
        visibleFields: pickByName(state.visibleFields, objects),
        includeUsersGroups: state.includeUsersGroups,
        viewSettings: state.viewSettings,
        edgeColors: state.edgeColors,
        records: scopedRecords,
        objectList: objectList.filter((summary) => placed.has(summary.name)),
    };
}

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

/** Validate untrusted JSON into a project file, or return null if it is malformed or not our format. */
export function deserializeProject(raw: unknown): ErdProjectFile | null {
    if (!isPlainObject(raw)) return null;
    if (raw.kind !== PROJECT_KIND) return null;
    if (!isStringArray(raw.objects)) return null;
    // Required, never defaulted: without it there is no way to tell which Vault the diagram describes.
    if (typeof raw.vaultId !== 'string' || raw.vaultId === '') return null;

    return {
        kind: PROJECT_KIND,
        version: typeof raw.version === 'number' ? raw.version : ERD_PROJECT_VERSION,
        vaultId: raw.vaultId,
        vaultName: typeof raw.vaultName === 'string' ? raw.vaultName : undefined,
        vaultDNS: typeof raw.vaultDNS === 'string' ? raw.vaultDNS : undefined,
        objects: raw.objects,
        positions: readPositions(raw.positions),
        visibleFields: readVisibleFields(raw.visibleFields),
        includeUsersGroups: raw.includeUsersGroups === true,
        viewSettings: readViewSettings(raw.viewSettings),
        edgeColors: readEdgeColors(raw.edgeColors),
        records: readObjectRecords(raw.records),
        objectList: readObjectSummaries(raw.objectList),
    };
}

function readPositions(raw: unknown): Record<string, { x: number; y: number }> {
    const positions: Record<string, { x: number; y: number }> = {};
    if (!isPlainObject(raw)) return positions;
    for (const [objectName, value] of Object.entries(raw)) {
        if (!isPlainObject(value)) continue;
        if (typeof value.x !== 'number' || typeof value.y !== 'number') continue;
        positions[objectName] = { x: value.x, y: value.y };
    }
    return positions;
}

function readVisibleFields(raw: unknown): Record<string, string[]> {
    const visibleFields: Record<string, string[]> = {};
    if (!isPlainObject(raw)) return visibleFields;
    for (const [objectName, fields] of Object.entries(raw)) {
        if (isStringArray(fields)) visibleFields[objectName] = fields;
    }
    return visibleFields;
}

function readViewSettings(raw: unknown): ViewSettings {
    if (!isPlainObject(raw)) return defaultViewSettings;
    return { ...defaultViewSettings, ...(raw as Partial<ViewSettings>) };
}

function readEdgeColors(raw: unknown): ErdEdgeColors {
    if (!isPlainObject(raw)) return defaultEdgeColors;
    return { ...defaultEdgeColors, ...(raw as Partial<ErdEdgeColors>) };
}

/** Why this file cannot be imported here, or null when it belongs to the current Vault. */
export function projectVaultMismatchMessage(
    project: ErdProjectFile,
    currentVaultId: string | null,
): string | null {
    if (currentVaultId && project.vaultId === currentVaultId) return null;
    return `This project was exported from ${describeVault(project)}. Sign in to that Vault to open it.`;
}

function describeVault({ vaultId, vaultName, vaultDNS }: ErdProjectVaultStamp): string {
    if (vaultName && vaultDNS) return `${vaultName} (${vaultDNS})`;
    if (vaultName) return vaultName;
    if (vaultDNS) return vaultDNS;
    return `Vault ${vaultId}`;
}

/** Whether the live schema says anything different from what an imported file carried. */
export function projectDiffersFromSchema(
    projectRecords: Record<string, ErdObjectRecord>,
    liveRecords: Record<string, ErdObjectRecord>,
): boolean {
    for (const [objectName, importedRecord] of Object.entries(projectRecords)) {
        const liveRecord = liveRecords[objectName];
        if (!liveRecord) return true;
        if (liveRecord.partial) continue;
        if (recordSignature(importedRecord) !== recordSignature(liveRecord)) return true;
    }
    return false;
}

/** A record's comparable shape: the fields it shows and the relationships it draws, in order. */
function recordSignature(record: ErdObjectRecord): string {
    const fields = record.fields.map((field) => `${field.name}:${field.label}:${field.type}`).join(',');
    return `${fields}|${record.relationships.map(relationshipKey).join(',')}`;
}
