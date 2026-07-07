import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  unlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

import { runAudit } from './audit.js';

let buildDir;

function freshBuild() {
  buildDir = mkdtempSync(join(tmpdir(), 'vpk-audit-'));
  return buildDir;
}

function validManifest() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<vaultpackage xmlns="https://veevavault.com/">',
    '  <name>VPK-X</name>',
    '  <source>',
    '    <vault></vault>',
    '    <author>a@a.com</author>',
    '  </source>',
    '  <summary>Test</summary>',
    '  <javasdk>',
    '    <deployment_option>incremental</deployment_option>',
    '  </javasdk>',
    '</vaultpackage>',
    '',
  ].join('\n');
}

function seedValidComponent(dir, order, basenameNoExt) {
  const orderDir = join(dir, 'components', order);
  mkdirSync(orderDir, { recursive: true });
  const mdl = `RECREATE Page ${basenameNoExt.replace(/^Page\./, '').replace(/^Tab\./, '')} (label('X'));`;
  writeFileSync(join(orderDir, `${basenameNoExt}.mdl`), mdl);
  const hash = createHash('md5').update(mdl).digest('hex');
  writeFileSync(join(orderDir, `${basenameNoExt}.md5`), `${hash} ${basenameNoExt}`);
}

function seedValidBuild() {
  freshBuild();
  writeFileSync(join(buildDir, 'vaultpackage.xml'), validManifest());
  seedValidComponent(buildDir, '00010', 'Page.foo__c');
  seedValidComponent(buildDir, '00020', 'Tab.foo__c');
}

function rewriteMdl(folder, base, mdl) {
  const path = join(buildDir, 'components', folder, `${base}.mdl`);
  writeFileSync(path, mdl);
  const hash = createHash('md5').update(mdl).digest('hex');
  writeFileSync(
    join(buildDir, 'components', folder, `${base}.md5`),
    `${hash} ${base}`
  );
}

function seedFullRefBuild() {
  seedValidBuild();
  rewriteMdl(
    '00010',
    'Page.foo__c',
    [
      "RECREATE Page foo__c (",
      "   label('Foo'),",
      "   active(true),",
      "   client_distribution('Clientdistribution.foo__c'),",
      "   page_client_code('Pageclientcode.foo__c'),",
      "   page_controller('Pagecontroller.com.veeva.vault.custom.pages.FooController'),",
      "   url_path_name('foo-page')",
      ");",
    ].join('\n')
  );
  rewriteMdl(
    '00020',
    'Tab.foo__c',
    [
      "RECREATE Tab foo__c (",
      "   active(true),",
      "   label('Foo'),",
      "   page('Page.foo__c'),",
      "   url('https://${Vault.domain}/ui/#custom/page/${Page.url_path_name}')",
      ");",
    ].join('\n')
  );

  // websdk
  const wsdkDir = join(buildDir, 'websdk/foo__c');
  mkdirSync(join(wsdkDir, 'dist'), { recursive: true });
  writeFileSync(join(wsdkDir, 'dist/index.js'), 'export const foo = ()=>{};');
  writeFileSync(join(wsdkDir, 'dist/index.css'), '.x{}');
  writeFileSync(
    join(wsdkDir, 'distribution-manifest.json'),
    JSON.stringify({
      name: 'foo__c',
      pages: [{ name: 'foo__c', file: 'dist/index.js', export: 'foo' }],
      stylesheets: ['dist/index.css'],
    })
  );

  // java
  const javaDir = join(buildDir, 'javasdk/src/main/java/com/veeva/vault/custom/pages');
  mkdirSync(javaDir, { recursive: true });
  writeFileSync(
    join(javaDir, 'FooController.java'),
    'package com.veeva.vault.custom.pages; public class FooController {}'
  );
}

