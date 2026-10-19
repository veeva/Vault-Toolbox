import { describe, it, expect } from 'vitest';
import {
    serializeProject,
    deserializeProject,
    projectVaultMismatchMessage,
    projectDiffersFromSchema,
    ERD_PROJECT_VERSION,
} from './ErdExplorerProject';
import { initialErdGraphState, type ErdGraphState } from '../../../hooks/erd-explorer/erdReducer';
import type { ErdObjectRecord, ErdObjectSummary } from '../ErdExplorerTypes';

const state = (overrides: Partial<ErdGraphState> = {}): ErdGraphState => ({
    ...initialErdGraphState,
    ...overrides,
});

const productRecord: ErdObjectRecord = {
    status: 'ready',
    fields: [{ name: 'name__v', label: 'Name', type: 'String', isReference: false }],
    relationships: [{ name: 'country__vr', target: 'country__v', direction: 'outbound' }],
    objectClass: 'base',
};

const productSummary: ErdObjectSummary = { name: 'product__v', label: 'Product', source: 'standard' };

const vault = { vaultId: '12345', vaultName: 'My Vault', vaultDNS: 'abc.veevavault.com' };

const exportOf = (overrides: Partial<ErdGraphState> = {}) =>
    serializeProject({
        state: state({ placedObjects: ['product__v'], ...overrides }),
        records: { product__v: productRecord },
        objectList: [productSummary],
        vault,
    });

describe('serializeProject', () => {
    it('stamps the file with the Vault it came from', () => {
        expect(exportOf()).toMatchObject({ vaultId: '12345', vaultName: 'My Vault', vaultDNS: 'abc.veevavault.com' });
    });

    it('captures placed objects, positions and visible fields', () => {
        const project = exportOf({
            placedObjects: ['product__v', 'country__v'],
            positions: { product__v: { x: 10, y: 20 } },
            visibleFields: { product__v: ['name__v'], stale__v: ['x'] },
        });

        expect(project.objects).toEqual(['product__v', 'country__v']);
        expect(project.positions).toEqual({ product__v: { x: 10, y: 20 } });
        expect(project.visibleFields).toEqual({ product__v: ['name__v'] });
    });

    it('captures the display settings and edge colours', () => {
        const project = exportOf({
            includeUsersGroups: true,
            viewSettings: { ...initialErdGraphState.viewSettings, showRelationshipLineLabels: true },
            edgeColors: { ...initialErdGraphState.edgeColors, reference: '#ff0000' },
        });

        expect(project.includeUsersGroups).toBe(true);
        expect(project.viewSettings.showRelationshipLineLabels).toBe(true);
        expect(project.edgeColors.reference).toBe('#ff0000');
    });

    it('captures the metadata needed to render without any Vault call', () => {
        const project = exportOf();

        expect(project.records.product__v).toMatchObject({ fields: [{ name: 'name__v' }], objectClass: 'base' });
        expect(project.records.product__v.relationships).toHaveLength(1);
        expect(project.objectList).toEqual([productSummary]);
    });

    it('stores metadata only for placed objects', () => {
        const project = serializeProject({
            state: state({ placedObjects: ['product__v'] }),
            records: { product__v: productRecord, unplaced__v: productRecord },
            objectList: [productSummary, { name: 'unplaced__v', label: 'Unplaced', source: 'standard' }],
            vault,
        });

        expect(Object.keys(project.records)).toEqual(['product__v']);
        expect(project.objectList.map((summary) => summary.name)).toEqual(['product__v']);
    });

    it('is version 2', () => {
        expect(ERD_PROJECT_VERSION).toBe(2);
        expect(exportOf().version).toBe(2);
    });
});

