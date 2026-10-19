import { describe, it, expect } from 'vitest';
import { Position } from '@xyflow/react';
import {
    parseObjectList,
    parseObjectFields,
    parseRelationships,
    parseRelationshipsFromMetadata,
    parseObjectMeta,
} from './schema/ErdExplorerApiResponseParsing';
import {
    isExternalTarget,
    isUsersGroupsTarget,
    classifyField,
    relationshipsOnlyFieldNames,
    isHiddenLifecycleObject,
    sourceFromSuffix,
    splitInboundOutbound,
    highlightZoomScale,
    analyzeJoinObject,
    formatSchemaLoadProgress,
} from './ErdExplorerHelper';
import {
    deriveEdges,
    deriveJoinEdges,
    deriveUserGroupEdges,
    userGroupTargetsFromFields,
    buildRfEdges,
    relationshipLineLabel,
    relationshipKindLabel,
} from './graph/ErdExplorerEdgeHelpers';
import {
    neighborObjectsOf,
    classifyRecursiveAddCount,
    discoverJoinCandidateNames,
} from './graph/ErdExplorerRecursionHelpers';
import {
    getFloatingEdgeParams,
    sourceAnchorY,
    LABEL_ANCHOR_OFFSET,
    groupEdgesForLabelFanOut,
    siblingLabelOffset,
} from './graph/ErdExplorerGeometryHelpers';
import { applyErdLayout } from './graph/ErdExplorerLayoutHelpers';
import type { ErdField } from './ErdExplorerTypes';
import { DOCUMENTS_TARGET, USERS_TARGET, type ErdRelationship } from './ErdExplorerTypes';

/**
 * Inline response fixtures shaped exactly like the live Vault payloads documented in
 * ErdExplorerTypes.ts. Kept in the test file so the suite has no external file dependency.
 */
const objectListResp = {
    objects: [
        { name: 'product__v', label: 'Product', label_plural: 'Products', source: 'standard', prefix: '00P' },
        { name: 'pm_application__v', label: 'Application', label_plural: 'Applications', source: 'standard', prefix: '00A' },
        { name: 'product_family__v', label: 'Product Family', label_plural: 'Product Families', source: 'standard' },
        { name: 'campaign__c', label: 'Campaign', label_plural: 'Campaigns', source: 'custom' },
    ],
};

const productMetaResp = {
    object: {
        name: 'product__v',
        label: 'Product',
        object_class: 'base',
        description: null,
        fields: [
            { name: 'name__v', label: 'Name', type: 'String', required: true, source: 'standard', unique: true },
            { name: 'status__v', label: 'Status', type: 'Picklist', source: 'standard' },
            { name: 'global_id__sys', label: 'Global ID', type: 'String', source: 'system' },
            { name: 'notes__c', label: 'Notes', type: 'String', source: 'custom' },
            {
                name: 'application__c',
                label: 'Application',
                type: 'Object',
                relationship_type: 'reference',
                object: { name: 'pm_application__v', label: 'Application' },
                relationship_outbound_name: 'application__cr',
                relationship_inbound_name: 'products__cr',
                relationship_inbound_label: 'Products',
                relationship_deletion: 'block',
                source: 'custom',
            },
            {
                name: 'product_family__v',
                label: 'Product Family',
                type: 'Object',
                relationship_type: 'reference',
                object: { name: 'product_family__v', label: 'Product Family' },
                relationship_outbound_name: 'product_family__vr',
                source: 'standard',
            },
            {
                name: 'current_pilabel_number__c',
                label: 'Current PI Label Number',
                type: 'Object',
                relationship_type: 'reference',
                object: { name: 'documents', label: 'Documents' },
                relationship_outbound_name: 'current_pilabel_number__cr',
                source: 'custom',
            },
        ],
        relationships: [
            { relationship_name: 'application__cr', relationship_type: 'reference_outbound', object: { name: 'pm_application__v' } },
            { relationship_name: 'product_family__vr', relationship_type: 'reference_outbound', object: { name: 'product_family__v' } },
            { relationship_name: 'current_pilabel_number__cr', relationship_type: 'reference_outbound', object: { name: 'documents' } },
            { relationship_name: 'product_indication_joins__vr', relationship_type: 'child', object: { name: 'product_indication_join__v' } },
            { relationship_name: 'dosages__vr', relationship_type: 'reference_inbound', object: { name: 'dosage__v' } },
        ],
    },
};

/**
 * `SHOW RELATIONSHIPS FROM product__v`: 23 rows — 7 outbound (one self-referencing, one at users, so
 * 5 visible by default) and 16 inbound (all visible). The counts are asserted below.
 */
