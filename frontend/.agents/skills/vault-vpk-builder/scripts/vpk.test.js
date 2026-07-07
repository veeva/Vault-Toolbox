import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VPK_SCRIPT = resolve(__dirname, 'vpk.js');

function runCli(args, cwd) {
  return spawnSync('node', [VPK_SCRIPT, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

describe('vpk CLI — Task 1: skeleton', () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'vpk-test-'));
  });

  after(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('exits 2 and prints usage when invoked with no args', () => {
    const result = runCli([], tmpDir);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /usage:.*vpk\.js <VPK-NAME>/i);
  });

  it('exits 2 when vpk.config.json is missing from cwd', () => {
    const result = runCli(['VPK-NOPE'], tmpDir);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /vpk\.config\.json not found/i);
  });
});

describe('vpk CLI — Task 11: end-to-end', () => {
  let projectRoot;

  function seedProject({ breakManifest = false } = {}) {
    projectRoot = mkdtempSync(join(tmpdir(), 'vpk-e2e-'));

    const mdlPagePath = 'toolbox/vpk/source/VPK-X/components/Page.foo__c.mdl';
    const mdlTabPath = 'toolbox/vpk/source/VPK-X/components/Tab.foo__c.mdl';
    mkdirSync(join(projectRoot, 'toolbox/vpk/source/VPK-X/components'), {
      recursive: true,
    });

    const pageMdl = [
      "RECREATE Page foo__c (",
      "   label('Foo'),",
      "   active(true),",
      "   client_distribution('Clientdistribution.foo__c'),",
      "   page_client_code('Pageclientcode.foo__c'),",
      "   page_controller('Pagecontroller.com.veeva.vault.custom.pages.FooController'),",
      "   url_path_name('foo-page')",
      ");",
    ].join('\n');
    writeFileSync(join(projectRoot, mdlPagePath), pageMdl);

    const tabMdl = breakManifest
      ? `RECREATE Tab foo__c (page("Page.foo__c"));`
      : [
          "RECREATE Tab foo__c (",
          "   active(true),",
          "   label('Foo'),",
          "   page('Page.foo__c'),",
          "   url('https://${Vault.domain}/ui/#custom/page/${Page.url_path_name}')",
          ");",
        ].join('\n');
    writeFileSync(join(projectRoot, mdlTabPath), tabMdl);

    // websdk dist
    mkdirSync(join(projectRoot, 'client/dist'), { recursive: true });
    writeFileSync(
      join(projectRoot, 'client/dist/index.js'),
      'export const foo = ()=>{};'
    );
    writeFileSync(join(projectRoot, 'client/dist/index.css'), '.x{}');

    // java
    mkdirSync(
      join(
        projectRoot,
        'server/src/main/java/com/veeva/vault/custom/pages'
      ),
      { recursive: true }
    );
    writeFileSync(
      join(
        projectRoot,
        'server/src/main/java/com/veeva/vault/custom/pages/FooController.java'
      ),
      'package com.veeva.vault.custom.pages; public class FooController {}'
    );

    writeFileSync(
      join(projectRoot, 'vpk.config.json'),
      JSON.stringify({
        packages: {
          'VPK-X': {
            summary: 'Test',
            description: 'd',
            author: 'a@a.com',
            components: [
              { order: '00010', file: mdlPagePath },
              { order: '00020', file: mdlTabPath },
            ],
            websdk: [
              {
                name: 'foo__c',
                distDir: 'client/dist',
                pageExport: 'foo',
              },
            ],
            javasdk: 'server/src/main/java',
          },
        },
      })
    );
  }

  after(() => {
    if (projectRoot) rmSync(projectRoot, { recursive: true, force: true });
  });

  it('produces a .vpk on a valid project (exit 0, file at packages/)', () => {
    seedProject();
    const result = runCli(['VPK-X'], projectRoot);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /\[OK\].*VPK-X\.vpk written/);
    assert.ok(
      existsSync(join(projectRoot, 'toolbox/vpk/packages/VPK-X.vpk')),
      'expected VPK file at packages/'
    );
  });

  it('exits 1 with diagnostics on audit failure', () => {
    seedProject({ breakManifest: true });
    const result = runCli(['VPK-X'], projectRoot);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /\[FAIL\].*double-quoted/);
    assert.equal(
      existsSync(join(projectRoot, 'toolbox/vpk/packages/VPK-X.vpk')),
      false,
      'must NOT produce a VPK on audit failure'
    );
  });
});