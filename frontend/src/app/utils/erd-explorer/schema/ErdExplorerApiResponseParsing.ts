import { REFERENCE_FIELD_TYPES, type ErdField, type ErdObjectSummary, type ErdRelationship } from '../ErdExplorerTypes';

/**
 * Pure API-response parsers for the ERD Explorer tool. These transform raw Vault REST API responses into
 * typed domain objects used throughout the ERD. Covered by ErdExplorerPureLogic.test.ts.
 */

/** Parse GET /metadata/vobjects into object summaries for the picker. */
export function parseObjectList(resp: unknown): ErdObjectSummary[] {
    const objects = (resp as { objects?: Array<Record<string, unknown>> } | undefined)?.objects ?? [];
    return objects.map((object) => ({
        name: String(object.name),
        label: String(object.label ?? object.name),
        labelPlural: object.label_plural as string | undefined,
        source: String(object.source ?? 'unknown'),
        prefix: object.prefix as string | undefined,
    }));
}

/** Resolve a reference field's target object name (the descriptor may be a string or an object). */
function resolveTargetName(objectRef: unknown): string | undefined {
    if (!objectRef) return undefined;
    if (typeof objectRef === 'string') return objectRef;
    const name = (objectRef as { name?: unknown }).name;
    return name === undefined || name === null ? undefined : String(name);
}

/** Parse object metadata (GET /metadata/vobjects/{name}) into fields, flagging reference fields. */
export function parseObjectFields(metaResp: unknown): ErdField[] {
    const container = metaResp as { object?: { fields?: unknown[] }; fields?: unknown[] } | undefined;
    const fields = (container?.object?.fields ?? container?.fields ?? []) as Array<Record<string, unknown>>;
    return fields.map((field) => {
        const isReference = REFERENCE_FIELD_TYPES.has(String(field.type));
        return {
            name: String(field.name),
            label: String(field.label ?? field.name),
            type: String(field.type),
            isReference,
            relationshipType: (field.relationship_type as string) || undefined,
            // Resolve the target from `object` whenever present (reference AND parent fields carry it);
            // non-relationship fields have no `object`, so this stays undefined for them.
            targetObject: resolveTargetName(field.object),
            outboundName: (field.relationship_outbound_name as string) || undefined,
            inboundName: (field.relationship_inbound_name as string) || undefined,
            required: Boolean(field.required),
            source: (field.source as string) || undefined,
            unique: Boolean(field.unique),
        };
    });
}

/** Object-level metadata (beyond fields) surfaced in the Object Info tab. */
export interface ErdObjectMeta {
    objectClass?: string;
    description?: string;
}

/** Parse object-level metadata (object class, description) from GET /metadata/vobjects/{name}. */
export function parseObjectMeta(metaResp: unknown): ErdObjectMeta {
    const container = metaResp as { object?: Record<string, unknown> } | undefined;
    const object = container?.object;
    if (!object) return {};
    return {
        objectClass: (object.object_class as string) || undefined,
        description: (object.description as string) || undefined,
    };
}

/** Parse `SHOW RELATIONSHIPS FROM {object}` rows (raw or query-wrapped) into relationships. */
export function parseRelationships(resp: unknown): ErdRelationship[] {
    const wrapped = resp as
        | { data?: unknown[]; queryResponse?: { data?: unknown[] } }
        | undefined;
    const data = (wrapped?.data ?? wrapped?.queryResponse?.data ?? []) as Array<Record<string, unknown>>;
    return data.map((row) => ({
        name: String(row.name),
        target: String(row.target),
        direction: row.type === 'inbound' ? 'inbound' : 'outbound',
    }));
}

/** Metadata `relationship_type` values that mean "this object points OUT at the target". */
const OUTBOUND_META_RELATIONSHIP_TYPES: ReadonlySet<string> = new Set(['reference_outbound', 'parent']);

/**
 * Parse relationships from the OBJECT-METADATA response's own `relationships` array (GET
 * /metadata/vobjects/{name}) — it already carries both directions (`reference_outbound`/`parent` →
 * outbound; `reference_inbound`/`child` → inbound) plus documents, so a separate `SHOW RELATIONSHIPS`
 * VQL call is unnecessary. Directions map to the same `ErdRelationship` shape `deriveEdges` expects.
 */
export function parseRelationshipsFromMetadata(metaResp: unknown): ErdRelationship[] {
    const container = metaResp as { object?: { relationships?: unknown[] }; relationships?: unknown[] } | undefined;
    const rels = (container?.object?.relationships ?? container?.relationships ?? []) as Array<Record<string, unknown>>;
    const out: ErdRelationship[] = [];
    for (const rel of rels) {
        const target = resolveTargetName(rel.object);
        if (!target) continue;
        out.push({
            name: String(rel.relationship_name ?? ''),
            target,
            direction: OUTBOUND_META_RELATIONSHIP_TYPES.has(String(rel.relationship_type)) ? 'outbound' : 'inbound',
        });
    }
    return out;
}