const productRelsResp = {
    data: [
        { name: 'application__cr', target: 'pm_application__v', type: 'outbound' },
        { name: 'current_pilabel_number__cr', target: 'documents', type: 'outbound' },
        { name: 'submission_applicant__vr', target: '2253submissionapplicant__v', type: 'outbound' },
        { name: 'product_family__vr', target: 'product_family__v', type: 'outbound' },
        { name: 'dosage_form__vr', target: 'dosage_form__v', type: 'outbound' },
        { name: 'parent_product__vr', target: 'product__v', type: 'outbound' },
        { name: 'created_by__vr', target: 'users', type: 'outbound' },
        { name: 'product_indication_joins__vr', target: 'product_indication_join__v', type: 'inbound' },
        { name: 'dosages__vr', target: 'dosage__v', type: 'inbound' },
        { name: 'attachments__sysr', target: 'attachment_object__sys', type: 'inbound' },
        { name: 'product_countries__vr', target: 'product_country__v', type: 'inbound' },
        { name: 'product_studies__vr', target: 'study__v', type: 'inbound' },
        { name: 'inspections__vr', target: 'inspection__v', type: 'inbound' },
        { name: 'submissions__vr', target: 'submission__v', type: 'inbound' },
        { name: 'registrations__vr', target: 'registration__v', type: 'inbound' },
        { name: 'manufacturers__vr', target: 'manufacturer__v', type: 'inbound' },
        { name: 'packagings__vr', target: 'packaging__v', type: 'inbound' },
        { name: 'specifications__vr', target: 'specification__v', type: 'inbound' },
        { name: 'batches__vr', target: 'batch__v', type: 'inbound' },
        { name: 'complaints__vr', target: 'complaint__v', type: 'inbound' },
        { name: 'deviations__vr', target: 'deviation__v', type: 'inbound' },
        { name: 'labels__vr', target: 'product_label__v', type: 'inbound' },
        { name: 'campaigns__cr', target: 'campaign__c', type: 'inbound' },
    ],
};

describe('parseObjectList', () => {
    it('maps every object with name/label/source', () => {
        const objects = parseObjectList(objectListResp);
        expect(objects).toHaveLength(objectListResp.objects.length);
        const product = objects.find((object) => object.name === 'product__v');
        expect(product).toMatchObject({ name: 'product__v', label: 'Product', source: 'standard' });
    });

    it('returns [] for a missing/empty payload', () => {
        expect(parseObjectList(undefined)).toEqual([]);
        expect(parseObjectList({})).toEqual([]);
    });
});

describe('parseObjectFields', () => {
    it('reads fields from object.fields and flags reference fields', () => {
        const fields = parseObjectFields(productMetaResp);
        expect(fields.length).toBe(productMetaResp.object.fields.length);
        const ref = fields.find((field) => field.name === 'application__c');
        expect(ref).toMatchObject({
            isReference: true,
            relationshipType: 'reference',
            targetObject: 'pm_application__v',
            outboundName: 'application__cr',
        });
    });

    it('resolves the target object name from the nested object descriptor', () => {
        const fields = parseObjectFields(productMetaResp);
        const docField = fields.find((field) => field.name === 'current_pilabel_number__c');
        expect(docField?.targetObject).toBe(DOCUMENTS_TARGET);
    });

    it('captures the authoritative field source and uniqueness flag', () => {
        const fields = parseObjectFields(productMetaResp);
        const name = fields.find((field) => field.name === 'name__v');
        expect(name).toMatchObject({ source: 'standard', unique: true });
    });
});

describe('parseObjectMeta', () => {
    it('reads object_class and description from the object metadata response', () => {
        const meta = parseObjectMeta(productMetaResp);
        expect(meta.objectClass).toBe(productMetaResp.object.object_class);
        // product__v's description is null in the fixture → coerced to undefined.
        expect(meta.description).toBeUndefined();
    });
    it('returns {} for a missing payload', () => {
        expect(parseObjectMeta(undefined)).toEqual({});
        expect(parseObjectMeta({})).toEqual({});
    });
});

describe('classifyField', () => {
    const fields = parseObjectFields(productMetaResp);
    const byName = (name: string) => fields.find((field) => field.name === name)!;

    it('classifies object-type fields as reference regardless of suffix', () => {
        expect(classifyField(byName('application__c'))).toBe('reference'); // reference beats __c
        expect(classifyField(byName('product_family__v'))).toBe('reference');
    });

    it('classifies __c non-reference fields as data', () => {
        const dataField = fields.find((field) => !field.isReference && field.name.endsWith('__c'));
        if (dataField) expect(classifyField(dataField)).toBe('data');
    });

    it('classifies non-reference __v fields as standard', () => {
        expect(classifyField(byName('name__v'))).toBe('standard');
    });

    it('classifies __sys and the id field as system', () => {
        const sysField = fields.find((field) => !field.isReference && field.name.endsWith('__sys'));
        if (sysField) expect(classifyField(sysField)).toBe('system');
        expect(classifyField({ name: 'id', label: 'ID', type: 'ID', isReference: false })).toBe('system');
    });
});

describe('relationshipsOnlyFieldNames', () => {
    const ref = (name: string): ErdField => ({ name, label: name, type: 'Object', isReference: true });
    const plain = (name: string): ErdField => ({ name, label: name, type: 'Text', isReference: false });

    it('returns reference field names but excludes created_by__v / modified_by__v', () => {
        const fields = [ref('application__c'), plain('name__v'), ref('created_by__v'), ref('modified_by__v')];
        expect(relationshipsOnlyFieldNames(fields)).toEqual(['application__c']);
    });

    it('excludes non-reference fields entirely', () => {
        expect(relationshipsOnlyFieldNames([plain('name__v'), plain('status__v')])).toEqual([]);
    });
});

describe('isHiddenLifecycleObject', () => {
    it('flags the two lifecycle system objects and nothing else', () => {
        expect(isHiddenLifecycleObject('object_lifecycle_state_stage__sys')).toBe(true);
        expect(isHiddenLifecycleObject('object_lifecycle_stage_label__sys')).toBe(true);
        expect(isHiddenLifecycleObject('product__v')).toBe(false);
        expect(isHiddenLifecycleObject('some_other__sys')).toBe(false);
    });
});

