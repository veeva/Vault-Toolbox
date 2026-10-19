import { describe, it, expect } from 'vitest';
import { buildSchemaRecords, mergeEnrichedRecord, settleRecordsAgainstSchema } from './ErdExplorerSchemaBuild';
import type { ParsedObjectMdl } from './ErdExplorerMdlParsing';
import type { ErdField, ErdObjectRecord, ErdObjectSummary } from '../ErdExplorerTypes';

const referenceField = (name: string, targetObject: string, outboundName: string): ErdField => ({
    name,
    label: name,
    type: 'Object',
    isReference: true,
    relationshipType: 'reference',
    targetObject,
    outboundName,
});

const plainField = (name: string): ErdField => ({
    name,
    label: name,
    type: 'String',
    isReference: false,
});

const parsed = (name: string, fields: ErdField[], extra: Partial<ParsedObjectMdl> = {}): ParsedObjectMdl => ({
    name,
    fields,
    ...extra,
});

const summary = (name: string): ErdObjectSummary => ({ name, label: name, source: 'standard' });

describe('buildSchemaRecords', () => {
    it('builds a ready record for every object that parsed from MDL', () => {
        const parsedByObject = new Map([['book__c', parsed('book__c', [plainField('title__c')])]]);

        const records = buildSchemaRecords(parsedByObject, [summary('book__c')]);

        expect(records.book__c).toMatchObject({ status: 'ready', fields: [{ name: 'title__c' }] });
        expect(records.book__c.partial).toBeUndefined();
    });

    it('carries object class and description onto the record', () => {
        const parsedByObject = new Map([
            ['book__c', parsed('book__c', [], { objectClass: 'base', description: 'A book' })],
        ]);

        const records = buildSchemaRecords(parsedByObject, [summary('book__c')]);

        expect(records.book__c).toMatchObject({ objectClass: 'base', description: 'A book' });
    });

    it('derives outbound and inbound relationships across objects', () => {
        const parsedByObject = new Map([
            ['book__c', parsed('book__c', [referenceField('author__c', 'author__c', 'author__cr')])],
            ['author__c', parsed('author__c', [plainField('name__v')])],
        ]);

        const records = buildSchemaRecords(parsedByObject, [summary('book__c'), summary('author__c')]);

        expect(records.book__c.relationships).toEqual([
            { name: 'author__cr', target: 'author__c', direction: 'outbound' },
        ]);
        expect(records.author__c.relationships).toEqual([
            { name: 'author__cr', target: 'book__c', direction: 'inbound' },
        ]);
    });

    it('seeds a partial placeholder for a listed object with no MDL', () => {
        const parsedByObject = new Map([['book__c', parsed('book__c', [plainField('title__c')])]]);

        const records = buildSchemaRecords(parsedByObject, [summary('book__c'), summary('user__sys')]);

        expect(records.user__sys).toMatchObject({ status: 'ready', partial: true, fields: [] });
    });

    it('gives a partial placeholder the inbound relationships derived from other objects MDL', () => {
        // book__c references user__sys, which has no Object component MDL of its own.
        const parsedByObject = new Map([
            ['book__c', parsed('book__c', [referenceField('owner__c', 'user__sys', 'owner__cr')])],
        ]);

        const records = buildSchemaRecords(parsedByObject, [summary('book__c'), summary('user__sys')]);

        expect(records.user__sys.relationships).toEqual([
            { name: 'owner__cr', target: 'book__c', direction: 'inbound' },
        ]);
    });

    it('gives a placeholder no relationships when nothing references it', () => {
        const records = buildSchemaRecords(new Map(), [summary('lonely__sys')]);

        expect(records.lonely__sys).toMatchObject({ partial: true, relationships: [] });
    });

    it('keeps objects that parsed from MDL but are absent from the object list', () => {
        const parsedByObject = new Map([['hidden__sys', parsed('hidden__sys', [plainField('name__v')])]]);

        const records = buildSchemaRecords(parsedByObject, []);

        expect(records.hidden__sys).toMatchObject({ status: 'ready' });
        expect(records.hidden__sys.partial).toBeUndefined();
    });

    it('never marks an object that parsed from MDL as partial, even if also listed', () => {
        const parsedByObject = new Map([['book__c', parsed('book__c', [plainField('title__c')])]]);

        const records = buildSchemaRecords(parsedByObject, [summary('book__c')]);

        expect(records.book__c.partial).toBeUndefined();
        expect(records.book__c.fields).toHaveLength(1);
    });

    it('returns nothing for empty inputs', () => {
        expect(buildSchemaRecords(new Map(), [])).toEqual({});
    });
});

