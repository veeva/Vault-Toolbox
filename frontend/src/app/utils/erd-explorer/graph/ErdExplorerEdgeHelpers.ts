import { MarkerType, type Edge } from '@xyflow/react';
import {
    DOCUMENTS_TARGET,
    EDGE_TYPE_COLORS,
    ERD_HIGHLIGHT_INBOUND,
    ERD_HIGHLIGHT_OUTBOUND,
    UNIFORM_EDGE_COLOR,
    USERS_GROUPS_TARGETS,
    type ErdEdgeData,
    type ErdField,
    type ErdObjectRecord,
    type ErdRelationship,
} from '../ErdExplorerTypes';
import {
    classifyEdgeHighlight,
    isDocumentTarget,
    isExternalTarget,
    isHiddenLifecycleObject,
    isHiddenTarget,
    isPhantomTarget,
    isUsersGroupsTarget,
    type JoinObjectInfo,
    type TargetVisibilityOptions,
} from '../ErdExplorerHelper';
import { groupEdgesForLabelFanOut } from './ErdExplorerGeometryHelpers';

/** The customizable stroke colours the diagram applies when colour-coding is on. */
export interface ErdEdgeColorOverrides {
    reference: string;
    parentChild: string;
    simpleJoin: string;
    complexJoin: string;
}

/** A label's slot among the edges sharing its two endpoints (see groupEdgesForLabelFanOut). */
interface LabelFanOutSlot {
    index: number;
    count: number;
}

/** The slot of an edge with no siblings — no fan-out offset is applied. */
const LONE_LABEL_SLOT: LabelFanOutSlot = { index: 0, count: 1 };

/** One collapsed many-to-many edge drawn directly between a join object's two parents. */
interface ManyToManyEdge {
    id: string;
    source: string;
    target: string;
    joinName: string;
    kind: 'simple' | 'complex';
}

/** A users/groups edge derived from a field, carrying the owning field's API name for anchoring. */
interface FieldExternalEdge extends ErdEdgeData {
    owningFieldName: string;
}

/** The synthetic relationship-type strings for collapsed simple/complex joins (used for colour + label). */
export const MANY_TO_MANY_SIMPLE_TYPE = 'manyToManySimple';
export const MANY_TO_MANY_COMPLEX_TYPE = 'manyToManyComplex';

/** Legend swatch colour for a relationship type, honouring the user's customizable edge colours. */
export function legendSwatchColor(relationshipType: string, edgeColors: ErdEdgeColorOverrides): string {
    if (relationshipType === 'reference') return edgeColors.reference;
    if (relationshipType === 'parent') return edgeColors.parentChild;
    if (relationshipType === MANY_TO_MANY_SIMPLE_TYPE) return edgeColors.simpleJoin;
    if (relationshipType === MANY_TO_MANY_COMPLEX_TYPE) return edgeColors.complexJoin;
    return EDGE_TYPE_COLORS[relationshipType];
}

/** Human label for a relationship's kind shown in the FloatingEdge hover tooltip. */
export function edgeKindTooltipLabel(type: string): string {
    const labels: Record<string, string> = {
        reference: 'Reference',
        parent: 'Parent-Child',
        document: 'Document',
        manyToManySimple: 'Many-to-Many Simple',
        manyToManyComplex: 'Many-to-Many Complex',
    };
    return labels[type] ?? type;
}

/**
 * Derive canvas edges from the placed objects' relationships.
 *
 * Primary pass — OUTBOUND rows: a relationship is outbound on the side owning the reference field, so
 * this carries the real relationship name/field and (for two placed objects) de-dupes naturally. An edge
 * is emitted when the target is another placed object or an enabled external target
 * (documents/users/groups, rendered as a synthetic node).
 *
 * Fallback pass — INBOUND rows: an inbound row on A whose target is a placed object B means B owns a FK
 * pointing at A (edge B→A), but B's metadata may not have loaded yet (batch add, slow fetch, or a failed
 * fetch), so the outbound pass missed it. We emit that edge from A's inbound row UNLESS the outbound pass
 * already produced an edge for the same owner→target ordered pair. This makes every edge appear as
 * soon as EITHER endpoint loads, fixing "not all relationships are drawn" on bulk adds.
 *
 * Self-loops and disabled external targets are skipped throughout.
 */