describe('deriveEdges lifecycle-object hiding', () => {
    const relByObject: Record<string, ErdRelationship[]> = {
        product__v: [{ name: 'stage__cr', target: 'object_lifecycle_state_stage__sys', direction: 'outbound' }],
        object_lifecycle_state_stage__sys: [],
    };
    const placed = ['product__v', 'object_lifecycle_state_stage__sys'];

    it('omits edges to a hidden lifecycle object by default', () => {
        expect(deriveEdges(placed, relByObject)).toHaveLength(0);
    });

    it('draws them when includeLifecycleObjects is on', () => {
        const edges = deriveEdges(placed, relByObject, { includeLifecycleObjects: true });
        expect(edges).toHaveLength(1);
        expect(edges[0].target).toBe('object_lifecycle_state_stage__sys');
    });
});

describe('formatSchemaLoadProgress', () => {
    it('says it is starting before the first page lands', () => {
        const message = formatSchemaLoadProgress({ pagesLoaded: 0, objectsParsed: 0, derivingRelationships: false });

        expect(message).toContain('Reading');
    });

    it('reports the object count once pages are landing', () => {
        const message = formatSchemaLoadProgress({ pagesLoaded: 3, objectsParsed: 2400, derivingRelationships: false });

        expect(message).toContain('2,400 objects');
    });

    it('singularises a single object', () => {
        const message = formatSchemaLoadProgress({ pagesLoaded: 1, objectsParsed: 1, derivingRelationships: false });

        expect(message).toContain('1 object…');
    });

    it('reports the final relationship-derivation step rather than a count', () => {
        const message = formatSchemaLoadProgress({ pagesLoaded: 4, objectsParsed: 2400, derivingRelationships: true });

        expect(message).toBe('Building relationships…');
    });
});

describe('sourceFromSuffix', () => {
    it('maps suffixes to sources', () => {
        expect(sourceFromSuffix('global_id__sys')).toBe('system');
        expect(sourceFromSuffix('product__v')).toBe('standard');
        expect(sourceFromSuffix('application__c')).toBe('custom');
        expect(sourceFromSuffix('weird')).toBe('unknown');
    });
});

describe('external target helpers', () => {
    it('treats documents/users/groups as external; users/groups distinctly', () => {
        expect(isExternalTarget('documents')).toBe(true);
        expect(isExternalTarget('users')).toBe(true);
        expect(isExternalTarget('pm_application__v')).toBe(false);
        expect(isUsersGroupsTarget('users')).toBe(true);
        expect(isUsersGroupsTarget('documents')).toBe(false);
    });
});

describe('parseRelationships', () => {
    it('maps SHOW RELATIONSHIPS rows to {name,target,direction}', () => {
        const rels = parseRelationships(productRelsResp);
        expect(rels).toHaveLength(23);
        expect(rels).toContainEqual({ name: 'application__cr', target: 'pm_application__v', direction: 'outbound' });
    });

    it('reads from a query-wrapped payload too', () => {
        const rels = parseRelationships({ queryResponse: { data: productRelsResp.data } });
        expect(rels).toHaveLength(23);
    });
});

describe('parseRelationshipsFromMetadata', () => {
    it('derives relationships from the object-metadata response (no SHOW RELATIONSHIPS call needed)', () => {
        const rels = parseRelationshipsFromMetadata(productMetaResp);
        // reference_outbound / parent → outbound; reference_inbound / child → inbound.
        expect(rels).toContainEqual({ name: 'application__cr', target: 'pm_application__v', direction: 'outbound' });
        // Documents references are included, as outbound.
        expect(rels).toContainEqual({ name: 'current_pilabel_number__cr', target: 'documents', direction: 'outbound' });
        // A child (join/child object) shows as inbound.
        expect(rels).toContainEqual({ name: 'product_indication_joins__vr', target: 'product_indication_join__v', direction: 'inbound' });
        // Covers everything the fixture's relationships array carries.
        expect(rels).toHaveLength(productMetaResp.object.relationships.length);
    });

    it('returns [] for a payload with no relationships', () => {
        expect(parseRelationshipsFromMetadata(undefined)).toEqual([]);
        expect(parseRelationshipsFromMetadata({ object: {} })).toEqual([]);
    });
});

