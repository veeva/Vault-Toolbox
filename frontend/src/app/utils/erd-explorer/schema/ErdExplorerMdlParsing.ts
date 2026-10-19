/**
 * Parse `mdl_definition__v` (the object's MDL text, fetched in bulk for ALL objects via one
 * `POST /query/components` call) into `ErdField[]` + object-level attributes, and derive the full
 * inbound/outbound relationship graph across every object — so the entire schema is preloaded from that
 * single query with NO per-object `/metadata/vobjects/{name}` calls. Pure + unit-tested.
 *
 * MDL grammar (subset we need):
 *   RECREATE Object <name> ( <entry>,* );
 *   entry := <key>(<value>)  |  Field <fname> ( <entry>,* )
 * Values are single-quoted (embedded quotes escaped `\'`), barewords (`true`), or empty (`()`).
 * Quoted values may contain `(`, `)`, `,`, and newlines — so splitting must track quote state.
 */
import { REFERENCE_FIELD_TYPES, type ErdField, type ErdRelationship } from '../ErdExplorerTypes';
import { isExternalTarget, sourceFromSuffix } from '../ErdExplorerHelper';

export interface ParsedObjectMdl {
    name: string;
    label?: string;
    labelPlural?: string;
    objectClass?: string;
    description?: string;
    fields: ErdField[];
}

/** Strip surrounding single-quotes and unescape `\'`, `\n`, `\\`. Barewords/empty pass through. */
function unquote(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
        return trimmed.slice(1, -1).replace(/\\(['\\])/g, '$1').replace(/\\n/g, '\n');
    }
    return trimmed;
}

/** From index of an opening `(`, return the inner content up to its matching `)` (quote-aware). */
function readParenGroup(mdlText: string, openIdx: number): { inner: string; end: number } {
    let depth = 0;
    let inQuotedString = false;
    for (let charIdx = openIdx; charIdx < mdlText.length; charIdx++) {
        const char = mdlText[charIdx];
        if (inQuotedString) {
            if (char === '\\') charIdx++; // skip escaped char
            else if (char === "'") inQuotedString = false;
            continue;
        }
        if (char === "'") inQuotedString = true;
        else if (char === '(') depth++;
        else if (char === ')') {
            depth--;
            if (depth === 0) return { inner: mdlText.slice(openIdx + 1, charIdx), end: charIdx };
        }
    }
    return { inner: mdlText.slice(openIdx + 1), end: mdlText.length };
}

/** Split an MDL body into top-level entries at commas of paren-depth 0 (quote-aware). */
function splitEntries(body: string): string[] {
    const entries: string[] = [];
    let depth = 0;
    let inQuotedString = false;
    let start = 0;
    for (let charIdx = 0; charIdx < body.length; charIdx++) {
        const char = body[charIdx];
        if (inQuotedString) {
            if (char === '\\') charIdx++;
            else if (char === "'") inQuotedString = false;
            continue;
        }
        if (char === "'") inQuotedString = true;
        else if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ',' && depth === 0) {
            entries.push(body.slice(start, charIdx));
            start = charIdx + 1;
        }
    }
    const last = body.slice(start).trim();
    if (last) entries.push(last);
    return entries;
}

/** Parse the `attr(value)` pairs of a body into a flat map (Field subcomponents are ignored here). */
function attrsOf(body: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    for (const entry of splitEntries(body)) {
        const trimmed = entry.trim();
        const open = trimmed.indexOf('(');
        if (open <= 0) continue;
        const key = trimmed.slice(0, open).trim();
        if (!/^\w+$/.test(key)) continue; // skip `Field x (...)` etc.
        const { inner } = readParenGroup(trimmed, open);
        attrs[key] = unquote(inner);
    }
    return attrs;
}

function parseFieldMdl(name: string, body: string): ErdField {
    const attrs = attrsOf(body);
    const type = attrs.type ?? '';
    return {
        name,
        label: attrs.label || name,
        type,
        isReference: REFERENCE_FIELD_TYPES.has(type),
        relationshipType: attrs.relationship_type || undefined,
        targetObject: attrs.object || undefined,
        outboundName: attrs.relationship_outbound_name || undefined,
        inboundName: attrs.relationship_inbound_name || undefined,
        required: attrs.required === 'true',
        source: sourceFromSuffix(name),
        unique: attrs.unique === 'true',
    };
}

/**
 * Parse one object's MDL into fields + object attributes. Returns `null` if the text isn't a parseable
 * `RECREATE/CREATE Object` (the caller then falls back to a per-object metadata fetch). Never throws.
 */
export function parseObjectMdl(mdl: unknown): ParsedObjectMdl | null {
    if (typeof mdl !== 'string' || !mdl) return null;
    try {
        const header = mdl.match(/(?:RECREATE|CREATE)\s+Object\s+(\w+)\s*\(/i);
        if (!header || header.index === undefined) return null;
        const name = header[1];
        const openIdx = mdl.indexOf('(', header.index);
        const { inner } = readParenGroup(mdl, openIdx);

        const objAttrs: Record<string, string> = {};
        const fields: ErdField[] = [];
        for (const entry of splitEntries(inner)) {
            const trimmed = entry.trim();
            const fieldMatch = trimmed.match(/^Field\s+(\w+)\s*\(/i);
            if (fieldMatch) {
                const fOpen = trimmed.indexOf('(', fieldMatch.index ?? 0);
                fields.push(parseFieldMdl(fieldMatch[1], readParenGroup(trimmed, fOpen).inner));
                continue;
            }
            const open = trimmed.indexOf('(');
            if (open <= 0) continue;
            const key = trimmed.slice(0, open).trim();
            if (/^\w+$/.test(key)) objAttrs[key] = unquote(readParenGroup(trimmed, open).inner);
        }

        return {
            name,
            label: objAttrs.label || undefined,
            labelPlural: objAttrs.label_plural || undefined,
            objectClass: objAttrs.object_class || undefined,
            description: objAttrs.description || undefined,
            fields,
        };
    } catch {
        return null;
    }
}

/**
 * Derive the full relationship graph (both directions) from EVERY object's fields. Each reference/parent
 * field on object O targeting T produces an OUTBOUND relationship on O and, when T is itself a parsed
 * object, a matching INBOUND relationship on T — mirroring what `/metadata/vobjects` + `SHOW RELATIONSHIPS`
 * would return, but computed entirely client-side from the one bulk query. `deriveEdges` consumes these.
 */
export function deriveAllRelationships(fieldsByObject: Map<string, ErdField[]>): Map<string, ErdRelationship[]> {
    const rels = new Map<string, ErdRelationship[]>();
    const ensure = (name: string): ErdRelationship[] => {
        let arr = rels.get(name);
        if (!arr) {
            arr = [];
            rels.set(name, arr);
        }
        return arr;
    };
    for (const name of fieldsByObject.keys()) ensure(name); // every object gets an entry (even if edge-less)

    for (const [owner, fields] of fieldsByObject) {
        for (const field of fields) {
            if (!field.isReference || !field.targetObject) continue;
            const target = field.targetObject;
            const name = field.outboundName ?? field.name;
            ensure(owner).push({ name, target, direction: 'outbound' });
            // Inbound for any non-external target — documents/users/groups never own inbound edges, but
            // any regular object (even one whose own MDL wasn't parsed, e.g. a system object excluded from
            // the bulk query) should still receive an inbound entry so "See Related" is complete.
            if (!isExternalTarget(target)) {
                ensure(target).push({ name, target: owner, direction: 'inbound' });
            }
        }
    }
    return rels;
}
