#!/usr/bin/env node
import { statSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

import { loadConfig } from './lib/config.js';
import {
  prepBuildDir,
  materializeComponents,
  materializeWebsdk,
  materializeJavasdk,
  writeManifest,
} from './lib/materialize.js';
import { runAudit } from './lib/audit.js';
import { zipPackage } from './lib/zip.js';

const [, , name] = process.argv;

if (!name) {
  process.stderr.write('Usage: node vpk.js <VPK-NAME>\n');
  process.exit(2);
}

const cwd = process.cwd();
const configPath = resolve(cwd, 'vpk.config.json');
if (!existsSync(configPath)) {
  process.stderr.write(`vpk.config.json not found at ${configPath}\n`);
  process.exit(2);
}

let spec;
try {
  spec = loadConfig(name, cwd);
} catch (err) {
  process.stderr.write(`${err.message}\n`);
  process.exit(2);
}

const buildDir = resolve(cwd, 'toolbox/vpk/build', name);
const vpkPath = resolve(cwd, 'toolbox/vpk/packages', `${name}.vpk`);

process.stdout.write(`[INFO] Materializing ${name} → ${buildDir}\n`);
prepBuildDir(buildDir);
writeManifest(spec, buildDir);
materializeComponents(spec, buildDir, cwd);
materializeWebsdk(spec, buildDir, cwd);
materializeJavasdk(spec, buildDir, cwd);

process.stdout.write(`[INFO] Auditing 12-point checklist\n`);
const audit = runAudit(buildDir);
if (!audit.passed) {
  for (const f of audit.failures) process.stderr.write(`${f}\n`);
  process.stderr.write(`\n[FAIL] ${audit.failures.length} check(s) failed — VPK not packaged.\n`);
  process.exit(1);
}

process.stdout.write(`[INFO] Audit passed — packaging .vpk\n`);
zipPackage(buildDir, vpkPath);

const size = statSync(vpkPath).size;
const fileCount = countFiles(buildDir);
process.stdout.write(
  `[OK]  ${name}.vpk written (${fileCount} files, ${(size / 1024).toFixed(1)} KB) → ${vpkPath}\n`
);
process.exit(0);

function countFiles(dir) {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countFiles(join(dir, e.name));
    else if (e.isFile()) n += 1;
  }
  return n;
}