describe('splitInboundOutbound', () => {
    const rels = () => parseRelationships(productRelsResp);

    it('splits product__v into 5 outbound / 16 inbound (self-target + users/groups removed by default)', () => {
        const { inbound, outbound } = splitInboundOutbound(rels(), { selfName: 'product__v' });
        expect(outbound).toHaveLength(5);
        expect(inbound).toHaveLength(16);
        expect(inbound.every((relationship) => relationship.target !== 'product__v')).toBe(true);
    });

    it('drops document relationships when includeDocuments is false', () => {
        const withDocs = splitInboundOutbound(rels(), { selfName: 'product__v', includeDocuments: true });
        const noDocs = splitInboundOutbound(rels(), { selfName: 'product__v', includeDocuments: false });
        expect(withDocs.outbound.some((relationship) => relationship.target === DOCUMENTS_TARGET)).toBe(true);
        expect(noDocs.outbound.some((relationship) => relationship.target === DOCUMENTS_TARGET)).toBe(false);
    });

    it('hides users/groups unless includeUsersGroups is set', () => {
        const withUsers: ErdRelationship[] = [
            { name: 'created_by__vr', target: USERS_TARGET, direction: 'outbound' },
        ];
        expect(splitInboundOutbound(withUsers, {}).outbound).toHaveLength(0);
        expect(splitInboundOutbound(withUsers, { includeUsersGroups: true }).outbound).toHaveLength(1);
    });

    it('hides phantom targets (not in knownObjects, e.g. attachment_object__sys)', () => {
        const rels = parseRelationships(productRelsResp);
        const hasPhantom = rels.some((relationship) => relationship.target === 'attachment_object__sys');
        expect(hasPhantom).toBe(true); // fixture sanity
        // knownObjects includes real targets but NOT attachment_object__sys
        const knownObjects = new Set(rels.map((relationship) => relationship.target).filter((targetName) => targetName !== 'attachment_object__sys'));
        const { inbound } = splitInboundOutbound(rels, { selfName: 'product__v', knownObjects });
        expect(inbound.some((relationship) => relationship.target === 'attachment_object__sys')).toBe(false);
        // real inbound targets are retained
        expect(inbound.some((relationship) => relationship.target === 'dosage__v')).toBe(true);
    });

    it('applies no phantom filter when knownObjects is empty/absent', () => {
        const rels = parseRelationships(productRelsResp);
        const { inbound } = splitInboundOutbound(rels, { selfName: 'product__v', knownObjects: new Set() });
        expect(inbound.some((relationship) => relationship.target === 'attachment_object__sys')).toBe(true);
    });

    it('hides object_type__v even when it IS in knownObjects (Vault catalogs it but its metadata endpoint 404s)', () => {
        const withObjectType: ErdRelationship[] = [
            { name: 'object_type__vr', target: 'object_type__v', direction: 'outbound' },
        ];
        const knownObjects = new Set(['object_type__v']);
        const { outbound } = splitInboundOutbound(withObjectType, { knownObjects });
        expect(outbound).toHaveLength(0);
    });
});

describe('deriveEdges', () => {
    const relByObject: Record<string, ErdRelationship[]> = {
        product__v: parseRelationships(productRelsResp),
    };

    it('draws an edge only when the outbound target is also placed', () => {
        const edges = deriveEdges(['product__v', 'pm_application__v'], relByObject, { includeDocuments: false });
        const appEdge = edges.find((edge) => edge.target === 'pm_application__v');
        expect(appEdge).toMatchObject({ source: 'product__v', target: 'pm_application__v' });
        // 2253submissionapplicant__v is an outbound target but is NOT placed -> no edge
        expect(edges.some((edge) => edge.target === '2253submissionapplicant__v')).toBe(false);
    });

    it('emits a documents edge when includeDocuments is true and none otherwise', () => {
        const withDocs = deriveEdges(['product__v'], relByObject, { includeDocuments: true });
        const noDocs = deriveEdges(['product__v'], relByObject, { includeDocuments: false });
        expect(withDocs.some((edge) => edge.isDocument && edge.target === DOCUMENTS_TARGET)).toBe(true);
        expect(noDocs.some((edge) => edge.isDocument)).toBe(false);
    });

    it('de-dups edge ids and emits at most one self-loop per self-referencing object', () => {
        const edges = deriveEdges(['product__v'], relByObject, { includeDocuments: true });
        const ids = edges.map((edge) => edge.id);
        expect(new Set(ids).size).toBe(ids.length); // ids are unique
        expect(edges.filter((edge) => edge.source === edge.target).length).toBeLessThanOrEqual(1);
    });

    it('emits a single self-loop edge for a self-referencing relationship', () => {
        const rels: Record<string, ErdRelationship[]> = {
            a__c: [
                { name: 'parent__cr', target: 'a__c', direction: 'outbound' },
                { name: 'parent__cr', target: 'a__c', direction: 'inbound' },
            ],
        };
        const edges = deriveEdges(['a__c'], rels);
        const selfLoops = edges.filter((edge) => edge.source === edge.target);
        expect(selfLoops).toHaveLength(1);
        expect(selfLoops[0]).toMatchObject({ source: 'a__c', target: 'a__c' });
    });

    it('emits users/groups edges only when includeUsersGroups is set, tagged externalTarget', () => {
        const rels: Record<string, ErdRelationship[]> = {
            a__c: [{ name: 'created_by__cr', target: USERS_TARGET, direction: 'outbound' }],
        };
        expect(deriveEdges(['a__c'], rels, {}).some((edge) => edge.externalTarget === USERS_TARGET)).toBe(false);
        const withUsers = deriveEdges(['a__c'], rels, { includeUsersGroups: true });
        expect(withUsers).toHaveLength(1);
        expect(withUsers[0]).toMatchObject({ target: USERS_TARGET, externalTarget: USERS_TARGET, isDocument: false });
    });
});

