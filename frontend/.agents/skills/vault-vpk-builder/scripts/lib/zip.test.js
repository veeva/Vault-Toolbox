import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { zipPackage } from './zip.js';

const hasSystemZip = (() => {
  try {
    execFileSync('which', ['zip'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
})();

describe('zipPackage — Task 10', { skip: !hasSystemZip }, () => {
  let workRoot;
  let buildDir;
  let vpkPath;

  before(() => {
    workRoot = mkdtempSync(join(tmpdir(), 'vpk-zip-'));
    buildDir = join(workRoot, 'build');
    vpkPath = join(workRoot, 'out/VPK-TEST.vpk');
    mkdirSync(join(buildDir, 'components/00010'), { recursive: true });
    writeFileSync(join(buildDir, 'vaultpackage.xml'), '<vaultpackage/>');
    writeFileSync(join(buildDir, 'components/00010/Page.foo__c.mdl'), 'mdl');
    writeFileSync(join(buildDir, 'components/00010/Page.foo__c.md5'), 'hash');
  });

  after(() => {
    if (workRoot) rmSync(workRoot, { recursive: true, force: true });
  });

  it('produces a .vpk file at the requested path', () => {
    zipPackage(buildDir, vpkPath);
    assert.ok(existsSync(vpkPath));
  });

  it('archived entries use clean relative paths (no leading ./)', () => {
    zipPackage(buildDir, vpkPath);
    const result = spawnSync('unzip', ['-l', vpkPath], { encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /\bvaultpackage\.xml\b/);
    assert.match(result.stdout, /\bcomponents\/00010\/Page\.foo__c\.mdl\b/);
    assert.doesNotMatch(result.stdout, /\.\/vaultpackage\.xml/);
  });

  it('overwrites an existing .vpk file', () => {
    writeFileSync(vpkPath, 'pre-existing junk');
    zipPackage(buildDir, vpkPath);
    const result = spawnSync('unzip', ['-l', vpkPath], { encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /\bvaultpackage\.xml\b/);
  });
});