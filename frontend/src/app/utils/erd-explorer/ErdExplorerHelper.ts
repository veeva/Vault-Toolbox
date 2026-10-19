/**
 * Pure transforms for the ERD Explorer tool. Everything here is deterministic and covered by
 * ErdExplorerPureLogic.test.ts. No network or React here.
 */
import {
    DOCUMENTS_TARGET,
    EXTERNAL_TARGET_LABELS,
    HIDDEN_LIFECYCLE_OBJECTS,
    PRESET_EXCLUDED_REFERENCE_FIELDS,
    UNFETCHABLE_RELATIONSHIP_TARGETS,
    USERS_GROUPS_TARGETS,
    type ErdRelationshipsByDirection,
    type ErdField,
    type ErdNodePosition,
    type ErdObjectRecord,
    type ErdObjectSummary,
    type ErdRelationship,
    type ErdSource,
    type FieldCategory,
} from './ErdExplorerTypes';
// Type-only, so this stays free of the loader's API imports.
import type { ErdSchemaLoadProgress } from './schema/ErdExplorerSchemaLoad';

// Grid the canvas places newly-added objects on. Assigned at add time and persisted, so nodes never
// spawn at (0,0), never stack behind dragged nodes, and look identical after a reload.
const ADD_GRID_COLUMNS = 4;
const ADD_GRID_COLUMN_SPACING = 300;
const ADD_GRID_ROW_SPACING = 200;

/** Canvas position of the `slotIndex`-th slot on the add grid (left to right, then wrapping down). */
export function gridPosition(slotIndex: number): ErdNodePosition {
    return {
        x: (slotIndex % ADD_GRID_COLUMNS) * ADD_GRID_COLUMN_SPACING,
        y: Math.floor(slotIndex / ADD_GRID_COLUMNS) * ADD_GRID_ROW_SPACING,
    };
}

/** Keep only the per-object entries whose object name is in `names`. */
export function pickByName<TValue>(entries: Record<string, TValue>, names: string[]): Record<string, TValue> {
    const keep = new Set(names);
    const result: Record<string, TValue> = {};
    for (const [objectName, value] of Object.entries(entries)) {
        if (keep.has(objectName)) result[objectName] = value;
    }
    return result;
}

/** A relationship's identity, for de-duplicating two lists of them. */
export function relationshipKey(relationship: ErdRelationship): string {
    return `${relationship.name}:${relationship.target}:${relationship.direction}`;
}

/** How far the schema load has got, as the Add Objects tab words it while the tab is gated. */
export function formatSchemaLoadProgress(progress: ErdSchemaLoadProgress): string {
    if (progress.derivingRelationships) return 'Building relationships…';
    if (progress.pagesLoaded === 0) return 'Reading this Vault’s objects…';
    const objectCount = progress.objectsParsed.toLocaleString();
    return `Read ${objectCount} object${progress.objectsParsed === 1 ? '' : 's'}…`;
}

/**
 * Classify a field for the Field Selector filters:
 *   - `reference` if it is an object-type relationship field;
 *   - else `data` if its API name ends in `__c` (custom business field);
 *   - else `standard` if its API name ends in `__v` (Vault-standard field);
 *   - else `system` (covers `__sys`, the special `id` field, and anything else — platform-managed).
 */
export function classifyField(field: ErdField): FieldCategory {
    if (field.isReference) return 'reference';
    if (field.name.endsWith('__c')) return 'data';
    if (field.name.endsWith('__v')) return 'standard';
    return 'system';
}

/**
 * Field names for the "Relationships only" preset: reference fields minus the audit references
 * (created/modified by, see PRESET_EXCLUDED_REFERENCE_FIELDS). Shared by the Field Selector preset button
 * and by bulk selection and default field resolution so they can never drift.
 */
export function relationshipsOnlyFieldNames(fields: ErdField[]): string[] {
    return fields
        .filter((field) => field.isReference && !PRESET_EXCLUDED_REFERENCE_FIELDS.has(field.name))
        .map((field) => field.name);
}

/** Derive an object/field source from its API name suffix (for badges + ordering). */
export function sourceFromSuffix(name: string): ErdSource {
    if (name.endsWith('__sys')) return 'system';
    if (name.endsWith('__v')) return 'standard';
    if (name.endsWith('__c')) return 'custom';
    return 'unknown';
}

export function isDocumentTarget(target: string): boolean {
    return target === DOCUMENTS_TARGET;
}

export function isUsersGroupsTarget(target: string): boolean {
    return USERS_GROUPS_TARGETS.has(target);
}

