#!/usr/bin/env node
/**
 * Remove build artifacts so the next deploy starts from a clean state.
 *
 * By default removes (any that exist):
 *   - <source-root>/target/                 (Maven output: JAR, classes, VPK)
 *   - <client-dir>/dist/                     (esbuild output)
 *   - <client-dir>/*.zip                     (packaged distribution zips)
 *   - <client-dir>/mdl-components/page.mdl   (auto-generated Page MDL)
 *   - <client-dir>/mdl-components/           (the dir itself, if empty afterwards)
 *
 * Does NOT touch: node_modules/, package.json/package-lock.json, src/, or
 * hand-written .mdl files under mdl-components/ that aren't named page.mdl.
 *
 * USAGE
 *   node cleanup.js --source-root . --client-dir client
 *   node cleanup.js --client-dir-base ui            # clean every child with a manifest
 *   node cleanup.js --client-dir client --keep-page-mdl
 *   node cleanup.js --source-root . --client-dir client --dry-run
 *
 * At least one of --source-root, --client-dir, or --client-dir-base is required.
 */

import { existsSync, statSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const GENERATED_MDL_FILE = 'page.mdl';
const MDL_DIR_NAME = 'mdl-components';
const CLIENT_DIR_MARKER = 'distribution-manifest.json';

const argv = process.argv.slice(2);
const getArg = (name, def = null) => {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1] : def;
};
const hasFlag = (name) => argv.includes(name);

function dirSizeKB(path) {
  let bytes = 0;
  const walk = (p) => {
    for (const entry of readdirSync(p, { withFileTypes: true })) {
      const full = join(p, entry.name);
      if (entry.isDirectory()) walk(full);
      else bytes += statSync(full).size;
    }
  };
  walk(path);
  return bytes / 1024;
}

function removePath(path, dryRun) {
  if (!existsSync(path)) return false;
  const label = dryRun ? '[dry-run]' : '[remove]';
  const st = statSync(path);
  if (st.isDirectory()) {
    console.log(`${label} dir  ${path}  (${dirSizeKB(path).toFixed(1)} KB)`);
    if (!dryRun) rmSync(path, { recursive: true, force: true });
  } else {
    console.log(`${label} file ${path}  (${(st.size / 1024).toFixed(1)} KB)`);
    if (!dryRun) rmSync(path, { force: true });
  }
  return true;
}

function cleanServer(sourceRoot, dryRun) {
  return removePath(join(sourceRoot, 'target'), dryRun) ? 1 : 0;
}

function cleanClient(clientDir, dryRun, keepPageMdl) {
  let removed = 0;
  if (removePath(join(clientDir, 'dist'), dryRun)) removed++;
  if (existsSync(clientDir)) {
    for (const name of readdirSync(clientDir).sort()) {
      if (name.endsWith('.zip') && removePath(join(clientDir, name), dryRun)) removed++;
    }
  }
  const mdlDir = join(clientDir, MDL_DIR_NAME);
  if (existsSync(mdlDir) && statSync(mdlDir).isDirectory() && !keepPageMdl) {
    if (removePath(join(mdlDir, GENERATED_MDL_FILE), dryRun)) removed++;
    // Remove mdl-components/ if it's now empty (held only the generated page.mdl).
    if (!dryRun && existsSync(mdlDir) && readdirSync(mdlDir).length === 0) {
      if (removePath(mdlDir, dryRun)) removed++;
    }
  }
  return removed;
}

function discoverClientDirs(base) {
  if (!existsSync(base) || !statSync(base).isDirectory()) return [];
  const found = [];
  for (const name of readdirSync(base).sort()) {
    if (name === 'node_modules' || name === '.git') continue;
    const child = join(base, name);
    if (statSync(child).isDirectory() && existsSync(join(child, CLIENT_DIR_MARKER))) {
      found.push(child);
    }
  }
  return found;
}

function main() {
  const sourceRoot = getArg('--source-root');
  const clientDir = getArg('--client-dir');
  const clientDirBase = getArg('--client-dir-base');
  const dryRun = hasFlag('--dry-run');
  const keepPageMdl = hasFlag('--keep-page-mdl');

  if (!sourceRoot && !clientDir && !clientDirBase) {
    console.error('error: pass at least one of --source-root, --client-dir, or --client-dir-base.');
    process.exit(2);
  }

  let total = 0;
  if (sourceRoot) total += cleanServer(resolve(sourceRoot), dryRun);
  if (clientDir) total += cleanClient(resolve(clientDir), dryRun, keepPageMdl);
  if (clientDirBase) {
    const dirs = discoverClientDirs(resolve(clientDirBase));
    if (dirs.length === 0) {
      console.error(`warning: no client dirs (children with ${CLIENT_DIR_MARKER}) found under ${resolve(clientDirBase)}`);
    }
    for (const cd of dirs) total += cleanClient(cd, dryRun, keepPageMdl);
  }

  if (total === 0) console.log('[clean] nothing to remove — already clean.');
  else console.log(`[clean] ${dryRun ? 'would remove' : 'removed'} ${total} item(s).`);
}

main();