export function deriveEdges(
    placedNames: string[],
    relationshipsByObject: Record<string, ErdRelationship[]>,
    { includeDocuments = true, includeUsersGroups = false, includeLifecycleObjects = false }: TargetVisibilityOptions = {},
): ErdEdgeData[] {
    const placed = new Set(placedNames);
    const edges: ErdEdgeData[] = [];
    const drawnPairs = new Set<string>();

    for (const source of placedNames) {
        const relationships = relationshipsByObject[source] ?? [];
        for (const relationship of relationships) {
            if (relationship.direction !== 'outbound') continue;

            if (relationship.target === source) {
                const pair = `${source}->${source}`;
                if (!drawnPairs.has(pair)) {
                    drawnPairs.add(pair);
                    edges.push({
                        id: `${source}->self:${relationship.name}`,
                        source,
                        target: source,
                        relationshipName: relationship.name,
                        isDocument: false,
                    });
                }
                continue;
            }

            if (isExternalTarget(relationship.target)) {
                if (isHiddenTarget(relationship.target, { includeDocuments, includeUsersGroups })) continue;
                edges.push({
                    id: `${source}->${relationship.target}:${relationship.name}`,
                    source,
                    target: relationship.target,
                    relationshipName: relationship.name,
                    isDocument: isDocumentTarget(relationship.target),
                    externalTarget: relationship.target,
                });
            } else if (placed.has(relationship.target)) {
                if (!includeLifecycleObjects && isHiddenLifecycleObject(relationship.target)) continue;
                drawnPairs.add(`${source}->${relationship.target}`);
                edges.push({
                    id: `${source}->${relationship.target}:${relationship.name}`,
                    source,
                    target: relationship.target,
                    relationshipName: relationship.name,
                    isDocument: false,
                });
            }
        }
    }

    for (const object of placedNames) {
        const relationships = relationshipsByObject[object] ?? [];
        for (const relationship of relationships) {
            if (relationship.direction !== 'inbound') continue;
            const owner = relationship.target;
            if (owner === object) continue;
            if (isExternalTarget(owner) || !placed.has(owner)) continue;
            if (!includeLifecycleObjects && (isHiddenLifecycleObject(owner) || isHiddenLifecycleObject(object))) continue;
            const pair = `${owner}->${object}`;
            if (drawnPairs.has(pair)) continue;
            drawnPairs.add(pair);
            edges.push({
                id: `${pair}:${relationship.name}:inbound`,
                source: owner,
                target: object,
                relationshipName: relationship.name,
                isDocument: false,
            });
        }
    }

    return edges;
}

/**
 * Users/Groups edges derived from FIELD metadata. `SHOW RELATIONSHIPS` omits users/groups, but reference
 * fields (e.g. `created_by__v` → `users`) carry them — so the "Users & Groups" toggle draws from here.
 * One edge per users/groups reference field on each placed object; the owning field name is kept so the
 * arrow can anchor to its row. Returns nothing unless `includeUsersGroups` is on.
 */
export function deriveUserGroupEdges(
    placedNames: string[],
    fieldsByObject: Record<string, ErdField[]>,
    { includeUsersGroups = false }: { includeUsersGroups?: boolean } = {},
): FieldExternalEdge[] {
    if (!includeUsersGroups) return [];
    const edges: FieldExternalEdge[] = [];
    const seen = new Set<string>();
    for (const source of placedNames) {
        for (const field of fieldsByObject[source] ?? []) {
            if (!field.isReference || !field.targetObject) continue;
            if (!isUsersGroupsTarget(field.targetObject)) continue;
            const edgeId = `${source}->${field.targetObject}:${field.name}`;
            if (seen.has(edgeId)) continue;
            seen.add(edgeId);
            edges.push({
                id: edgeId,
                source,
                target: field.targetObject,
                relationshipName: field.outboundName ?? field.name,
                isDocument: false,
                externalTarget: field.targetObject,
                owningFieldName: field.name,
            });
        }
    }
    return edges;
}

/** Users/groups external targets referenced by a placed object's fields (for the synthetic nodes). */
export function userGroupTargetsFromFields(
    placedNames: string[],
    fieldsByObject: Record<string, ErdField[]>,
): Set<string> {
    const targets = new Set<string>();
    for (const source of placedNames) {
        for (const field of fieldsByObject[source] ?? []) {
            if (field.isReference && field.targetObject && isUsersGroupsTarget(field.targetObject)) {
                targets.add(field.targetObject);
            }
        }
    }
    return targets;
}