/** A lifecycle system object hidden by default (see HIDDEN_LIFECYCLE_OBJECTS). */
export function isHiddenLifecycleObject(target: string): boolean {
    return HIDDEN_LIFECYCLE_OBJECTS.has(target);
}

/**
 * Multiplier that thickens a highlighted stroke/border as you zoom OUT, so it stays visible from afar.
 * Shared by highlighted edges (FloatingEdge) and highlighted node borders (ObjectNode) so both scale at
 * the SAME rate. Clamped to [1, 6]; `transform[2]` is React Flow's zoom.
 */
export function highlightZoomScale(zoom: number): number {
    return Math.min(6, Math.max(1, 1 / Math.max(zoom, 0.1)));
}

/** A synthetic external target: documents, users, or groups (not a real, expandable Vault object). */
export function isExternalTarget(target: string): boolean {
    return isDocumentTarget(target) || isUsersGroupsTarget(target);
}

export interface TargetVisibilityOptions {
    includeDocuments?: boolean;
    includeUsersGroups?: boolean;
    /** When false (the default), the lifecycle system objects in HIDDEN_LIFECYCLE_OBJECTS are hidden. */
    includeLifecycleObjects?: boolean;
}

/** Whether a relationship target is currently hidden given the document/users-groups/lifecycle toggles. */
export function isHiddenTarget(
    target: string,
    { includeDocuments = true, includeUsersGroups = false, includeLifecycleObjects = false }: TargetVisibilityOptions,
): boolean {
    if (isDocumentTarget(target)) return !includeDocuments;
    if (isUsersGroupsTarget(target)) return !includeUsersGroups;
    if (isHiddenLifecycleObject(target)) return !includeLifecycleObjects;
    return false;
}

/**
 * A "phantom" target: a relationship points at it, but it is not a real, fetchable Vault object (and
 * not an enabled external target). Vault exposes some of these on inbound relationships (e.g.
 * `attachment_object__sys`) whose metadata endpoint 404s — filter them so they never become failed
 * nodes or dead menu entries. `UNFETCHABLE_RELATIONSHIP_TARGETS` catches the ones Vault still lists in
 * the object catalog (so the `knownObjects` check alone wouldn't flag them); everything else only
 * counts as phantom when a non-empty `knownObjects` set is available.
 */
export function isPhantomTarget(target: string, knownObjects?: Set<string>): boolean {
    if (UNFETCHABLE_RELATIONSHIP_TARGETS.has(target)) return true;
    if (!knownObjects || knownObjects.size === 0) return false;
    if (isExternalTarget(target)) return false;
    return !knownObjects.has(target);
}

interface SplitOptions extends TargetVisibilityOptions {
    /** When provided, rows whose target is the object itself (self-reference noise) are removed. */
    selfName?: string;
    /** Names of real, listed objects; targets outside this set (and non-external) are treated as phantom. */
    knownObjects?: Set<string>;
}

/** Partition relationships into inbound/outbound for the two-section related-objects view. */
export function splitInboundOutbound(
    relationships: ErdRelationship[],
    { includeDocuments = true, includeUsersGroups = false, selfName, knownObjects }: SplitOptions = {},
): ErdRelationshipsByDirection {
    const visible = relationships.filter((relationship) => {
        if (isHiddenTarget(relationship.target, { includeDocuments, includeUsersGroups })) return false;
        if (isPhantomTarget(relationship.target, knownObjects)) return false;
        if (selfName && relationship.target === selfName) return false;
        return true;
    });
    return {
        inbound: visible.filter((relationship) => relationship.direction === 'inbound'),
        outbound: visible.filter((relationship) => relationship.direction === 'outbound'),
    };
}

/** Classification of a relational (join) object: its two parents and whether it's simple or complex. */
export interface JoinObjectInfo {
    parents: [string, string];
    kind: 'simple' | 'complex';
}

/** True when a field is a custom (business) field — authoritative `source` first, name-suffix fallback. */
function isCustomField(field: ErdField): boolean {
    if (field.source) return field.source === 'custom';
    return sourceFromSuffix(field.name) === 'custom';
}

/**
 * Classify a relational (join) object from its parsed fields:
 *   - returns `null` unless the object has EXACTLY two Parent-Object fields (i.e. it isn't a join).
 *     A Parent-Object field is identified by `relationship_type === 'parent'` — the object-metadata API
 *     reports these as `type: 'Object'` (same as a plain reference), distinguished only by relationship
 *     type, so keying off `relationship_type` is the reliable signal.
 *   - `kind: 'complex'` when it carries any custom field beyond the two parent fields — the exact
 *     trigger the Vault UI uses to promote a simple join to complex — else `'simple'`.
 * `parents` are the two parent fields' target objects, in field order.
 */
