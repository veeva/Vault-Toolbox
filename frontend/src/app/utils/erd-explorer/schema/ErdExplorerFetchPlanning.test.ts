import { describe, it, expect } from 'vitest';
import { planObjectFetches } from './ErdExplorerFetchPlanning';
import type { ErdObjectRecord } from '../ErdExplorerTypes';

const loaded: ErdObjectRecord = { status: 'ready', fields: [], relationships: [] };
const loading: ErdObjectRecord = { status: 'loading', fields: [], relationships: [] };
const failed: ErdObjectRecord = { status: 'error', fields: [], relationships: [], error: 'not retrievable' };
const placeholder: ErdObjectRecord = { status: 'ready', fields: [], relationships: [], partial: true };
const absentFromVault: ErdObjectRecord = {
    status: 'ready',
    fields: [],
    relationships: [],
    partial: true,
    missingFromVault: true,
};

describe('planObjectFetches', () => {
    it('requests an object nothing is known about yet', () => {
        expect(planObjectFetches(['book__c'], {})).toEqual(['book__c']);
    });

    it('never refetches an object that already loaded', () => {
        expect(planObjectFetches(['book__c'], { book__c: loaded })).toEqual([]);
    });

    it('never refetches an object whose load failed', () => {
        expect(planObjectFetches(['book__c'], { book__c: failed })).toEqual([]);
    });

    it('does not duplicate a request for an object already loading', () => {
        expect(planObjectFetches(['book__c'], { book__c: loading })).toEqual([]);
    });

    it('requests an object the schema only has a placeholder for, to fill in its fields', () => {
        expect(planObjectFetches(['user__sys'], { user__sys: placeholder })).toEqual(['user__sys']);
    });

    it('never requests an object this Vault does not have, so its node is not turned into an error', () => {
        expect(planObjectFetches(['deleted__c'], { deleted__c: absentFromVault })).toEqual([]);
    });

    it('never requests a placeholder that is a synthetic external target', () => {
        expect(planObjectFetches(['documents'], { documents: placeholder })).toEqual([]);
    });

    it('never requests synthetic external targets', () => {
        expect(planObjectFetches(['documents', 'users', 'groups'], {})).toEqual([]);
    });

    it('collapses a name requested more than once into one request', () => {
        expect(planObjectFetches(['book__c', 'book__c', 'author__c'], {})).toEqual(['book__c', 'author__c']);
    });

    it('returns nothing for an empty request', () => {
        expect(planObjectFetches([], {})).toEqual([]);
        expect(planObjectFetches([], { book__c: loaded })).toEqual([]);
    });

    it('requests only the unknown objects out of a mixed batch', () => {
        const records = { book__c: loaded, ghost__c: failed };
        const planned = planObjectFetches(['book__c', 'ghost__c', 'author__c', 'documents'], records);
        expect(planned).toEqual(['author__c']);
    });
});