/**
 * One collapsed M:M edge per join whose BOTH parents are placed. Self-joins (both parents equal) are
 * skipped — there's no useful single edge to draw. `joins` carries each join object's name + parents +
 * kind (see analyzeJoinObject).
 */
export function deriveJoinEdges(
    joins: Array<{ name: string; parents: [string, string]; kind: 'simple' | 'complex' }>,
    placedSet: Set<string>,
): ManyToManyEdge[] {
    const edges: ManyToManyEdge[] = [];
    for (const join of joins) {
        const [source, target] = join.parents;
        if (source === target) continue;
        if (!placedSet.has(source) || !placedSet.has(target)) continue;
        edges.push({ id: `mm:${join.name}:${source}->${target}`, source, target, joinName: join.name, kind: join.kind });
    }
    return edges;
}

/**
 * The join objects currently collapsed into a single many-to-many edge, in the shape deriveJoinEdges
 * takes. Shared with the selection-highlight hook so both read the same joins.
 */
export function collapsedJoinsOf(
    joinInfoByName: Map<string, JoinObjectInfo>,
    hiddenJoinNames: Set<string>,
): Array<{ name: string; parents: [string, string]; kind: 'simple' | 'complex' }> {
    if (hiddenJoinNames.size === 0) return [];
    return [...joinInfoByName]
        .filter(([name]) => hiddenJoinNames.has(name))
        .map(([name, joinInfo]) => ({ name, parents: joinInfo.parents, kind: joinInfo.kind }));
}

/** Relationship line label for a collapsed join: `<join api name> · Many-to-Many · Simple|Complex`. */
function manyToManyRelationshipLineLabel(joinName: string, kind: 'simple' | 'complex'): string {
    return `${joinName} · Many-to-Many · ${kind === 'complex' ? 'Complex' : 'Simple'}`;
}

/**
 * Colour-coded edge stroke: documents (blue), users/groups (grey), collapsed M:M simple/complex,
 * parent-child (light purple), or reference (light blue). Documents/users are also drawn dashed elsewhere.
 */
function edgeDisplayColor(relationshipType?: string, externalTarget?: string, colors?: ErdEdgeColorOverrides): string {
    if (externalTarget === DOCUMENTS_TARGET || relationshipType === 'document') return EDGE_TYPE_COLORS.document;
    if (externalTarget && USERS_GROUPS_TARGETS.has(externalTarget)) return EDGE_TYPE_COLORS.usersGroups;
    if (relationshipType === MANY_TO_MANY_SIMPLE_TYPE) return colors?.simpleJoin ?? EDGE_TYPE_COLORS.manyToManySimple;
    if (relationshipType === MANY_TO_MANY_COMPLEX_TYPE) return colors?.complexJoin ?? EDGE_TYPE_COLORS.manyToManyComplex;
    if (relationshipType === 'parent' || relationshipType === 'child') return colors?.parentChild ?? EDGE_TYPE_COLORS.parent;
    return colors?.reference ?? EDGE_TYPE_COLORS.reference;
}

/**
 * Relationship line label: `"<outbound name> · <kind>"` (e.g. `application__cr · Reference`), so
 * reference and parent-child edges read like the M:M labels. Falls back to the kind alone when a
 * synthetic edge (documents / users-groups) carries no relationship name. A relationship has an outbound
 * and an inbound name for its two sides — when both are known and differ, show both (`a / b · kind`) so
 * the label doesn't silently hide the other side.
 */
export function relationshipLineLabel(outboundName: string | undefined, relationshipType?: string, inboundName?: string): string {
    const kindLabel = relationshipKindLabel(relationshipType);
    if (!outboundName) return kindLabel;
    if (inboundName && inboundName !== outboundName) return `${outboundName} / ${inboundName} · ${kindLabel}`;
    return `${outboundName} · ${kindLabel}`;
}

/** Human label for a relationship's kind, from a field's `relationship_type`. */
export function relationshipKindLabel(relationshipType?: string): string {
    if (relationshipType === 'parent' || relationshipType === 'child') return 'Parent-child';
    if (relationshipType === MANY_TO_MANY_SIMPLE_TYPE || relationshipType === MANY_TO_MANY_COMPLEX_TYPE) return 'Many-to-many';
    if (relationshipType === 'document') return 'Document';
    return 'Reference';
}

const EDGE_STROKE_WIDTH = 1.5;
const EDGE_STROKE_WIDTH_HIGHLIGHT = 3.5;
export const EDGE_ARROW_SIZE = 22;
const EDGE_LABEL_FONT_SIZE = 10;
const EXTERNAL_EDGE_DASH = '6 4';