describe('deriveEdges inbound fallback (bidirectional)', () => {
    it('draws an edge from an inbound row when the FK owner has not loaded yet', () => {
        // b__v owns the FK to a__v, but only a__v's relationships have loaded (bulk-add race).
        const map: Record<string, ErdRelationship[]> = {
            a__v: [{ name: 'ba', target: 'b__v', direction: 'inbound' }],
        };
        const edges = deriveEdges(['a__v', 'b__v'], map);
        expect(edges).toHaveLength(1);
        expect(edges[0]).toMatchObject({ source: 'b__v', target: 'a__v', isDocument: false });
    });

    it('does not duplicate the edge once both endpoints have loaded', () => {
        const map: Record<string, ErdRelationship[]> = {
            a__v: [{ name: 'ba', target: 'b__v', direction: 'inbound' }],
            b__v: [{ name: 'ab', target: 'a__v', direction: 'outbound' }],
        };
        const edges = deriveEdges(['a__v', 'b__v'], map);
        expect(edges.filter((edge) => edge.source === 'b__v' && edge.target === 'a__v')).toHaveLength(1);
    });

    it('ignores inbound rows whose FK owner is not placed or is external', () => {
        const map: Record<string, ErdRelationship[]> = {
            a__v: [
                { name: 'x', target: 'unplaced__v', direction: 'inbound' },
                { name: 'y', target: 'documents', direction: 'inbound' },
            ],
        };
        expect(deriveEdges(['a__v'], map)).toHaveLength(0);
    });
});

describe('classifyRecursiveAddCount', () => {
    it('bands counts by the warn/refuse thresholds', () => {
        expect(classifyRecursiveAddCount(0, 100, 500)).toBe('ok');
        expect(classifyRecursiveAddCount(99, 100, 500)).toBe('ok');
        expect(classifyRecursiveAddCount(100, 100, 500)).toBe('warn');
        expect(classifyRecursiveAddCount(499, 100, 500)).toBe('warn');
        expect(classifyRecursiveAddCount(500, 100, 500)).toBe('refuse');
        expect(classifyRecursiveAddCount(1000, 100, 500)).toBe('refuse');
    });
});

describe('neighborObjectsOf', () => {
    const rels: ErdRelationship[] = [
        { name: 'r1', target: 'b__v', direction: 'outbound' },
        { name: 'r2', target: 'c__v', direction: 'inbound' },
        { name: 'r3', target: 'b__v', direction: 'inbound' }, // dupe
        { name: 'r4', target: 'documents', direction: 'outbound' }, // external
        { name: 'r5', target: 'a__v', direction: 'inbound' }, // self
    ];

    it('returns both-direction real-object neighbours, excluding self/external/dupes', () => {
        expect(neighborObjectsOf(rels, 'a__v').sort()).toEqual(['b__v', 'c__v']);
    });

    it('restricts to outbound-only when directions.inbound is false', () => {
        expect(neighborObjectsOf(rels, 'a__v', undefined, { inbound: false, outbound: true })).toEqual(['b__v']);
    });

    it('restricts to inbound-only when directions.outbound is false', () => {
        expect(neighborObjectsOf(rels, 'a__v', undefined, { inbound: true, outbound: false }).sort()).toEqual([
            'b__v',
            'c__v',
        ]);
    });
});

describe('relationshipKindLabel', () => {
    it('maps relationship_type to a human kind', () => {
        expect(relationshipKindLabel('parent')).toBe('Parent-child');
        expect(relationshipKindLabel('child')).toBe('Parent-child');
        expect(relationshipKindLabel('document')).toBe('Document');
        expect(relationshipKindLabel('reference')).toBe('Reference');
        expect(relationshipKindLabel(undefined)).toBe('Reference');
        expect(relationshipKindLabel('manyToManySimple')).toBe('Many-to-many');
        expect(relationshipKindLabel('manyToManyComplex')).toBe('Many-to-many');
    });
});

describe('highlightZoomScale', () => {
    it('is 1 at zoom ≥ 1 and grows as you zoom out, clamped to 6', () => {
        expect(highlightZoomScale(1)).toBe(1);
        expect(highlightZoomScale(2)).toBe(1); // never below 1
        expect(highlightZoomScale(0.5)).toBe(2);
        expect(highlightZoomScale(0.1)).toBe(6); // 1/0.1 = 10 → clamped to 6
        expect(highlightZoomScale(0.01)).toBe(6); // guarded against divide-by-tiny, still clamped
    });
});

describe('relationshipLineLabel', () => {
    it('formats "<name> · <kind>" for named relationships', () => {
        expect(relationshipLineLabel('application__cr', 'reference')).toBe('application__cr · Reference');
        expect(relationshipLineLabel('product__cr', 'parent')).toBe('product__cr · Parent-child');
    });
    it('falls back to the kind alone when there is no relationship name', () => {
        expect(relationshipLineLabel(undefined, 'document')).toBe('Document');
        expect(relationshipLineLabel('', 'reference')).toBe('Reference');
    });
    it('shows both sides when the inbound name differs from the outbound name', () => {
        expect(relationshipLineLabel('submission__cr', 'parent', 'submission_investigational_products__cr')).toBe(
            'submission__cr / submission_investigational_products__cr · Parent-child',
        );
    });
    it('shows only one name when the inbound name matches the outbound name', () => {
        expect(relationshipLineLabel('application__cr', 'reference', 'application__cr')).toBe('application__cr · Reference');
    });
});

// A minimal ErdField factory for the join-classification tests (mirrors parsed metadata shape).
const field = (over: Partial<ErdField>): ErdField => ({
    name: over.name ?? 'f__c',
    label: over.label ?? over.name ?? 'F',
    type: over.type ?? 'String',
    isReference: over.isReference ?? (over.type === 'ObjectParent' || over.type === 'Object'),
    ...over,
});
// A Parent-Object field: metadata reports type 'Object' + relationship_type 'parent' (NOT 'ObjectParent').
const parentField = (name: string, target: string): ErdField =>
    field({ name, type: 'Object', isReference: true, relationshipType: 'parent', targetObject: target, source: 'standard' });

