/**
 * Express Mode — Merge Guard & Ledger generator.
 *
 * Scans a feature's files for residual `@express-*` breadcrumb tags and
 * `it.todo` / `describe.skip` test stubs. These represent deferred rigor that
 * MUST be resolved before a feature is finalized (see AGENTS.md express lane).
 *
 * Library API: scanText, collectDebt, buildLedger, writeLedger.
 * CLI: node .agents/scripts/express_guard.js <featureDir> [--ledger <path>]
 *   exits non-zero when debt remains, zero when clean.
 */

const fs = require('fs');
const path = require('path');

const TAG_TYPES = ['intent', 'assumption', 'fake', 'todo-test', 'evidence'];
const TAG_RE = new RegExp(`@express-(${TAG_TYPES.join('|')})\\b\\s*:?\\s*(.*)$`);
const STUB_RES = [
    { kind: 'it.todo', re: /\bit\.todo\s*\(/ },
    { kind: 'describe.skip', re: /\bdescribe\.skip\s*\(/ },
];
const CODE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const IGNORE = ['node_modules', '.git', 'dist', 'target'];

/**
 * Scan a single text blob. Returns { file, tags, stubs }.
 * One tag per line is recognised (matching the comment convention).
 */
function scanText(text, file = '<text>') {
    const tags = [];
    const stubs = [];
    const lines = text.split(/\r?\n/);

    lines.forEach((line, idx) => {
        const lineNo = idx + 1;

        const tagMatch = line.match(TAG_RE);
        if (tagMatch) {
            const payload = tagMatch[2].trim();
            tags.push({
                type: tagMatch[1],
                payload,
                malformed: payload === '',
                line: lineNo,
                file,
            });
        }

        for (const { kind, re } of STUB_RES) {
            if (re.test(line)) {
                stubs.push({ kind, line: lineNo, file });
            }
        }
    });

    return { file, tags, stubs };
}

function walk(dir) {
    const out = [];
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return out; // not a directory / unreadable
    }
    for (const entry of entries) {
        if (IGNORE.includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...walk(full));
        } else if (CODE_EXTS.has(path.extname(entry.name))) {
            out.push(full);
        }
    }
    return out;
}

/**
 * Scan every code file under `root` (scoped — nothing outside root is read).
 * Returns { root, files, tags, stubs, hasDebt }.
 */
function collectDebt(root) {
    const stat = fs.existsSync(root) ? fs.statSync(root) : null;
    const files = stat && stat.isFile() ? [root] : walk(root);

    const tags = [];
    const stubs = [];
    for (const file of files) {
        const { tags: t, stubs: s } = scanText(fs.readFileSync(file, 'utf8'), file);
        tags.push(...t);
        stubs.push(...s);
    }

    return { root, files, tags, stubs, hasDebt: tags.length > 0 || stubs.length > 0 };
}

const DEFERRED_PHASES = [
    'Phase 2 — Design doc (expand @express-intent into a full design)',
    'Phase 3 — Implementation plan / ALUs',
    'Phase 5 — Red-Green tests (convert it.todo / describe.skip stubs)',
    'Phase 6 — Automated code review',
    'Phase 8 — Finalization & knowledge sync',
];

/** Render the auto-assembled debt ledger as markdown. */
function buildLedger(findings) {
    const { root, tags, stubs } = findings;
    const lines = [];
    lines.push('# Express Debt Ledger');
    lines.push('');
    lines.push(`Scope: \`${root}\``);
    lines.push(`Status: ${findings.hasDebt ? '**OPEN — finalization blocked**' : '**CLEAN**'}`);
    lines.push('');

    lines.push('## Deferred phases to backfill on `:promote`');
    for (const phase of DEFERRED_PHASES) lines.push(`- [ ] ${phase}`);
    lines.push('');

    lines.push('## Breadcrumbs');
    if (tags.length === 0) {
        lines.push('_None._');
    } else {
        for (const t of tags) {
            const flag = t.malformed ? ' ⚠️ malformed (empty payload)' : '';
            lines.push(`- [ ] \`@express-${t.type}\` (${t.file}:${t.line}) — ${t.payload || '∅'}${flag}`);
        }
    }
    lines.push('');

    lines.push('## Test stubs');
    if (stubs.length === 0) {
        lines.push('_None._');
    } else {
        for (const s of stubs) {
            lines.push(`- [ ] \`${s.kind}\` (${s.file}:${s.line})`);
        }
    }
    lines.push('');

    return lines.join('\n');
}

/** Persist the ledger to disk. */
function writeLedger(findings, outPath) {
    fs.writeFileSync(outPath, buildLedger(findings));
    return outPath;
}

/**
 * Parse CLI args into { target, ledgerPath } or { error }.
 * The first positional arg is the target; `--ledger <path>` is optional and
 * its value is never mistaken for the target.
 */
function parseArgs(args) {
    const ledgerFlag = args.indexOf('--ledger');
    const ledgerPath = ledgerFlag !== -1 ? args[ledgerFlag + 1] : null;
    const ledgerValueIndex = ledgerFlag !== -1 ? ledgerFlag + 1 : -1;
    const target = args.find((a, i) => !a.startsWith('--') && i !== ledgerValueIndex);

    if (!target) {
        return { error: 'Usage: node express_guard.js <featureDir> [--ledger <path>]' };
    }
    return { target, ledgerPath };
}

// --- CLI ---
if (require.main === module) {
    const { target, ledgerPath, error } = parseArgs(process.argv.slice(2));

    if (error) {
        console.error(error);
        process.exit(2);
    }

    const findings = collectDebt(target);
    const out = ledgerPath || path.join(target, 'express-ledger.md');
    writeLedger(findings, out);

    const malformed = findings.tags.filter(t => t.malformed).length;
    console.log(`[express-guard] scanned ${findings.files.length} file(s) under ${target}`);
    console.log(`[express-guard] ${findings.tags.length} tag(s), ${findings.stubs.length} stub(s), ${malformed} malformed`);
    console.log(`[express-guard] ledger written to ${out}`);

    if (findings.hasDebt) {
        console.error('[express-guard] BLOCK: open express debt remains — feature cannot be finalized.');
        process.exit(1);
    }
    console.log('[express-guard] CLEAN: no express debt.');
    process.exit(0);
}

module.exports = { scanText, collectDebt, buildLedger, writeLedger, parseArgs };
