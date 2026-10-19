import { describe, it, expect } from 'vitest';
import { serializeSchema, deserializeSchema } from './ErdExplorerSchemaCache';
import type { ErdObjectRecord, ErdObjectSummary } from '../ErdExplorerTypes';

const bookRecord: ErdObjectRecord = {
    status: 'ready',
    fields: [{ name: 'title__c', label: 'Title', type: 'String', isReference: false }],
    relationships: [{ name: 'author__cr', target: 'author__c', direction: 'outbound' }],
    objectClass: 'base',
    description: 'A book',
};

const userPlaceholder: ErdObjectRecord = {
    status: 'ready',
    fields: [],
    relationships: [{ name: 'owner__cr', target: 'book__c', direction: 'inbound' }],
    partial: true,
};

const bookSummary: ErdObjectSummary = { name: 'book__c', label: 'Book', source: 'custom' };

describe('serializeSchema / deserializeSchema', () => {
    it('round-trips records and the object list', () => {
        const snapshot = { records: { book__c: bookRecord }, objectList: [bookSummary] };

        const restored = deserializeSchema(serializeSchema(snapshot));

        expect(restored).toEqual(snapshot);
    });

    it('round-trips a partial placeholder with its relationships', () => {
        const snapshot = { records: { user__sys: userPlaceholder }, objectList: [] };

        const restored = deserializeSchema(serializeSchema(snapshot));

        expect(restored?.records.user__sys).toMatchObject({ partial: true });
        expect(restored?.records.user__sys.relationships).toHaveLength(1);
    });

    it('does not store records that are loading or failed', () => {
        const snapshot = {
            records: {
                book__c: bookRecord,
                pending__c: { status: 'loading', fields: [], relationships: [] } as ErdObjectRecord,
                broken__c: { status: 'error', fields: [], relationships: [], error: 'nope' } as ErdObjectRecord,
            },
            objectList: [bookSummary],
        };

        const serialized = serializeSchema(snapshot);

        expect(Object.keys(serialized.records)).toEqual(['book__c']);
    });

    it('round-trips an empty schema', () => {
        const restored = deserializeSchema(serializeSchema({ records: {}, objectList: [] }));

        expect(restored).toEqual({ records: {}, objectList: [] });
    });

    it('rejects a blob that is not an object', () => {
        expect(deserializeSchema(null)).toBeNull();
        expect(deserializeSchema('nope')).toBeNull();
        expect(deserializeSchema([])).toBeNull();
    });

    it('rejects a blob missing records or the object list', () => {
        expect(deserializeSchema({ objectList: [] })).toBeNull();
        expect(deserializeSchema({ records: {} })).toBeNull();
    });

    it('drops a record whose fields or relationships are not arrays', () => {
        const restored = deserializeSchema({
            records: {
                book__c: { status: 'ready', fields: [], relationships: [] },
                bad__c: { status: 'ready', fields: 'nope', relationships: [] },
                worse__c: { status: 'ready', fields: [], relationships: null },
            },
            objectList: [],
        });

        expect(Object.keys(restored?.records ?? {})).toEqual(['book__c']);
    });

    it('drops an object-list entry with no name', () => {
        const restored = deserializeSchema({
            records: {},
            objectList: [bookSummary, { label: 'Nameless', source: 'custom' }, 'nope'],
        });

        expect(restored?.objectList).toEqual([bookSummary]);
    });

    it('ignores unknown keys rather than failing the whole blob', () => {
        const restored = deserializeSchema({
            records: { book__c: { status: 'ready', fields: [], relationships: [], surprise: 1 } },
            objectList: [],
            alsoUnexpected: true,
        });

        expect(restored?.records.book__c).toEqual({
            status: 'ready',
            fields: [],
            relationships: [],
            objectClass: undefined,
            description: undefined,
            partial: undefined,
        });
    });
});
