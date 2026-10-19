/**
 * Shared types for the ERD Explorer tool.
 *
 * Data provenance (all verified live against a Vault, API v26.2):
 *   - Object list:      GET /api/{v}/metadata/vobjects            -> { objects: [...] }
 *   - Object metadata:  GET /api/{v}/metadata/vobjects/{name}     -> { object: { fields: [...], relationships: [...] } }
 *
 * The object-metadata response is the single source for BOTH node fields and edges: its `relationships`
 * array carries both directions (`reference_outbound`/`parent` and `reference_inbound`/`child`) plus
 * `documents` targets, so ONE call per object suffices (no separate `SHOW RELATIONSHIPS` VQL). The
 * `ErdRelationship` shape below is what `parseRelationshipsFromMetadata` produces for `deriveEdges`.
 */

export type RelationshipDirection = 'inbound' | 'outbound';

/** Which side of the selected object a highlighted neighbour sits on: 'out' leaves it, 'in' enters it. */
export type ErdHighlightDirection = 'out' | 'in';

/** A node's canvas position, and the per-object map of them the canvas state keeps. */
export interface ErdNodePosition {
    x: number;
    y: number;
}
export type ErdPositionMap = Record<string, ErdNodePosition>;

/** Field-selector filter categories (see classifyField). */
export type FieldCategory = 'reference' | 'data' | 'standard' | 'system';

/** Object/field source, ordered system → standard → custom everywhere in the UI. */
export type ErdSource = 'system' | 'standard' | 'custom' | 'unknown';

/** A row from GET /metadata/vobjects. */
export interface ErdObjectSummary {
    name: string;
    label: string;
    labelPlural?: string;
    /** 'standard' | 'system' | 'custom' */
    source: string;
    prefix?: string;
}

/** A field parsed from object metadata (reference fields carry relationship info). */
export interface ErdField {
    name: string;
    label: string;
    type: string;
    /** true when type is Object / ObjectReference / ObjectParent. */
    isReference: boolean;
    relationshipType?: string;
    /** Target object name (e.g. 'pm_application__v', 'documents', 'users'). */
    targetObject?: string;
    outboundName?: string;
    inboundName?: string;
    required?: boolean;
    /** Authoritative field source from metadata ('standard' | 'system' | 'custom'). */
    source?: string;
    /** Whether the field enforces uniqueness (from metadata) — used for join classification. */
    unique?: boolean;
}

/** A derived relationship (from the object-metadata `relationships` array). */
export interface ErdRelationship {
    /** Relationship name, e.g. 'application__cr'. */
    name: string;
    /** Target object name, e.g. 'pm_application__v' or 'documents'. */
    target: string;
    direction: RelationshipDirection;
}

/** Fetch status for a single object's metadata + relationships. */
export type ErdRecordStatus = 'loading' | 'ready' | 'error';

/** One object's fetched metadata: what the node renders and what the edge builder reads. */
export interface ErdObjectRecord {
    status: ErdRecordStatus;
    fields: ErdField[];
    relationships: ErdRelationship[];
    /** Object-level metadata for the Object Info tab (from the same /metadata/vobjects/{name} response). */
    objectClass?: string;
    description?: string;
    /** True for a placeholder whose own fields are not known — see `missingFromVault` for which kind. */
    partial?: boolean;
    /**
     * True when the object is not in this Vault's schema at all, as opposed to merely having no MDL.
     * Keeps it on the canvas without being fetched, since a request for it would only 404.
     */
    missingFromVault?: boolean;
    error?: string;
    /** True when the error was an expired/invalid session — safe to auto-retry once the session is valid. */
    retryable?: boolean;
}

/** Relationships partitioned by direction for the two-section related-objects view. */
export interface ErdRelationshipsByDirection {
    inbound: ErdRelationship[];
    outbound: ErdRelationship[];
}

/** A derived graph edge between two placed objects (or an object and an external-target node). */
export interface ErdEdgeData {
    id: string;
    source: string;
    target: string;
    relationshipName: string;
    relationshipType?: string;
    /** True when the edge points at the Documents external node. */
    isDocument: boolean;
    /** Set when the target is a synthetic external node (documents/users/groups). */
    externalTarget?: string;
}

/** Synthetic external-target node names (not real Vault objects; rendered as external nodes). */
export const DOCUMENTS_TARGET = 'documents';
export const USERS_TARGET = 'users';
export const GROUPS_TARGET = 'groups';

/** External (non-object) relationship targets and their display labels. */
export const EXTERNAL_TARGET_LABELS: Readonly<Record<string, string>> = {
    [DOCUMENTS_TARGET]: 'Documents',
    [USERS_TARGET]: 'Users',
    [GROUPS_TARGET]: 'Groups',
};

/**
 * Node box size assumed before React Flow has measured a node — used for grid placement, centring,
 * and floating-edge geometry, so every pre-measure estimate agrees.
 */