describe('analyzeJoinObject', () => {
    it('returns null when there are not exactly two parent (relationship_type=parent) fields', () => {
        expect(analyzeJoinObject([parentField('a__sys', 'a__v')])).toBeNull();
        expect(
            analyzeJoinObject([parentField('a__sys', 'a__v'), parentField('b__sys', 'b__v'), parentField('c__sys', 'c__v')]),
        ).toBeNull();
        expect(analyzeJoinObject([field({ name: 'name__v', source: 'standard' })])).toBeNull();
    });

    it('classifies a simple join (only standard fields besides the two parents)', () => {
        const info = analyzeJoinObject([
            field({ name: 'name__v', source: 'standard' }),
            parentField('user__sys', 'user__sys'),
            parentField('application_role__sys', 'application_role__sys'),
        ]);
        expect(info).toEqual({ parents: ['user__sys', 'application_role__sys'], kind: 'simple' });
    });

    it('classifies a complex join when a custom field is present (by source)', () => {
        const info = analyzeJoinObject([
            field({ name: 'name__v', source: 'standard' }),
            parentField('user__sys', 'user__sys'),
            parentField('application_role__sys', 'application_role__sys'),
            field({ name: 'note__c', source: 'custom' }),
        ]);
        expect(info).toEqual({ parents: ['user__sys', 'application_role__sys'], kind: 'complex' });
    });

    it('detects a join from parseObjectFields output (parent fields come back as type Object)', () => {
        // Mirrors the real /metadata/vobjects payload: a Parent-Object field is type 'Object' with
        // relationship_type 'parent' — this is the regression guard for the missed-join bug.
        const parsed = parseObjectFields({
            object: {
                fields: [
                    { name: 'id', type: 'ID' },
                    { name: 'name__v', type: 'String', source: 'standard' },
                    { name: 'author__c', type: 'Object', relationship_type: 'parent', object: { name: 'author__c' }, source: 'custom' },
                    { name: 'book__c', type: 'Object', relationship_type: 'parent', object: { name: 'book__c' }, source: 'custom' },
                ],
            },
        });
        expect(analyzeJoinObject(parsed)).toEqual({ parents: ['author__c', 'book__c'], kind: 'simple' });
    });

    it('falls back to the __c name suffix when source is absent', () => {
        const info = analyzeJoinObject([
            parentField('user__sys', 'user__sys'),
            parentField('role__sys', 'role__sys'),
            field({ name: 'extra__c' }),
        ]);
        expect(info?.kind).toBe('complex');
    });
});

describe('discoverJoinCandidateNames', () => {
    it('returns children that are inbound on >=2 placed objects and not placed', () => {
        const rels: Record<string, ErdRelationship[]> = {
            user__sys: [{ name: 'user_role__sysr', target: 'user_role__sys', direction: 'inbound' }],
            application_role__sys: [{ name: 'user_role__sysr', target: 'user_role__sys', direction: 'inbound' }],
        };
        expect(discoverJoinCandidateNames(['user__sys', 'application_role__sys'], rels)).toEqual(['user_role__sys']);
    });

    it('ignores children shared by only one placed object, already-placed children, and external targets', () => {
        const rels: Record<string, ErdRelationship[]> = {
            user__sys: [
                { name: 'a', target: 'only_one__sys', direction: 'inbound' },
                { name: 'b', target: 'documents', direction: 'inbound' },
                { name: 'c', target: 'user_role__sys', direction: 'inbound' },
            ],
            role__sys: [{ name: 'c', target: 'user_role__sys', direction: 'inbound' }],
        };
        // user_role__sys is already placed, so it is excluded; only_one__sys has one parent; documents is external.
        expect(discoverJoinCandidateNames(['user__sys', 'role__sys', 'user_role__sys'], rels)).toEqual([]);
    });
});

describe('deriveJoinEdges', () => {
    const joins = [
        { name: 'user_role__sys', parents: ['user__sys', 'role__sys'] as [string, string], kind: 'complex' as const },
    ];

    it('emits one M:M edge when both parents are placed', () => {
        expect(deriveJoinEdges(joins, new Set(['user__sys', 'role__sys']))).toEqual([
            { id: 'mm:user_role__sys:user__sys->role__sys', source: 'user__sys', target: 'role__sys', joinName: 'user_role__sys', kind: 'complex' },
        ]);
    });

    it('emits nothing when a parent is missing', () => {
        expect(deriveJoinEdges(joins, new Set(['user__sys']))).toEqual([]);
    });

    it('skips self-joins (both parents equal)', () => {
        const selfJoin = [{ name: 'j__c', parents: ['x__v', 'x__v'] as [string, string], kind: 'simple' as const }];
        expect(deriveJoinEdges(selfJoin, new Set(['x__v']))).toEqual([]);
    });
});