describe('runAudit — Task 6 (checks 1-4)', () => {
  after(() => {
    if (buildDir) rmSync(buildDir, { recursive: true, force: true });
  });

  it('a valid build passes audit', () => {
    seedValidBuild();
    const result = runAudit(buildDir);
    assert.equal(result.passed, true, JSON.stringify(result.failures));
    assert.deepEqual(result.failures, []);
  });

  it('Check 1: fails when vaultpackage.xml is missing', () => {
    seedValidBuild();
    unlinkSync(join(buildDir, 'vaultpackage.xml'));
    const result = runAudit(buildDir);
    assert.equal(result.passed, false);
    assert.ok(
      result.failures.some((f) => /manifest:.*missing/.test(f)),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 2: fails when manifest uses uppercase <VaultPackage>', () => {
    seedValidBuild();
    writeFileSync(
      join(buildDir, 'vaultpackage.xml'),
      validManifest().replace('<vaultpackage', '<VaultPackage').replace('</vaultpackage', '</VaultPackage')
    );
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) => /manifest:.*root.*lowercase/.test(f)),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 2: fails when <author> is missing', () => {
    seedValidBuild();
    writeFileSync(
      join(buildDir, 'vaultpackage.xml'),
      validManifest().replace(/<author>.*<\/author>\s*/, '')
    );
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) => /manifest:.*<author>/.test(f)),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 3: fails when a component folder is not 5-digit zero-padded', () => {
    seedValidBuild();
    seedValidComponent(buildDir, '99', 'Page.bad__c');
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) => /components:.*'99'.*5-digit/.test(f)),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 4: fails when an .mdl has no matching .md5', () => {
    seedValidBuild();
    unlinkSync(join(buildDir, 'components/00010/Page.foo__c.md5'));
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) => /00010.*Page\.foo__c\.mdl.*no matching/.test(f)),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 4: fails when a .md5 has no matching .mdl (orphan)', () => {
    seedValidBuild();
    writeFileSync(join(buildDir, 'components/00010/Orphan.md5'), 'x Orphan');
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) => /orphan.*Orphan\.md5/.test(f)),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 5: fails when .md5 has a trailing newline', () => {
    seedValidBuild();
    const md5Path = join(buildDir, 'components/00010/Page.foo__c.md5');
    writeFileSync(md5Path, 'abc Page.foo__c\n');
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) => /Page\.foo__c\.md5.*malformed/.test(f)),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 5: fails when .md5 basename does not match the .mdl basename', () => {
    seedValidBuild();
    const md5Path = join(buildDir, 'components/00010/Page.foo__c.md5');
    writeFileSync(md5Path, 'a'.repeat(32) + ' WrongBasename');
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) => /Page\.foo__c\.md5.*malformed/.test(f)),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 6: fails when md5 hash is stale relative to the .mdl content', () => {
    seedValidBuild();
    const md5Path = join(buildDir, 'components/00010/Page.foo__c.md5');
    writeFileSync(md5Path, '00000000000000000000000000000000 Page.foo__c');
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) => /Page\.foo__c\.md5.*stale/.test(f)),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 7: fails when MDL contains a double-quoted value', () => {
    seedValidBuild();
    const mdlPath = join(buildDir, 'components/00010/Page.foo__c.mdl');
    writeFileSync(mdlPath, 'RECREATE Page foo__c (label("Bad"));');
    // re-stale the md5 inevitably so reset it to match
    const hash = createHash('md5').update('RECREATE Page foo__c (label("Bad"));').digest('hex');
    writeFileSync(
      join(buildDir, 'components/00010/Page.foo__c.md5'),
      `${hash} Page.foo__c`
    );
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) => /Page\.foo__c\.mdl.*double-quoted/.test(f)),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 8: fails when MDL component name is missing the __c suffix', () => {
    seedValidBuild();
    const mdlPath = join(buildDir, 'components/00010/Page.foo__c.mdl');
    const mdl = `RECREATE Page foo (label('X'));`;
    writeFileSync(mdlPath, mdl);
    const hash = createHash('md5').update(mdl).digest('hex');
    writeFileSync(
      join(buildDir, 'components/00010/Page.foo__c.md5'),
      `${hash} Page.foo__c`
    );
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) => /Page\.foo__c\.mdl.*'foo'.*__c/.test(f)),
      `failures: ${result.failures.join(' | ')}`
    );
  });
});