export const FALLBACK_NODE_WIDTH = 220;
export const FALLBACK_NODE_HEIGHT = 90;

/**
 * React Flow node `type` keys — must match the keys registered in the `nodeTypes` map
 * (see ErdExplorerIsland). Kept as constants so the string is defined in exactly one place.
 * @see https://reactflow.dev/api-reference/types/node
 */
export const ERD_OBJECT_NODE_TYPE = 'erdObject';
export const ERD_EXTERNAL_NODE_TYPE = 'erdExternal';

/** Relationship targets that are not addable/expandable Vault objects. */
export const USERS_GROUPS_TARGETS: ReadonlySet<string> = new Set([USERS_TARGET, GROUPS_TARGET]);

/**
 * Lifecycle system objects hidden from the ERD by default (they add noise on nearly every object).
 * The "Show lifecycle system objects" view setting brings them back into the picker and as edge targets.
 */
export const HIDDEN_LIFECYCLE_OBJECTS: ReadonlySet<string> = new Set([
    'object_lifecycle_state_stage__sys',
    'object_lifecycle_stage_label__sys',
]);

/**
 * Relationship targets that Vault lists in the object catalog (so `isPhantomTarget`'s `knownObjects`
 * check alone wouldn't catch them) but whose own metadata always 404s from `GET /metadata/vobjects/
 * {name}` — Vault models them as a relationship target for querying object types, not as a fetchable
 * object. Always excluded as a connectable/placeable node, unconditionally (no view-setting toggle).
 */
export const UNFETCHABLE_RELATIONSHIP_TARGETS: ReadonlySet<string> = new Set(['object_type__v']);

/**
 * Reference fields excluded from the "Relationships only" field preset: audit references (created/modified
 * by) point at the user object but are rarely meaningful as diagram relationships. They still classify as
 * `reference`, so the Reference category filter continues to list them.
 */
export const PRESET_EXCLUDED_REFERENCE_FIELDS: ReadonlySet<string> = new Set([
    'created_by__v',
    'modified_by__v',
]);

/** Edge stroke colours by relationship type (React Flow strokes are plain CSS). Shared by the edge
 *  builder and the legend so they never drift. */
export const EDGE_TYPE_COLORS: Readonly<Record<string, string>> = {
    parent: '#661b7d', // parent-child (customizable default)
    child: '#661b7d',
    reference: '#2362a1', // reference (customizable default)
    reference_inbound: '#2362a1',
    reference_outbound: '#2362a1',
    document: '#3b82f6', // blue (dashed, fixed)
    usersGroups: '#9ca3af', // grey (dashed, fixed)
    manyToManySimple: '#0d9488', // teal — collapsed simple join (customizable default)
    manyToManyComplex: '#b45309', // amber — collapsed complex join (customizable default)
};
/**
 * Neutral stroke used when the "colour-coded relationships" view setting is OFF. Deliberately distinct
 * from every entry in EDGE_TYPE_COLORS (esp. the reference blue) so toggling colour-coding is visible
 * even on a reference-only diagram.
 */
export const UNIFORM_EDGE_COLOR = '#94a3b8';

/**
 * Muted highlight colours applied to a selected object's neighbourhood (deliberately calmer than the
 * veeva orange used for the selection outline): color 1 = outbound (arrows + target objects), color 2 =
 * inbound (arrows + source objects).
 */
export const ERD_HIGHLIGHT_OUTBOUND = '#358540'; // color 1 — green (outbound)
export const ERD_HIGHLIGHT_INBOUND = '#85353e'; // color 2 — red (inbound)

/** Distinct legend entries. `dashed` matches how external-target edges (documents, users/groups) render. */
export const EDGE_LEGEND: ReadonlyArray<{ type: string; label: string; dashed: boolean }> = [
    { type: 'reference', label: 'Reference', dashed: false },
    { type: 'parent', label: 'Parent-child', dashed: false },
    { type: 'manyToManySimple', label: 'Many-to-Many (simple)', dashed: false },
    { type: 'manyToManyComplex', label: 'Many-to-Many (complex)', dashed: false },
    { type: 'document', label: 'Documents', dashed: true },
];

/** Field types that represent a reference/relationship to another object or documents. */
export const REFERENCE_FIELD_TYPES: ReadonlySet<string> = new Set([
    'Object',
    'ObjectReference',
    'ObjectParent',
]);

/** Ordered list of all field categories (reference → data → standard → system). */
export const FIELD_CATEGORIES: readonly FieldCategory[] = ['reference', 'data', 'standard', 'system'];

/** Display labels for each field category, used in the Field Selector tab. */
export const FIELD_CATEGORY_LABELS: Readonly<Record<FieldCategory, string>> = {
    reference: 'Reference',
    data: 'Data',
    standard: 'Standard',
    system: 'System',
};