export function analyzeJoinObject(fields: ErdField[]): JoinObjectInfo | null {
    const parentFields = fields.filter((field) => field.relationshipType === 'parent');
    if (parentFields.length !== 2) return null;
    const [firstParent, secondParent] = parentFields.map((field) => field.targetObject ?? '');
    if (!firstParent || !secondParent) return null;
    const parentFieldNames = new Set(parentFields.map((field) => field.name));
    const hasCustomField = fields.some((field) => !parentFieldNames.has(field.name) && isCustomField(field));
    return { parents: [firstParent, secondParent], kind: hasCustomField ? 'complex' : 'simple' };
}

/** The two "collapse join objects into a single many-to-many edge" view settings. */
export interface JoinHideSettings {
    hideSimpleJoinObjects: boolean;
    hideComplexJoinObjects: boolean;
}

/**
 * Whether an object belongs on the canvas as a collapsed many-to-many edge rather than its own node:
 * a join, of a kind the settings hide, with both parents placed.
 */
export function isCollapsedJoinObject(
    record: ErdObjectRecord | undefined,
    { hideSimpleJoinObjects, hideComplexJoinObjects }: JoinHideSettings,
    placedNames: ReadonlySet<string>,
): boolean {
    if (record?.status !== 'ready') return false;
    const joinInfo = analyzeJoinObject(record.fields);
    if (!joinInfo) return false;
    const hidesThisKind = joinInfo.kind === 'complex' ? hideComplexJoinObjects : hideSimpleJoinObjects;
    return hidesThisKind && placedNames.has(joinInfo.parents[0]) && placedNames.has(joinInfo.parents[1]);
}

/** Parse a depth input string into a valid integer ≥ 1 (used by the recursive-add depth field). */
export function parseDepth(text: string): number {
    return Math.max(1, Math.floor(Number(text) || 1));
}

/** Removes duplicate relationships by target name, keeping the first occurrence of each target. */
function dedupeRelationshipsByTarget(relationships: ErdRelationship[]): ErdRelationship[] {
    const seen = new Set<string>();
    return relationships.filter((relationship) => {
        if (seen.has(relationship.target)) return false;
        seen.add(relationship.target);
        return true;
    });
}

/** Display label for a relationship target: its object metadata label, or the external-target label (documents/users/groups). */
export function resolveTargetLabel(target: string, summaryByName: Map<string, ErdObjectSummary>): string | undefined {
    return summaryByName.get(target)?.label ?? EXTERNAL_TARGET_LABELS[target];
}

/** Returns true if two string arrays have the same length and identical elements in order. */
export function hasSameStringArray(arrayA: string[], arrayB: string[]): boolean {
    if (arrayA === arrayB) return true;
    if (arrayA.length !== arrayB.length) return false;
    for (let index = 0; index < arrayA.length; index++) {
        if (arrayA[index] !== arrayB[index]) return false;
    }
    return true;
}

/** Classify an edge relative to the selected anchor node: 'out' (leaves it), 'in' (enters it), or null. */
export function classifyEdgeHighlight(anchorName: string | null, edgeSource: string, edgeTarget: string): 'out' | 'in' | null {
    if (!anchorName) return null;
    if (edgeSource === anchorName) return 'out';
    if (edgeTarget === anchorName) return 'in';
    return null;
}

/** The search term, filters, and lookups `filterAndDedupeRelationshipList` narrows a list by. */
export interface RelationshipListFilters {
    searchTerm: string;
    sourceFilter: string;
    summaryMap: Map<string, ErdObjectSummary>;
    placed: Set<string>;
    selected: Set<string>;
    stateFilter: string;
}

/** Deduplicate a relationship list by target, then narrow it by search term, source, and canvas state. */
export function filterAndDedupeRelationshipList(
    relationships: ErdRelationship[],
    filters: RelationshipListFilters,
): ErdRelationship[] {
    const { searchTerm, sourceFilter, summaryMap, placed, selected, stateFilter } = filters;
    return dedupeRelationshipsByTarget(relationships).filter((relationship) => {
        if (searchTerm && !relationship.target.toLowerCase().includes(searchTerm)) return false;
        if (sourceFilter !== 'all') {
            const source = summaryMap.get(relationship.target)?.source;
            if (source && source !== sourceFilter) return false;
        }
        if (stateFilter === 'on canvas' && !placed.has(relationship.target)) return false;
        if (stateFilter === 'selected' && !selected.has(relationship.target)) return false;
        return true;
    });
}