describe('mergeEnrichedRecord', () => {
    const inboundFromBook = { name: 'owner__cr', target: 'book__c', direction: 'inbound' as const };
    const placeholder: ErdObjectRecord = {
        status: 'ready',
        fields: [],
        relationships: [inboundFromBook],
        partial: true,
    };

    it('keeps the relationships the placeholder derived when the fetch returned none', () => {
        const fetched: ErdObjectRecord = { status: 'ready', fields: [plainField('username__sys')], relationships: [] };

        const merged = mergeEnrichedRecord(fetched, placeholder);

        expect(merged.fields).toHaveLength(1);
        expect(merged.relationships).toEqual([inboundFromBook]);
    });

    it('does not duplicate a relationship the fetch already returned', () => {
        const fetched: ErdObjectRecord = { status: 'ready', fields: [], relationships: [inboundFromBook] };

        expect(mergeEnrichedRecord(fetched, placeholder).relationships).toEqual([inboundFromBook]);
    });

    it('appends only what is missing, keeping the fetched relationships first', () => {
        const ownOutbound = { name: 'team__sysr', target: 'team__sys', direction: 'outbound' as const };
        const fetched: ErdObjectRecord = { status: 'ready', fields: [], relationships: [ownOutbound] };

        expect(mergeEnrichedRecord(fetched, placeholder).relationships).toEqual([ownOutbound, inboundFromBook]);
    });

    it('leaves a failed fetch alone so the error is not dressed up as data', () => {
        const failed: ErdObjectRecord = { status: 'error', fields: [], relationships: [], error: 'nope' };

        expect(mergeEnrichedRecord(failed, placeholder)).toBe(failed);
    });

    it('passes the fetch through when there was no placeholder', () => {
        const fetched: ErdObjectRecord = { status: 'ready', fields: [], relationships: [] };

        expect(mergeEnrichedRecord(fetched, undefined)).toBe(fetched);
    });
});

describe('settleRecordsAgainstSchema', () => {
    const heldRecord: ErdObjectRecord = {
        status: 'ready',
        fields: [plainField('title__c')],
        relationships: [],
    };
    const fullSchemaRecord: ErdObjectRecord = { status: 'ready', fields: [plainField('name__v')], relationships: [] };
    const placeholderSchemaRecord: ErdObjectRecord = { status: 'ready', fields: [], relationships: [], partial: true };

    it('drops a held record the schema knows in full, so the live schema wins', () => {
        const settled = settleRecordsAgainstSchema({
            heldRecords: { book__c: heldRecord },
            schemaRecords: { book__c: fullSchemaRecord },
            placedObjects: ['book__c'],
        });

        expect(settled).toEqual({});
    });

    it('keeps a held record the schema only has a placeholder for', () => {
        const settled = settleRecordsAgainstSchema({
            heldRecords: { user__sys: heldRecord },
            schemaRecords: { user__sys: placeholderSchemaRecord },
            placedObjects: ['user__sys'],
        });

        expect(settled.user__sys).toBe(heldRecord);
    });

    it('marks a held record the schema has never heard of as missing from the Vault', () => {
        const settled = settleRecordsAgainstSchema({
            heldRecords: { deleted__c: heldRecord },
            schemaRecords: { book__c: fullSchemaRecord },
            placedObjects: ['deleted__c'],
        });

        expect(settled.deleted__c).toMatchObject({
            partial: true,
            missingFromVault: true,
            fields: [{ name: 'title__c' }],
        });
    });

    it('marks a placed object the schema dropped, even with nothing held for it', () => {
        // The reload case: the object was placed from the schema, so it never had a held record.
        const settled = settleRecordsAgainstSchema({
            heldRecords: {},
            schemaRecords: { book__c: fullSchemaRecord },
            placedObjects: ['book__c', 'dropped__c'],
        });

        expect(settled.dropped__c).toMatchObject({ status: 'ready', partial: true, missingFromVault: true });
        expect(settled.book__c).toBeUndefined();
    });

    it('does not mark synthetic external targets as missing', () => {
        const settled = settleRecordsAgainstSchema({
            heldRecords: {},
            schemaRecords: {},
            placedObjects: ['documents', 'users', 'groups'],
        });

        expect(settled).toEqual({});
    });

    it('leaves an in-flight or failed held record alone', () => {
        const loading: ErdObjectRecord = { status: 'loading', fields: [], relationships: [] };
        const settled = settleRecordsAgainstSchema({
            heldRecords: { slow__c: loading },
            schemaRecords: { slow__c: placeholderSchemaRecord },
            placedObjects: ['slow__c'],
        });

        expect(settled.slow__c).toBe(loading);
    });

    it('returns nothing when there is nothing held and nothing placed', () => {
        const settled = settleRecordsAgainstSchema({
            heldRecords: {},
            schemaRecords: { book__c: fullSchemaRecord },
            placedObjects: [],
        });

        expect(settled).toEqual({});
    });
});