describe('deserializeProject', () => {
    it('round-trips a serialized project', () => {
        const original = exportOf({ positions: { product__v: { x: 1, y: 2 } } });

        expect(deserializeProject(JSON.parse(JSON.stringify(original)))).toEqual(original);
    });

    it('rejects malformed or foreign JSON', () => {
        expect(deserializeProject(null)).toBeNull();
        expect(deserializeProject({})).toBeNull();
        expect(deserializeProject({ kind: 'something-else', objects: [], vaultId: '1' })).toBeNull();
        expect(deserializeProject({ kind: 'vault-toolbox-erd-explorer', objects: 'nope', vaultId: '1' })).toBeNull();
    });

    it('rejects a file with no vaultId rather than defaulting one', () => {
        expect(deserializeProject({ kind: 'vault-toolbox-erd-explorer', objects: ['a__v'] })).toBeNull();
        expect(deserializeProject({ kind: 'vault-toolbox-erd-explorer', objects: ['a__v'], vaultId: '' })).toBeNull();
    });

    it('sanitises visibleFields and positions', () => {
        const parsed = deserializeProject({
            kind: 'vault-toolbox-erd-explorer',
            vaultId: '1',
            objects: ['a__v'],
            visibleFields: { a__v: ['ok'], bad__v: 'nope', worse__v: [1, 2] },
            positions: { a__v: { x: 5, y: 6 }, bad__v: { x: 'nope', y: 1 } },
        });

        expect(parsed?.visibleFields).toEqual({ a__v: ['ok'] });
        expect(parsed?.positions).toEqual({ a__v: { x: 5, y: 6 } });
    });

    it('falls back to default display settings when they are absent or malformed', () => {
        const parsed = deserializeProject({
            kind: 'vault-toolbox-erd-explorer',
            vaultId: '1',
            objects: ['a__v'],
            viewSettings: 'nope',
        });

        expect(parsed?.viewSettings).toEqual(initialErdGraphState.viewSettings);
        expect(parsed?.edgeColors).toEqual(initialErdGraphState.edgeColors);
        expect(parsed?.includeUsersGroups).toBe(false);
    });

    it('tolerates a file with no embedded metadata', () => {
        const parsed = deserializeProject({
            kind: 'vault-toolbox-erd-explorer',
            vaultId: '1',
            objects: ['a__v'],
        });

        expect(parsed?.records).toEqual({});
        expect(parsed?.objectList).toEqual([]);
    });
});

describe('projectVaultMismatchMessage', () => {
    const project = exportOf();

    it('returns null when the file came from the current Vault', () => {
        expect(projectVaultMismatchMessage(project, '12345')).toBeNull();
    });

    it('names the source Vault when it does not match', () => {
        const message = projectVaultMismatchMessage(project, '99999');

        expect(message).toContain('My Vault');
        expect(message).toContain('abc.veevavault.com');
    });

    it('falls back to the Vault id when the file carries no name', () => {
        const unnamed = { ...project, vaultName: undefined, vaultDNS: undefined };

        expect(projectVaultMismatchMessage(unnamed, '99999')).toContain('12345');
    });

    it('treats an unknown current Vault as a mismatch rather than letting it through', () => {
        expect(projectVaultMismatchMessage(project, null)).not.toBeNull();
    });
});

describe('projectDiffersFromSchema', () => {
    const imported = { product__v: productRecord };

    it('reports no difference when the live schema matches the file', () => {
        expect(projectDiffersFromSchema(imported, { product__v: productRecord })).toBe(false);
    });

    it('reports a difference when a field label changed', () => {
        const renamed: ErdObjectRecord = {
            ...productRecord,
            fields: [{ name: 'name__v', label: 'Product Name', type: 'String', isReference: false }],
        };

        expect(projectDiffersFromSchema(imported, { product__v: renamed })).toBe(true);
    });

    it('reports a difference when a field was removed', () => {
        expect(projectDiffersFromSchema(imported, { product__v: { ...productRecord, fields: [] } })).toBe(true);
    });

    it('reports a difference when a relationship was removed', () => {
        expect(projectDiffersFromSchema(imported, { product__v: { ...productRecord, relationships: [] } })).toBe(true);
    });

    it('reports a difference when the object is gone from the Vault', () => {
        expect(projectDiffersFromSchema(imported, {})).toBe(true);
    });

    it('ignores a live partial placeholder, which never overrides the file record', () => {
        const placeholder: ErdObjectRecord = { status: 'ready', fields: [], relationships: [], partial: true };

        expect(projectDiffersFromSchema(imported, { product__v: placeholder })).toBe(false);
    });

    it('ignores objects that exist live but were not in the file', () => {
        const live = { product__v: productRecord, extra__v: productRecord };

        expect(projectDiffersFromSchema(imported, live)).toBe(false);
    });

    it('reports no difference for an empty import', () => {
        expect(projectDiffersFromSchema({}, { product__v: productRecord })).toBe(false);
    });
});