export interface BuildRfEdgesParams {
    placedObjects: string[];
    relationshipsByObject: Record<string, ErdRelationship[]>;
    fieldsByObject: Record<string, ErdField[]>;
    records: Record<string, ErdObjectRecord>;
    includeDocuments: boolean;
    includeUsersGroups: boolean;
    colorCodeEdges: boolean;
    showRelationshipLineLabels: boolean;
    edgeColors: ErdEdgeColorOverrides;
    hiddenJoinNames: Set<string>;
    joinInfoByName: Map<string, JoinObjectInfo>;
    highlightAnchor: string | null;
}

/** The parts of an edge that differ between the reference, users/groups, and many-to-many passes. */
interface FloatingEdgeSpec {
    id: string;
    source: string;
    target: string;
    relationshipName: string;
    relationshipType: string;
    isDocument: boolean;
    externalTarget?: string;
    owningField?: ErdField;
    /** Shown on the line when relationship line labels are on. */
    label: string;
    dashed: boolean;
    labelSlot: LabelFanOutSlot;
    /** Collapsed many-to-many edges carry an arrow at both ends, since neither side owns the other. */
    arrowAtBothEnds?: boolean;
}

/** How the whole diagram is styled, as opposed to what one edge is. */
interface FloatingEdgeStyleContext {
    colorCodeEdges: boolean;
    edgeColors: ErdEdgeColorOverrides;
    showRelationshipLineLabels: boolean;
    highlightAnchor: string | null;
}

/**
 * Build one React Flow edge: resolves its stroke colour (colour-coding, then the selected object's
 * inbound/outbound highlight, which always wins), its arrow size, and its optional line label.
 */
function toFloatingEdge(
    spec: FloatingEdgeSpec,
    { colorCodeEdges, edgeColors, showRelationshipLineLabels, highlightAnchor }: FloatingEdgeStyleContext,
): Edge {
    const highlight = classifyEdgeHighlight(highlightAnchor, spec.source, spec.target);
    let edgeColor = colorCodeEdges
        ? edgeDisplayColor(spec.relationshipType, spec.externalTarget, edgeColors)
        : UNIFORM_EDGE_COLOR;
    if (highlight === 'out') edgeColor = ERD_HIGHLIGHT_OUTBOUND;
    else if (highlight === 'in') edgeColor = ERD_HIGHLIGHT_INBOUND;

    // Highlighted edges draw a thicker line, so their arrowhead shrinks to stay in proportion.
    const arrowSize = highlight ? EDGE_ARROW_SIZE / 2 : EDGE_ARROW_SIZE;
    const marker = { type: MarkerType.ArrowClosed, color: edgeColor, width: arrowSize, height: arrowSize };

    return {
        id: spec.id,
        type: 'floating',
        source: spec.source,
        target: spec.target,
        zIndex: highlight ? 3 : 0,
        ...(showRelationshipLineLabels
            ? { label: spec.label, labelStyle: { fontSize: EDGE_LABEL_FONT_SIZE, fill: edgeColor } }
            : {}),
        data: {
            relationshipName: spec.relationshipName,
            relationshipType: spec.relationshipType,
            isDocument: spec.isDocument,
            externalTarget: spec.externalTarget,
            owningField: spec.owningField,
            highlight,
            siblingIndex: spec.labelSlot.index,
            siblingCount: spec.labelSlot.count,
        },
        ...(spec.arrowAtBothEnds ? { markerStart: marker } : {}),
        markerEnd: marker,
        style: {
            stroke: edgeColor,
            strokeWidth: highlight ? EDGE_STROKE_WIDTH_HIGHLIGHT : EDGE_STROKE_WIDTH,
            strokeDasharray: spec.dashed ? EXTERNAL_EDGE_DASH : undefined,
        },
    };
}