describe('buildRfEdges colour-coding and collapsed M:M labels', () => {
    const edgeColors = { reference: '#ref', parentChild: '#pc', simpleJoin: '#mms', complexJoin: '#mmc' };

    it('colour-codes parent-child and reference edges by relationship type', () => {
        const edges = buildRfEdges({
            placedObjects: ['child_parent__v', 'parent__v', 'child_ref__v', 'ref_target__v'],
            relationshipsByObject: {
                child_parent__v: [{ name: 'parent_rel', target: 'parent__v', direction: 'outbound' }],
                child_ref__v: [{ name: 'ref_rel', target: 'ref_target__v', direction: 'outbound' }],
            },
            fieldsByObject: {},
            records: {
                child_parent__v: {
                    status: 'ready',
                    fields: [
                        { name: 'parent_rel', label: 'Parent', type: 'Object', isReference: true, relationshipType: 'parent', outboundName: 'parent_rel' },
                    ],
                    relationships: [],
                },
                child_ref__v: {
                    status: 'ready',
                    fields: [{ name: 'ref_rel', label: 'Ref', type: 'Object', isReference: true, outboundName: 'ref_rel' }],
                    relationships: [],
                },
            },
            includeDocuments: true,
            includeUsersGroups: false,
            colorCodeEdges: true,
            showRelationshipLineLabels: false,
            edgeColors,
            hiddenJoinNames: new Set(),
            joinInfoByName: new Map(),
            highlightAnchor: null,
        });

        expect(edges.find((edge) => edge.id === 'child_parent__v->parent__v:parent_rel')?.style?.stroke).toBe('#pc');
        expect(edges.find((edge) => edge.id === 'child_ref__v->ref_target__v:ref_rel')?.style?.stroke).toBe('#ref');
    });

    it('labels and colour-codes collapsed many-to-many edges by join kind', () => {
        const baseParams = {
            placedObjects: ['user__sys', 'role__sys'],
            relationshipsByObject: {},
            fieldsByObject: {},
            records: {},
            includeDocuments: true,
            includeUsersGroups: false,
            colorCodeEdges: true,
            showRelationshipLineLabels: true,
            edgeColors,
            highlightAnchor: null,
        };

        const complexEdges = buildRfEdges({
            ...baseParams,
            hiddenJoinNames: new Set(['user_role__sys']),
            joinInfoByName: new Map([['user_role__sys', { parents: ['user__sys', 'role__sys'], kind: 'complex' }]]),
        });
        const complexEdge = complexEdges.find((edge) => edge.id === 'mm:user_role__sys:user__sys->role__sys');
        expect(complexEdge?.label).toBe('user_role__sys · Many-to-Many · Complex');
        expect(complexEdge?.style?.stroke).toBe('#mmc');

        const simpleEdges = buildRfEdges({
            ...baseParams,
            hiddenJoinNames: new Set(['lang_locale__sys']),
            joinInfoByName: new Map([['lang_locale__sys', { parents: ['user__sys', 'role__sys'], kind: 'simple' }]]),
        });
        const simpleEdge = simpleEdges.find((edge) => edge.id === 'mm:lang_locale__sys:user__sys->role__sys');
        expect(simpleEdge?.label).toBe('lang_locale__sys · Many-to-Many · Simple');
        expect(simpleEdge?.style?.stroke).toBe('#mms');
    });
});

describe('getFloatingEdgeParams', () => {
    const source = { x: 0, y: 0, width: 100, height: 100 }; // center (50, 50)

    it('exits the source Right and enters the target Top when the target is down-right', () => {
        const target = { x: 300, y: 300, width: 100, height: 100 }; // center (350, 350)
        const params = getFloatingEdgeParams(source, target);
        expect(params.sourcePosition).toBe(Position.Right);
        expect(params).toMatchObject({ sourceX: 100, sourceY: 50 }); // right edge, mid-height
        expect(params.targetPosition).toBe(Position.Top);
        expect(params).toMatchObject({ targetX: 350, targetY: 300 }); // top edge, mid-width
    });

    it('exits the source Left and enters the target Bottom when the target is up-left', () => {
        const target = { x: -300, y: -300, width: 100, height: 100 }; // center (-250, -250)
        const params = getFloatingEdgeParams(source, target);
        expect(params.sourcePosition).toBe(Position.Left);
        expect(params).toMatchObject({ sourceX: 0, sourceY: 50 });
        expect(params.targetPosition).toBe(Position.Bottom);
        expect(params).toMatchObject({ targetX: -250, targetY: -200 }); // bottom edge = y + height
    });
});

describe('deriveUserGroupEdges / userGroupTargetsFromFields', () => {
    const field = (name: string, targetObject?: string): ErdField => ({
        name,
        label: name,
        type: targetObject ? 'Object' : 'String',
        isReference: !!targetObject,
        targetObject,
    });
    const fieldsByObject: Record<string, ErdField[]> = {
        product__v: [
            field('created_by__v', 'users'),
            field('modified_by__v', 'users'),
            field('application__c', 'pm_application__v'),
            field('name__v'),
        ],
    };

    it('returns nothing when the Users & Groups toggle is off', () => {
        expect(deriveUserGroupEdges(['product__v'], fieldsByObject, { includeUsersGroups: false })).toEqual([]);
    });

    it('emits one edge per users/groups reference field (ignoring object + non-reference fields)', () => {
        const edges = deriveUserGroupEdges(['product__v'], fieldsByObject, { includeUsersGroups: true });
        expect(edges).toHaveLength(2);
        expect(edges.map((edge) => edge.owningFieldName).sort()).toEqual(['created_by__v', 'modified_by__v']);
        expect(edges.every((edge) => edge.target === 'users' && edge.externalTarget === 'users' && !edge.isDocument)).toBe(true);
    });

    it('collects the distinct users/groups targets referenced by fields', () => {
        const fields: Record<string, ErdField[]> = {
            a__v: [field('created_by__v', 'users'), field('grp__c', 'groups'), field('app__c', 'pm_application__v')],
        };
        expect([...userGroupTargetsFromFields(['a__v'], fields)].sort()).toEqual(['groups', 'users']);
    });
});

