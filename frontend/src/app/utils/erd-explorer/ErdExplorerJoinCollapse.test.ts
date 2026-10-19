import { describe, it, expect } from 'vitest';
import { isCollapsedJoinObject } from './ErdExplorerHelper';
import type { ErdField, ErdObjectRecord } from './ErdExplorerTypes';

/**
 * Covers the decision that gates committing an object to the canvas as a collapsed many-to-many edge.
 * Sits apart from ErdExplorerPureLogic.test.ts only because that file loads uncommitted API fixtures.
 */

const parentField = (name: string, targetObject: string): ErdField => ({
    name,
    label: name,
    type: 'Object',
    isReference: true,
    relationshipType: 'parent',
    targetObject,
});

const customField = (name: string): ErdField => ({
    name,
    label: name,
    type: 'Text',
    isReference: false,
    source: 'custom',
});

const readyRecord = (fields: ErdField[]): ErdObjectRecord => ({ status: 'ready', fields, relationships: [] });

const SIMPLE_JOIN = readyRecord([
    parentField('book__c', 'book__c'),
    parentField('author__c', 'author__c'),
]);
const COMPLEX_JOIN = readyRecord([
    parentField('book__c', 'book__c'),
    parentField('author__c', 'author__c'),
    customField('contribution_type__c'),
]);
const PLAIN_OBJECT = readyRecord([customField('title__c')]);

const BOTH_PARENTS_PLACED = new Set(['book__c', 'author__c']);
const BOTH_HIDDEN = { hideSimpleJoinObjects: true, hideComplexJoinObjects: true };
const NEITHER_HIDDEN = { hideSimpleJoinObjects: false, hideComplexJoinObjects: false };

describe('isCollapsedJoinObject', () => {
    it('collapses a simple join when simple joins are hidden', () => {
        const settings = { hideSimpleJoinObjects: true, hideComplexJoinObjects: false };
        expect(isCollapsedJoinObject(SIMPLE_JOIN, settings, BOTH_PARENTS_PLACED)).toBe(true);
    });

    it('collapses a complex join when complex joins are hidden', () => {
        const settings = { hideSimpleJoinObjects: false, hideComplexJoinObjects: true };
        expect(isCollapsedJoinObject(COMPLEX_JOIN, settings, BOTH_PARENTS_PLACED)).toBe(true);
    });

    it('leaves a complex join alone when only simple joins are hidden', () => {
        const settings = { hideSimpleJoinObjects: true, hideComplexJoinObjects: false };
        expect(isCollapsedJoinObject(COMPLEX_JOIN, settings, BOTH_PARENTS_PLACED)).toBe(false);
    });

    it('leaves a simple join alone when only complex joins are hidden', () => {
        const settings = { hideSimpleJoinObjects: false, hideComplexJoinObjects: true };
        expect(isCollapsedJoinObject(SIMPLE_JOIN, settings, BOTH_PARENTS_PLACED)).toBe(false);
    });

    it('keeps a join visible when its second parent is not placed', () => {
        expect(isCollapsedJoinObject(SIMPLE_JOIN, BOTH_HIDDEN, new Set(['book__c']))).toBe(false);
    });

    it('keeps a non-join visible whatever the settings say', () => {
        expect(isCollapsedJoinObject(PLAIN_OBJECT, BOTH_HIDDEN, BOTH_PARENTS_PLACED)).toBe(false);
    });

    it('keeps every object visible when both settings are off', () => {
        expect(isCollapsedJoinObject(SIMPLE_JOIN, NEITHER_HIDDEN, BOTH_PARENTS_PLACED)).toBe(false);
        expect(isCollapsedJoinObject(COMPLEX_JOIN, NEITHER_HIDDEN, BOTH_PARENTS_PLACED)).toBe(false);
    });

    it('decides nothing from a record that has not loaded', () => {
        const loading: ErdObjectRecord = { status: 'loading', fields: [], relationships: [] };
        const failed: ErdObjectRecord = { status: 'error', fields: [], relationships: [], error: 'nope' };
        expect(isCollapsedJoinObject(undefined, BOTH_HIDDEN, BOTH_PARENTS_PLACED)).toBe(false);
        expect(isCollapsedJoinObject(loading, BOTH_HIDDEN, BOTH_PARENTS_PLACED)).toBe(false);
        expect(isCollapsedJoinObject(failed, BOTH_HIDDEN, BOTH_PARENTS_PLACED)).toBe(false);
    });
});