/** Derives all React Flow edges from the current canvas + relationship state. Pure — no React. */
export function buildRfEdges({
    placedObjects,
    relationshipsByObject,
    fieldsByObject,
    records,
    includeDocuments,
    includeUsersGroups,
    colorCodeEdges,
    showRelationshipLineLabels,
    edgeColors,
    hiddenJoinNames,
    joinInfoByName,
    highlightAnchor,
}: BuildRfEdgesParams): Edge[] {
    const styleContext: FloatingEdgeStyleContext = {
        colorCodeEdges,
        edgeColors,
        showRelationshipLineLabels,
        highlightAnchor,
    };

    const derivedEdges = deriveEdges(placedObjects, relationshipsByObject, {
        includeDocuments,
        includeUsersGroups,
        includeLifecycleObjects: true,
    });
    const visibleDerivedEdges = derivedEdges.filter(
        (derivedEdge) => !hiddenJoinNames.has(derivedEdge.source) && !hiddenJoinNames.has(derivedEdge.target),
    );
    // Several relationships often connect the same two objects (e.g. lead_auditor__c, main_contact__c,
    // owner__v all pointing at the same target) — their labels fan out from the shared midpoint instead
    // of clustering on it (see siblingLabelOffset in FloatingEdge's geometry hook).
    const labelFanOutSlots = groupEdgesForLabelFanOut(visibleDerivedEdges);
    const rfEdges: Edge[] = visibleDerivedEdges.map((derivedEdge) => {
        const sourceFields = records[derivedEdge.source]?.fields ?? [];
        const owningField = sourceFields.find((field) => field.outboundName === derivedEdge.relationshipName);
        const relationshipType = owningField?.relationshipType ?? (derivedEdge.isDocument ? 'document' : 'reference');
        return toFloatingEdge(
            {
                id: derivedEdge.id,
                source: derivedEdge.source,
                target: derivedEdge.target,
                relationshipName: derivedEdge.relationshipName,
                relationshipType,
                isDocument: derivedEdge.isDocument,
                externalTarget: derivedEdge.externalTarget,
                owningField,
                label: relationshipLineLabel(derivedEdge.relationshipName, relationshipType, owningField?.inboundName),
                dashed: !!derivedEdge.externalTarget,
                labelSlot: labelFanOutSlots.get(derivedEdge) ?? LONE_LABEL_SLOT,
            },
            styleContext,
        );
    });

    const visibleUserGroupEdges = deriveUserGroupEdges(placedObjects, fieldsByObject, { includeUsersGroups }).filter(
        (userGroupEdge) => !hiddenJoinNames.has(userGroupEdge.source),
    );
    const userGroupLabelFanOutSlots = groupEdgesForLabelFanOut(visibleUserGroupEdges);
    visibleUserGroupEdges.forEach((userGroupEdge) => {
        const owningField = fieldsByObject[userGroupEdge.source]?.find(
            (field) => field.name === userGroupEdge.owningFieldName,
        );
        rfEdges.push(
            toFloatingEdge(
                {
                    id: userGroupEdge.id,
                    source: userGroupEdge.source,
                    target: userGroupEdge.target,
                    relationshipName: userGroupEdge.relationshipName,
                    relationshipType: 'reference',
                    isDocument: false,
                    externalTarget: userGroupEdge.externalTarget,
                    owningField,
                    label: relationshipLineLabel(userGroupEdge.relationshipName, 'reference', owningField?.inboundName),
                    dashed: true,
                    labelSlot: userGroupLabelFanOutSlots.get(userGroupEdge) ?? LONE_LABEL_SLOT,
                },
                styleContext,
            ),
        );
    });

    const visibleParentNames = new Set(placedObjects.filter((name) => !hiddenJoinNames.has(name)));
    const collapsedJoins = collapsedJoinsOf(joinInfoByName, hiddenJoinNames);
    deriveJoinEdges(collapsedJoins, visibleParentNames).forEach((manyToManyEdge) => {
        const relationshipType =
            manyToManyEdge.kind === 'complex' ? MANY_TO_MANY_COMPLEX_TYPE : MANY_TO_MANY_SIMPLE_TYPE;
        rfEdges.push(
            toFloatingEdge(
                {
                    id: manyToManyEdge.id,
                    source: manyToManyEdge.source,
                    target: manyToManyEdge.target,
                    relationshipName: manyToManyEdge.joinName,
                    relationshipType,
                    isDocument: false,
                    label: manyToManyRelationshipLineLabel(manyToManyEdge.joinName, manyToManyEdge.kind),
                    dashed: false,
                    labelSlot: LONE_LABEL_SLOT,
                    arrowAtBothEnds: true,
                },
                styleContext,
            ),
        );
    });

    const seenEdgeIds = new Set<string>();
    return rfEdges.filter((edge) => {
        if (seenEdgeIds.has(edge.id)) return false;
        seenEdgeIds.add(edge.id);
        return true;
    });
}
