import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadConfig } from './config.js';

function validSpec() {
  return {
    summary: 'Test VPK',
    description: 'desc',
    author: 'krisztian.csobalyka@veeva.com',
    components: [
      { order: '00010', file: 'toolbox/vpk/source/VPK-X/Page.foo__c.mdl' },
    ],
    websdk: [{ name: 'foo__c', distDir: 'client/dist', pageExport: 'foo' }],
    javasdk: 'server/src/main/java',
  };
}

function writeConfig(dir, packages) {
  writeFileSync(join(dir, 'vpk.config.json'), JSON.stringify({ packages }));
}

describe('config loader — Task 2', () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'vpk-cfg-'));
  });

  after(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    rmSync(join(tmpDir, 'vpk.config.json'), { force: true });
  });

  it('returns the package spec when config and package are valid', () => {
    writeConfig(tmpDir, { 'VPK-X': validSpec() });
    const spec = loadConfig('VPK-X', tmpDir);
    assert.equal(spec.name, 'VPK-X');
    assert.equal(spec.author, 'krisztian.csobalyka@veeva.com');
    assert.equal(spec.components.length, 1);
  });

  it('throws when vpk.config.json is missing', () => {
    assert.throws(
      () => loadConfig('VPK-X', tmpDir),
      /vpk\.config\.json not found/
    );
  });

  it('throws when vpk.config.json is invalid JSON', () => {
    writeFileSync(join(tmpDir, 'vpk.config.json'), '{not json');
    assert.throws(() => loadConfig('VPK-X', tmpDir), /not valid JSON/);
  });

  it('throws when package name is not in config', () => {
    writeConfig(tmpDir, { 'VPK-OTHER': validSpec() });
    assert.throws(
      () => loadConfig('VPK-X', tmpDir),
      /package 'VPK-X' not found/
    );
  });

  it("throws when package is missing 'author'", () => {
    const spec = validSpec();
    delete spec.author;
    writeConfig(tmpDir, { 'VPK-X': spec });
    assert.throws(() => loadConfig('VPK-X', tmpDir), /VPK-X missing 'author'/);
  });

  it("throws when package is missing 'summary'", () => {
    const spec = validSpec();
    delete spec.summary;
    writeConfig(tmpDir, { 'VPK-X': spec });
    assert.throws(() => loadConfig('VPK-X', tmpDir), /VPK-X missing 'summary'/);
  });

  it("throws when 'components' is empty or missing", () => {
    const spec = validSpec();
    spec.components = [];
    writeConfig(tmpDir, { 'VPK-X': spec });
    assert.throws(
      () => loadConfig('VPK-X', tmpDir),
      /components must be a non-empty array/
    );
  });

  it('treats javasdk and websdk as optional (Client-Only or pure-Java support)', () => {
    const spec = validSpec();
    delete spec.javasdk;
    delete spec.websdk;
    writeConfig(tmpDir, { 'VPK-X': spec });
    const loaded = loadConfig('VPK-X', tmpDir);
    assert.equal(loaded.javasdk, undefined);
    assert.deepEqual(loaded.websdk ?? [], []);
  });
});