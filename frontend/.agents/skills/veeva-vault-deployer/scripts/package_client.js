#!/usr/bin/env node
/**
 * Package a Vault Custom Page client distribution — PACKAGING ONLY, no network.
 *
 * Pipeline: validate layout -> build (esbuild) -> zip (dist/ prefix + manifest)
 * -> generate mdl-components/page.mdl. Produces artifacts on disk; it does NOT
 * upload or execute anything against a Vault.
 *
 * Deployment is done separately through the authenticated gateway:
 *   node .agents/scripts/vault_api.js upload-distribution --file <client-dir>/<name>.zip
 *   node .agents/scripts/vault_api.js execute-mdl        --file <client-dir>/mdl-components/page.mdl
 *
 * This keeps the Vault session entirely inside vault_api — see the veeva-vault-deployer SKILL.
 *
 * Uses the system `zip` and `node` (for esbuild) via child_process, matching
 * vault-vpk-builder's packaging convention.
 *
 * USAGE
 *   node package_client.js --client-dir client
 *   node package_client.js --client-dir client --skip-build   # reuse existing dist/
 *   node package_client.js --client-dir client --skip-mdl     # don't (re)generate page.mdl
 */

import { existsSync, statSync, readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve, basename, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const getArg = (name, def = null) => {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1] : def;
};
const hasFlag = (name) => argv.includes(name);

// ---------- Stage 1: Validate layout ----------

function validateClientDir(clientDir) {
  if (!existsSync(clientDir) || !statSync(clientDir).isDirectory()) {
    throw new Error(`--client-dir ${clientDir} does not exist`);
  }
  const required = {
    'esbuild.mjs': join(clientDir, 'esbuild.mjs'),
    'distribution-manifest.json': join(clientDir, 'distribution-manifest.json'),
    'src/': join(clientDir, 'src'),
    'node_modules/': join(clientDir, 'node_modules'),
  };
  const missing = Object.entries(required).filter(([, p]) => !existsSync(p)).map(([n]) => n);
  if (missing.length) {
    throw new Error(
      `Client directory ${clientDir} is missing: ${missing.join(', ')}. ` +
      'Did you run `npm install` and add an esbuild.mjs?'
    );
  }
  const manifestPath = join(clientDir, 'distribution-manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    throw new Error(`${manifestPath} is not valid JSON: ${e.message}`);
  }
  if (!manifest.name) throw new Error(`${manifestPath} must contain a top-level 'name'.`);
  const pages = manifest.pages || [];
  if (!pages.length) throw new Error(`${manifestPath} must contain a non-empty 'pages' array.`);
  for (const entry of pages) {
    if (!entry.name || !entry.file) {
      throw new Error(`${manifestPath}: every 'pages' entry needs 'name' and 'file'. Got ${JSON.stringify(entry)}.`);
    }
  }
  return manifest;
}

// ---------- Stage 2: Build ----------

function buildBundle(clientDir) {
  console.log(`[build] node esbuild.mjs (cwd=${clientDir})`);
  try {
    const out = execFileSync('node', ['esbuild.mjs'], { cwd: clientDir, encoding: 'utf8' });
    if (out.trim()) console.log(out.trimEnd());
  } catch (e) {
    throw new Error(`esbuild failed: ${e.message}\n${e.stderr || ''}`);
  }
  const dist = join(clientDir, 'dist');
  if (!existsSync(dist) || !readdirSync(dist).some((f) => f.endsWith('.js'))) {
    throw new Error(`esbuild ran but produced no .js files in ${dist}. Check esbuild.mjs's outdir.`);
  }
  console.log(`[build] OK — dist/ contains: ${readdirSync(dist).sort().join(', ')}`);
}

// ---------- Stage 3: Package ----------

function packageZip(clientDir, outputZip) {
  const dist = join(clientDir, 'dist');
  const manifest = join(clientDir, 'distribution-manifest.json');
  if (!existsSync(dist)) throw new Error(`${dist} does not exist — build first or omit --skip-build.`);
  if (!existsSync(manifest)) throw new Error(`${manifest} not found`);
  const out = resolve(outputZip);
  mkdirSync(dirname(out), { recursive: true });
  rmSync(out, { force: true });
  // Zipping from inside clientDir keeps the `dist/` prefix in the archive,
  // matching the manifest's "file": "dist/<name>.js".
  try {
    execFileSync('zip', ['-rq', out, 'dist', 'distribution-manifest.json'], { cwd: clientDir, stdio: 'pipe' });
  } catch (e) {
    throw new Error(`zip failed: ${e.message}. Install 'zip' or wire a pure-Node fallback.`);
  }
  console.log(`[package] ${out} (${(statSync(out).size / 1024).toFixed(1)} KB)`);
  return out;
}

// ---------- Stage 4: Generate Page MDL ----------

function stripSuffix(name) {
  for (const s of ['__c', '__v', '__sys']) if (name.endsWith(s)) return name.slice(0, -s.length);
  return name;
}
const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);
const deriveSimpleClassName = (n) => stripSuffix(n).split('_').filter(Boolean).map(cap).join('');
const deriveLabel = (n) => stripSuffix(n).split('_').filter(Boolean).map(cap).join(' ');
const deriveUrlPath = (n) => stripSuffix(n).replace(/_/g, '-');

