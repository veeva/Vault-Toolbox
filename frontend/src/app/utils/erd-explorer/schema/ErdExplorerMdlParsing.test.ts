import { describe, it, expect } from 'vitest';
import { parseObjectMdl, deriveAllRelationships } from './ErdExplorerMdlParsing';
import type { ErdField } from '../ErdExplorerTypes';

const BOOK_AUTHOR_MDL = `RECREATE Object book_author__c (
  label('Book Author'),
  label_plural('Book Authors'),
  active(true),
  description('Join of Book and Author, with a (parenthetical) note, comma, and it\\'s apostrophe.'),
  Field author__c (
    label('Author'),
    active(true),
    type('Object'),
    relationship_type('parent'),
    object('author__c'),
    relationship_outbound_name('author__cr'),
    relationship_inbound_name('book_authors__cr'),
    relationship_deletion('cascade'),
    required(true)
  ),
  Field book__c (
    label('Book'),
    type('Object'),
    relationship_type('parent'),
    object('book__c'),
    relationship_outbound_name('book__cr'),
    required(true)
  ),
  Field name__v (
    label('Name'),
    type('String'),
    max_length(128),
    unique(true)
  )
);`;

describe('parseObjectMdl', () => {
    it('parses object attrs + fields, handling quotes with parens/commas/escaped apostrophes', () => {
        const parsed = parseObjectMdl(BOOK_AUTHOR_MDL)!;
        expect(parsed.name).toBe('book_author__c');
        expect(parsed.label).toBe('Book Author');
        expect(parsed.labelPlural).toBe('Book Authors');
        expect(parsed.description).toContain("(parenthetical) note, comma, and it's apostrophe");
        expect(parsed.fields.map((field) => field.name)).toEqual(['author__c', 'book__c', 'name__v']);
    });

    it('maps parent/reference field attributes onto ErdField', () => {
        const parsed = parseObjectMdl(BOOK_AUTHOR_MDL)!;
        const author = parsed.fields.find((field) => field.name === 'author__c')!;
        expect(author).toMatchObject({
            type: 'Object',
            isReference: true,
            relationshipType: 'parent',
            targetObject: 'author__c',
            outboundName: 'author__cr',
            inboundName: 'book_authors__cr',
            required: true,
            source: 'custom',
        });
        const name = parsed.fields.find((field) => field.name === 'name__v')!;
        expect(name).toMatchObject({ type: 'String', isReference: false, unique: true, source: 'standard' });
    });

    it('returns null for non-object / non-parseable MDL', () => {
        expect(parseObjectMdl('RECREATE Picklist foo__c ( label(\'x\') );')).toBeNull();
        expect(parseObjectMdl('')).toBeNull();
        expect(parseObjectMdl(undefined)).toBeNull();
    });
});

describe('deriveAllRelationships', () => {
    const ref = (name: string, target: string, outbound: string, kind: 'reference' | 'parent' = 'reference'): ErdField => ({
        name,
        label: name,
        type: 'Object',
        isReference: true,
        relationshipType: kind,
        targetObject: target,
        outboundName: outbound,
    });

    it('produces an outbound edge on the owner and a matching inbound on a real target', () => {
        const fields = new Map<string, ErdField[]>([
            ['product__v', [ref('country__c', 'country__v', 'country__cr'), ref('doc__c', 'documents', 'doc__cr')]],
            ['country__v', []],
        ]);
        const rels = deriveAllRelationships(fields);
        expect(rels.get('product__v')).toContainEqual({ name: 'country__cr', target: 'country__v', direction: 'outbound' });
        // Documents (external) is outbound only — no inbound bucket for it.
        expect(rels.get('product__v')).toContainEqual({ name: 'doc__cr', target: 'documents', direction: 'outbound' });
        expect(rels.get('country__v')).toContainEqual({ name: 'country__cr', target: 'product__v', direction: 'inbound' });
        expect(rels.has('documents')).toBe(false);
    });

    it('gives every parsed object an entry and inverts parent joins (join → parent = inbound)', () => {
        const fields = new Map<string, ErdField[]>([
            ['author__c', []],
            ['book__c', []],
            ['book_author__c', [ref('author__c', 'author__c', 'author__cr', 'parent'), ref('book__c', 'book__c', 'book__cr', 'parent')]],
        ]);
        const rels = deriveAllRelationships(fields);
        // The parents see the join as an inbound relationship (drives join auto-materialization).
        expect(rels.get('author__c')).toContainEqual({ name: 'author__cr', target: 'book_author__c', direction: 'inbound' });
        expect(rels.get('book__c')).toContainEqual({ name: 'book__cr', target: 'book_author__c', direction: 'inbound' });
    });
});