describe('sourceAnchorY', () => {
    const handles = [
        { id: 'a__c', y: 40, height: 6 },
        { id: 'b__c', y: 80, height: 6 },
    ];

    it('anchors at the owning field row centre when its handle is present', () => {
        expect(sourceAnchorY(handles, 100, 'b__c')).toBe(100 + 80 + 3); // rectY + handle.y + height/2
    });

    it('falls back to the label offset when the field is hidden, missing, or absent', () => {
        expect(sourceAnchorY(handles, 100, 'zzz__c')).toBe(100 + LABEL_ANCHOR_OFFSET);
        expect(sourceAnchorY(null, 100, 'a__c')).toBe(100 + LABEL_ANCHOR_OFFSET);
        expect(sourceAnchorY(handles, 100, undefined)).toBe(100 + LABEL_ANCHOR_OFFSET);
    });
});

describe('groupEdgesForLabelFanOut', () => {
    it('groups edges sharing the same two endpoints regardless of direction, and leaves lone edges at count 1', () => {
        const edges = [
            { source: 'a', target: 'b' },
            { source: 'b', target: 'a' },
            { source: 'a', target: 'b' },
            { source: 'a', target: 'c' },
        ];
        const slots = groupEdgesForLabelFanOut(edges);
        expect(slots.get(edges[0])).toEqual({ index: 0, count: 3 });
        expect(slots.get(edges[1])).toEqual({ index: 1, count: 3 });
        expect(slots.get(edges[2])).toEqual({ index: 2, count: 3 });
        expect(slots.get(edges[3])).toEqual({ index: 0, count: 1 });
    });

    it('treats a self-loop as its own group, separate from edges to other nodes', () => {
        const edges = [
            { source: 'a', target: 'a' },
            { source: 'a', target: 'a' },
            { source: 'a', target: 'b' },
        ];
        const slots = groupEdgesForLabelFanOut(edges);
        expect(slots.get(edges[0])).toEqual({ index: 0, count: 2 });
        expect(slots.get(edges[1])).toEqual({ index: 1, count: 2 });
        expect(slots.get(edges[2])).toEqual({ index: 0, count: 1 });
    });
});

describe('siblingLabelOffset', () => {
    it('is zero for a lone edge (count 1)', () => {
        expect(siblingLabelOffset(100, 0, 0, 1)).toEqual({ dx: 0, dy: 0 });
    });

    it('spreads siblings symmetrically perpendicular to the edge, centered on the midpoint', () => {
        // Horizontal edge (dy=0): perpendicular is vertical, so offsets land purely on dy.
        const first = siblingLabelOffset(100, 0, 0, 3);
        const middle = siblingLabelOffset(100, 0, 1, 3);
        const last = siblingLabelOffset(100, 0, 2, 3);
        expect(middle.dx).toBeCloseTo(0);
        expect(middle.dy).toBeCloseTo(0);
        expect(first.dx).toBeCloseTo(0);
        expect(last.dx).toBeCloseTo(0);
        expect(first.dy).toBeCloseTo(-last.dy);
        expect(first.dy).not.toBeCloseTo(0);
    });
});

describe('applyErdLayout', () => {
    it('puts the high-inbound target on top and respects variable node sizes (no overlap)', () => {
        const nodes = [
            { id: 'p', position: { x: 0, y: 0 }, data: {}, measured: { width: 200, height: 300 } }, // parent/target (tall)
            { id: 'c', position: { x: 0, y: 0 }, data: {}, measured: { width: 200, height: 80 } }, // child/source
        ];
        // Edge c → p: p is the INBOUND target, so it ranks ABOVE its referrer c (edges are reversed for dagre).
        const edges = [{ id: 'e', source: 'c', target: 'p' }];
        const laid = applyErdLayout(nodes as never, edges as never);
        const parent = laid.nodes.find((node) => node.id === 'p')!;
        const child = laid.nodes.find((node) => node.id === 'c')!;
        // The high-inbound parent is on top, and the child starts below the parent's FULL 300px height.
        expect(parent.position.y).toBeLessThan(child.position.y);
        expect(child.position.y).toBeGreaterThan(parent.position.y + 300);
    });

    it('assigns numeric positions to every node and preserves edges', () => {
        const nodes = [
            { id: 'product__v', position: { x: 0, y: 0 }, data: {} },
            { id: 'pm_application__v', position: { x: 0, y: 0 }, data: {} },
        ];
        const edges = [{ id: 'e1', source: 'product__v', target: 'pm_application__v' }];
        const laid = applyErdLayout(nodes as never, edges as never);
        expect(laid.nodes).toHaveLength(2);
        laid.nodes.forEach((node) => {
            expect(typeof node.position.x).toBe('number');
            expect(typeof node.position.y).toBe('number');
        });
        expect(laid.edges).toHaveLength(1);
    });
});
