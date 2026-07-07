import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { scanText, collectDebt, buildLedger, writeLedger, parseArgs } from './express_guard.js';

describe('scanText — breadcrumb tag detection', () => {
    it('detects each @express-* tag and captures its payload', () => {
        const src = [
            '// @express-intent: live preview of lifecycle states',
            '// @express-assumption: status__v returns label not name',
            '// @express-fake: paginating client-side; use queryByPage',
            '// @express-todo-test: empty result set renders skeleton',
            '// @express-evidence: test/fixtures/states.json',
        ].join('\n');

        const { tags } = scanText(src, 'sample.js');
        const byType = Object.fromEntries(tags.map(t => [t.type, t]));

        expect(tags).toHaveLength(5);
        expect(byType['intent'].payload).toBe('live preview of lifecycle states');
        expect(byType['assumption'].payload).toBe('status__v returns label not name');
        expect(byType['fake'].payload).toBe('paginating client-side; use queryByPage');
        expect(byType['todo-test'].payload).toBe('empty result set renders skeleton');
        expect(byType['evidence'].payload).toBe('test/fixtures/states.json');
        // line numbers are 1-based
        expect(byType['intent'].line).toBe(1);
    });

    it('detects it.todo and describe.skip stubs', () => {
        const src = [
            "it.todo('renders empty state');",
            "describe.skip('pagination', () => {});",
            "it('a real test', () => {});",
        ].join('\n');

        const { stubs } = scanText(src, 'x.test.js');
        const kinds = stubs.map(s => s.kind).sort();
        expect(kinds).toEqual(['describe.skip', 'it.todo']);
    });

    it('flags a malformed tag (present but empty payload) distinctly', () => {
        const { tags } = scanText('// @express-fake:', 'x.js');
        expect(tags).toHaveLength(1);
        expect(tags[0].type).toBe('fake');
        expect(tags[0].malformed).toBe(true);
        expect(tags[0].payload).toBe('');
    });

    it('returns no findings for clean source', () => {
        const { tags, stubs } = scanText('const x = 1; // a normal comment', 'clean.js');
        expect(tags).toHaveLength(0);
        expect(stubs).toHaveLength(0);
    });
});

describe('collectDebt — directory scan', () => {
    let root;
    beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'express-guard-')); });
    afterEach(() => { rmSync(root, { recursive: true, force: true }); });

    it('reports hasDebt=true and aggregates findings when tags/stubs exist', () => {
        writeFileSync(join(root, 'feature.js'), '// @express-fake: hardcoded list\nconst a = 1;');
        writeFileSync(join(root, 'feature.test.js'), "it.todo('covers empty');");

        const result = collectDebt(root);
        expect(result.hasDebt).toBe(true);
        expect(result.tags.some(t => t.type === 'fake')).toBe(true);
        expect(result.stubs.some(s => s.kind === 'it.todo')).toBe(true);
    });

    it('reports hasDebt=false for a clean tree', () => {
        writeFileSync(join(root, 'clean.js'), 'export const ok = true;');
        const result = collectDebt(root);
        expect(result.hasDebt).toBe(false);
        expect(result.tags).toHaveLength(0);
        expect(result.stubs).toHaveLength(0);
    });

    it('scopes the scan to the given path and ignores files outside it', () => {
        const inner = join(root, 'inside');
        mkdirSync(inner);
        writeFileSync(join(inner, 'in.js'), '// @express-intent: scoped');
        writeFileSync(join(root, 'out.js'), '// @express-fake: should NOT be seen');

        const result = collectDebt(inner);
        expect(result.tags).toHaveLength(1);
        expect(result.tags[0].type).toBe('intent');
        expect(result.tags.some(t => t.payload.includes('should NOT'))).toBe(false);
    });
});

describe('parseArgs — CLI argument parsing', () => {
    it('parses a bare target dir (no --ledger)', () => {
        expect(parseArgs(['mydir'])).toEqual({ target: 'mydir', ledgerPath: null });
    });

    it('parses target followed by --ledger <path>', () => {
        expect(parseArgs(['mydir', '--ledger', 'out.md'])).toEqual({ target: 'mydir', ledgerPath: 'out.md' });
    });

    it('parses --ledger <path> preceding the target', () => {
        expect(parseArgs(['--ledger', 'out.md', 'mydir'])).toEqual({ target: 'mydir', ledgerPath: 'out.md' });
    });

    it('does not treat the --ledger value as the target', () => {
        const { target } = parseArgs(['feat', '--ledger', 'out.md']);
        expect(target).toBe('feat');
    });

    it('returns an error when no target is given', () => {
        expect(parseArgs([]).error).toBeTruthy();
        expect(parseArgs(['--ledger', 'out.md']).error).toBeTruthy();
    });
});

describe('ledger output', () => {
    let root;
    beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'express-ledger-')); });
    afterEach(() => { rmSync(root, { recursive: true, force: true }); });

    it('buildLedger renders collected breadcrumbs and stubs as markdown', () => {
        writeFileSync(join(root, 'f.js'), '// @express-fake: stubbed pager\n// @express-todo-test: error path');
        const findings = collectDebt(root);
        const md = buildLedger(findings);
        expect(md).toContain('stubbed pager');
        expect(md).toContain('error path');
        expect(md.toLowerCase()).toContain('ledger');
    });

    it('writeLedger persists the ledger to disk', () => {
        writeFileSync(join(root, 'f.js'), '// @express-fake: x');
        const findings = collectDebt(root);
        const out = join(root, 'express-ledger.md');
        writeLedger(findings, out);
        expect(existsSync(out)).toBe(true);
        expect(readFileSync(out, 'utf8')).toContain('x');
    });
});
