import { describe, it, expect } from 'vitest';
import { toMermaidErd, toMarkdownDocument } from './ErdExplorerMarkdown';

describe('toMermaidErd', () => {
    it('renders entities with their fields and relationships', () => {
        const md = toMermaidErd(
            [
                { name: 'product__v', fields: [{ name: 'name__v', type: 'String' }] },
                { name: 'pm_application__v', fields: [] },
            ],
            [{ source: 'product__v', target: 'pm_application__v', label: 'Reference' }],
        );
        const lines = md.split('\n');
        expect(lines[0]).toBe('erDiagram');
        expect(md).toContain('    product__v {');
        expect(md).toContain('        String name__v');
        expect(md).toContain('    pm_application__v {');
        expect(md).toContain('    product__v ||--o{ pm_application__v : "Reference"');
    });

    it('coerces non-token characters in names/types and quotes in labels', () => {
        const md = toMermaidErd(
            [{ name: 'weird name!', fields: [{ name: 'a b', type: 'Date Time' }] }],
            [{ source: 'weird name!', target: 'documents', label: 'say "hi"' }],
        );
        expect(md).toContain('    weird_name_ {');
        expect(md).toContain('        Date_Time a_b');
        expect(md).toContain('weird_name_ ||--o{ documents : "say \'hi\'"');
    });
});

describe('toMarkdownDocument', () => {
    it('wraps the diagram in a mermaid fenced block', () => {
        const doc = toMarkdownDocument('erDiagram');
        expect(doc).toContain('```mermaid\nerDiagram\n```');
        expect(doc.startsWith('# ERD Explorer')).toBe(true);
    });
});