function autoDetectSourceRoot(clientDir) {
  let current = resolve(clientDir);
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(current, 'pom.xml')) && existsSync(join(current, 'src', 'main', 'java'))) return current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  // Fall back to a sibling server/ Maven project (this project's layout).
  const sibling = join(dirname(resolve(clientDir)), 'server');
  if (existsSync(join(sibling, 'pom.xml'))) return sibling;
  return dirname(resolve(clientDir));
}

function findJavaFiles(dir, simpleName) {
  const target = `${simpleName}.java`;
  const results = [];
  const walk = (p) => {
    for (const entry of readdirSync(p, { withFileTypes: true })) {
      const full = join(p, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === target) results.push(full);
    }
  };
  walk(dir);
  return results;
}

function findPageController(sourceRoot, expectedClassName) {
  const javaRoot = join(sourceRoot, 'src', 'main', 'java');
  if (!existsSync(javaRoot)) return null;
  const matches = [];
  for (const javaFile of findJavaFiles(javaRoot, expectedClassName)) {
    const text = readFileSync(javaFile, 'utf8');
    if (!text.includes('implements PageController') && !text.includes('@PageControllerInfo')) continue;
    let pkg = null;
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (t.startsWith('package ') && t.endsWith(';')) { pkg = t.slice('package '.length, -1).trim(); break; }
    }
    if (pkg) matches.push(`${pkg}.${expectedClassName}`);
  }
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    console.log(`[mdl] ambiguous: multiple PageController classes named ${expectedClassName} (${matches.join(', ')}); ` +
      'omitting page_controller — register it manually if needed.');
  }
  return null;
}

function generatePageMdl(manifest, sourceRoot) {
  const distributionName = manifest.name;
  const statements = [];
  for (const page of manifest.pages) {
    const pageName = page.name;
    const attrs = [
      `  label('${deriveLabel(pageName)}')`,
      `  url_path_name('${deriveUrlPath(pageName)}')`,
      `  page_client_code('Pageclientcode.${pageName}')`,
      `  client_distribution('Clientdistribution.${distributionName}')`,
    ];
    const fqcn = findPageController(sourceRoot, deriveSimpleClassName(pageName));
    if (fqcn) {
      attrs.push(`  page_controller('Pagecontroller.${fqcn}')`);
      console.log(`[mdl] ${pageName}: PageController matched → ${fqcn}`);
    } else {
      console.log(`[mdl] ${pageName}: no PageController found (searched class ${deriveSimpleClassName(pageName)}); ` +
        'generating Page without page_controller.');
    }
    statements.push(`RECREATE Page ${pageName} (\n${attrs.join(',\n')}\n);`);
  }
  return statements.join('\n\n') + '\n';
}

function writeMdlIfAbsent(manifest, sourceRoot, outputPath) {
  if (existsSync(outputPath)) {
    const existing = readFileSync(outputPath, 'utf8');
    console.log(`[mdl] using existing ${outputPath} (${existing.length} chars) — not regenerating.`);
    return;
  }
  const mdl = generatePageMdl(manifest, sourceRoot);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, mdl);
  console.log(`[mdl] wrote ${outputPath} (${mdl.length} chars)`);
}

// ---------- Main ----------

function main() {
  const clientDirArg = getArg('--client-dir');
  if (!clientDirArg) {
    console.error('Usage: node package_client.js --client-dir <dir> [--source-root <dir>] [--output <zip>] [--mdl-dir <dir>] [--skip-build] [--skip-mdl]');
    process.exit(2);
  }
  const clientDir = resolve(clientDirArg);
  const manifest = validateClientDir(clientDir);

  if (!hasFlag('--skip-build')) buildBundle(clientDir);
  else console.log('[build] skipped (--skip-build)');

  const outputZip = getArg('--output') ? resolve(getArg('--output')) : join(clientDir, `${manifest.name}.zip`);
  packageZip(clientDir, outputZip);

  let mdlPath = null;
  if (!hasFlag('--skip-mdl')) {
    const sourceRoot = getArg('--source-root') ? resolve(getArg('--source-root')) : autoDetectSourceRoot(clientDir);
    console.log(`[mdl] source-root for PageController detection: ${sourceRoot}`);
    const mdlDir = getArg('--mdl-dir') ? resolve(getArg('--mdl-dir')) : join(clientDir, 'mdl-components');
    mdlPath = join(mdlDir, 'page.mdl');
    writeMdlIfAbsent(manifest, sourceRoot, mdlPath);
  } else {
    console.log('[mdl] skipped (--skip-mdl)');
  }

  console.log('');
  console.log(`[done] Packaged client distribution: ${outputZip}`);
  for (const page of manifest.pages) {
    console.log(`        page ${page.name} → /ui/#custom/page/${deriveUrlPath(page.name)}`);
  }
  console.log('');
  console.log('Next (requires an authenticated vault_api — run `vault_api.js status` first):');
  console.log(`  node .agents/scripts/vault_api.js upload-distribution --file ${outputZip}`);
  if (mdlPath) console.log(`  node .agents/scripts/vault_api.js execute-mdl --file ${mdlPath}`);
  console.log('  (upload first, then execute the Page MDL — see the veeva-vault-deployer SKILL)');
}

main();