describe('runAudit — Task 8 (checks 9-12)', () => {
  after(() => {
    if (buildDir) rmSync(buildDir, { recursive: true, force: true });
  });

  it('a fully-referenced build passes', () => {
    seedFullRefBuild();
    const result = runAudit(buildDir);
    assert.equal(result.passed, true, result.failures.join(' | '));
  });

  it('Check 9: fails when page_controller has no matching .java', () => {
    seedFullRefBuild();
    rewriteMdl(
      '00010',
      'Page.foo__c',
      [
        "RECREATE Page foo__c (",
        "   client_distribution('Clientdistribution.foo__c'),",
        "   page_client_code('Pageclientcode.foo__c'),",
        "   page_controller('Pagecontroller.com.veeva.vault.custom.pages.MissingController'),",
        "   url_path_name('foo-page')",
        ");",
      ].join('\n')
    );
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) =>
        /Page\.foo__c.*page_controller.*MissingController.*no matching/.test(f)
      ),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 9: fails when client_distribution has no matching websdk folder', () => {
    seedFullRefBuild();
    rewriteMdl(
      '00010',
      'Page.foo__c',
      [
        "RECREATE Page foo__c (",
        "   client_distribution('Clientdistribution.missing__c'),",
        "   page_client_code('Pageclientcode.missing__c'),",
        "   page_controller('Pagecontroller.com.veeva.vault.custom.pages.FooController'),",
        "   url_path_name('foo-page')",
        ");",
      ].join('\n')
    );
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) =>
        /Page\.foo__c.*client_distribution.*missing__c.*no matching websdk/.test(f)
      ),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 9: fails when url_path_name is not URL-safe', () => {
    seedFullRefBuild();
    rewriteMdl(
      '00010',
      'Page.foo__c',
      [
        "RECREATE Page foo__c (",
        "   client_distribution('Clientdistribution.foo__c'),",
        "   page_client_code('Pageclientcode.foo__c'),",
        "   page_controller('Pagecontroller.com.veeva.vault.custom.pages.FooController'),",
        "   url_path_name('Foo Page')",
        ");",
      ].join('\n')
    );
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) =>
        /Page\.foo__c.*url_path_name.*Foo Page.*URL-safe/.test(f)
      ),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 10: fails when Tab page reference does not resolve in this VPK', () => {
    seedFullRefBuild();
    rewriteMdl(
      '00020',
      'Tab.foo__c',
      [
        "RECREATE Tab foo__c (",
        "   label('Foo'),",
        "   page('Page.missing__c'),",
        "   url('https://${Vault.domain}/ui/#custom/page/${Page.url_path_name}')",
        ");",
      ].join('\n')
    );
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) =>
        /Tab\.foo__c.*page.*Page\.missing__c.*not found/.test(f)
      ),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 11: fails when distribution-manifest.json is invalid JSON', () => {
    seedFullRefBuild();
    writeFileSync(
      join(buildDir, 'websdk/foo__c/distribution-manifest.json'),
      '{not json'
    );
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) =>
        /websdk\/foo__c.*distribution-manifest\.json.*invalid JSON/.test(f)
      ),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 11: fails when pages[].file does not exist on disk', () => {
    seedFullRefBuild();
    unlinkSync(join(buildDir, 'websdk/foo__c/dist/index.js'));
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) =>
        /websdk\/foo__c.*pages\[0\]\.file 'dist\/index\.js' not found/.test(f)
      ),
      `failures: ${result.failures.join(' | ')}`
    );
  });

  it('Check 12: fails when .DS_Store is present anywhere in the build', () => {
    seedFullRefBuild();
    writeFileSync(join(buildDir, 'websdk/.DS_Store'), 'mac noise');
    const result = runAudit(buildDir);
    assert.ok(
      result.failures.some((f) => /\.DS_Store/.test(f)),
      `failures: ${result.failures.join(' | ')}`
    );
  });
});