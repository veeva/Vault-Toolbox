/**
 * Serialize an ERD Explorer to a Mermaid `erDiagram` (dependency-free, pure, unit-tested). The output is
 * wrapped in a ```mermaid fenced block by the caller so it renders in Markdown viewers.
 */

export interface MermaidField {
    name: string;
    type: string;
}
export interface MermaidObject {
    name: string;
    fields: MermaidField[];
}
export interface MermaidEdge {
    source: string;
    target: string;
    label: string;
}

/** Mermaid entity/attribute tokens must be alphanumeric/underscore — coerce anything else. */
function token(value: string): string {
    const cleaned = value.replace(/[^A-Za-z0-9_]/g, '_');
    return cleaned.length > 0 ? cleaned : '_';
}

/** Build a Mermaid erDiagram string from placed objects (with their shown fields) and their edges. */
export function toMermaidErd(objects: MermaidObject[], edges: MermaidEdge[]): string {
    const lines: string[] = ['erDiagram'];

    for (const object of objects) {
        const id = token(object.name);
        lines.push(`    ${id} {`);
        for (const field of object.fields) {
            lines.push(`        ${token(field.type)} ${token(field.name)}`);
        }
        lines.push('    }');
    }

    for (const edge of edges) {
        const label = edge.label.replace(/"/g, "'");
        lines.push(`    ${token(edge.source)} ||--o{ ${token(edge.target)} : "${label}"`);
    }

    return lines.join('\n');
}

/** Wrap a mermaid diagram in a Markdown fenced code block. */
export function toMarkdownDocument(mermaid: string): string {
    return `# ERD Explorer\n\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n`;
}
