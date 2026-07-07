import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

import {
  materializeComponents,
  materializeWebsdk,
  materializeJavasdk,
  writeManifest,
  isNoiseFile,
  prepBuildDir,
} from './materialize.js';

const MDL_FOO = `RECREATE Page foo__c (\n   label('Foo'),\n   active(true)\n);`;
const MDL_BAR = `RECREATE Tab bar__c (\n   label('Bar'),\n   active(true)\n);`;

function makeSpec(projectRoot) {
  return {
    name: 'VPK-TEST',
    components: [
      { order: '00010', file: 'src/Page.foo__c.mdl' },
      { order: '00020', file: 'src/Tab.bar__c.mdl' },
    ],
  };
}

describe('materializeComponents — Task 3', () => {
  let projectRoot;
  let buildDir;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'vpk-mat-'));
    buildDir = join(projectRoot, 'build');
    mkdirSync(join(projectRoot, 'src'), { recursive: true });
    writeFileSync(join(projectRoot, 'src', 'Page.foo__c.mdl'), MDL_FOO);
    writeFileSync(join(projectRoot, 'src', 'Tab.bar__c.mdl'), MDL_BAR);
  });

  after(() => {
    if (projectRoot) rmSync(projectRoot, { recursive: true, force: true });
  });

  it('copies each MDL into the correctly-named ordered folder', () => {
    materializeComponents(makeSpec(), buildDir, projectRoot);
    assert.ok(existsSync(join(buildDir, 'components/00010/Page.foo__c.mdl')));
    assert.ok(existsSync(join(buildDir, 'components/00020/Tab.bar__c.mdl')));
  });

  it('preserves MDL byte content exactly', () => {
    materializeComponents(makeSpec(), buildDir, projectRoot);
    const copied = readFileSync(
      join(buildDir, 'components/00010/Page.foo__c.mdl'),
      'utf8'
    );
    assert.equal(copied, MDL_FOO);
  });

  it('writes .md5 with exact format `<hex32> <basename>` and no trailing newline', () => {
    materializeComponents(makeSpec(), buildDir, projectRoot);
    const md5Path = join(buildDir, 'components/00010/Page.foo__c.md5');
    const md5Bytes = readFileSync(md5Path);
    const expectedHash = createHash('md5').update(MDL_FOO).digest('hex');
    const expectedContent = `${expectedHash} Page.foo__c`;
    assert.equal(md5Bytes.toString('utf8'), expectedContent);
    assert.equal(
      md5Bytes.byteLength,
      Buffer.byteLength(expectedContent, 'utf8'),
      'must not have a trailing newline'
    );
  });

  it('md5 hash matches md5(file_content)', () => {
    materializeComponents(makeSpec(), buildDir, projectRoot);
    const mdlContent = readFileSync(
      join(buildDir, 'components/00020/Tab.bar__c.mdl')
    );
    const md5Content = readFileSync(
      join(buildDir, 'components/00020/Tab.bar__c.md5'),
      'utf8'
    );
    const [hash] = md5Content.split(' ');
    const expected = createHash('md5').update(mdlContent).digest('hex');
    assert.equal(hash, expected);
  });
});

describe('materializeWebsdk — Task 4', () => {
  let projectRoot;
  let buildDir;

  function setup(opts = {}) {
    projectRoot = mkdtempSync(join(tmpdir(), 'vpk-ws-'));
    buildDir = join(projectRoot, 'build');
    mkdirSync(join(projectRoot, 'client/dist'), { recursive: true });
    writeFileSync(
      join(projectRoot, 'client/dist/index.js'),
      'export const helloWorld = () => {};'
    );
    if (opts.css !== false) {
      writeFileSync(join(projectRoot, 'client/dist/index.css'), '.x{color:red}');
    }
    if (opts.maps) {
      writeFileSync(join(projectRoot, 'client/dist/index.js.map'), '{}');
      writeFileSync(join(projectRoot, 'client/dist/index.css.map'), '{}');
    }
  }

  after(() => {
    if (projectRoot) rmSync(projectRoot, { recursive: true, force: true });
  });

  it('copies dist files into websdk/<name>__c/dist/', () => {
    setup();
    const spec = {
      websdk: [
        { name: 'foo__c', distDir: 'client/dist', pageExport: 'helloWorld' },
      ],
    };
    materializeWebsdk(spec, buildDir, projectRoot);
    assert.ok(existsSync(join(buildDir, 'websdk/foo__c/dist/index.js')));
    assert.ok(existsSync(join(buildDir, 'websdk/foo__c/dist/index.css')));
  });

  it('writes distribution-manifest.json with correct shape', () => {
    setup();
    const spec = {
      websdk: [
        { name: 'foo__c', distDir: 'client/dist', pageExport: 'helloWorld' },
      ],
    };
    materializeWebsdk(spec, buildDir, projectRoot);
    const manifest = JSON.parse(
      readFileSync(join(buildDir, 'websdk/foo__c/distribution-manifest.json'), 'utf8')
    );
    assert.equal(manifest.name, 'foo__c');
    assert.equal(manifest.pages.length, 1);
    assert.equal(manifest.pages[0].name, 'foo__c');
    assert.equal(manifest.pages[0].file, 'dist/index.js');
    assert.equal(manifest.pages[0].export, 'helloWorld');
    assert.deepEqual(manifest.stylesheets, ['dist/index.css']);
  });

  it('omits stylesheets when no CSS is present', () => {
    setup({ css: false });
    const spec = {
      websdk: [
        { name: 'foo__c', distDir: 'client/dist', pageExport: 'helloWorld' },
      ],
    };
    materializeWebsdk(spec, buildDir, projectRoot);
    const manifest = JSON.parse(
      readFileSync(join(buildDir, 'websdk/foo__c/distribution-manifest.json'), 'utf8')
    );
    assert.equal(manifest.stylesheets, undefined);
  });

  it('copies source maps when present', () => {
    setup({ maps: true });
    const spec = {
      websdk: [
        { name: 'foo__c', distDir: 'client/dist', pageExport: 'helloWorld' },
      ],
    };
    materializeWebsdk(spec, buildDir, projectRoot);
    assert.ok(existsSync(join(buildDir, 'websdk/foo__c/dist/index.js.map')));
    assert.ok(existsSync(join(buildDir, 'websdk/foo__c/dist/index.css.map')));
  });
});

describe('materializeJavasdk — Task 5', () => {
  let projectRoot;
  let buildDir;

  before(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'vpk-java-'));
    buildDir = join(projectRoot, 'build');
    const javaSrc = join(projectRoot, 'server/src/main/java/com/veeva/vault/custom/pages');
    mkdirSync(javaSrc, { recursive: true });
    writeFileSync(
      join(javaSrc, 'FooController.java'),
      'package com.veeva.vault.custom.pages; public class FooController {}'
    );
    writeFileSync(join(javaSrc, 'notes.txt'), 'should be ignored');
  });

  after(() => {
    if (projectRoot) rmSync(projectRoot, { recursive: true, force: true });
  });

  it('mirrors only .java files into javasdk/src/main/java/...', () => {
    materializeJavasdk(
      { javasdk: 'server/src/main/java' },
      buildDir,
      projectRoot
    );
    const dest = join(
      buildDir,
      'javasdk/src/main/java/com/veeva/vault/custom/pages'
    );
    assert.ok(existsSync(join(dest, 'FooController.java')));
    assert.equal(
      existsSync(join(dest, 'notes.txt')),
      false,
      'non-.java files must not be copied'
    );
  });
});

describe('writeManifest — Task 5', () => {
  let buildDir;

  before(() => {
    buildDir = mkdtempSync(join(tmpdir(), 'vpk-man-'));
  });

  after(() => {
    if (buildDir) rmSync(buildDir, { recursive: true, force: true });
  });

  it('writes vaultpackage.xml with lowercase <vaultpackage> root', () => {
    const spec = {
      name: 'VPK-MUTHER',
      summary: 'MU/TH/UR Console',
      description: 'MU/TH/UR Console and related components',
      author: 'mark.arnold@devexp.com',
    };
    writeManifest(spec, buildDir);
    const xml = readFileSync(join(buildDir, 'vaultpackage.xml'), 'utf8');
    assert.match(xml, /^<\?xml /, 'must start with XML prolog');
    assert.match(xml, /<vaultpackage xmlns="https:\/\/veevavault\.com\/">/);
    assert.doesNotMatch(xml, /<VaultPackage/, 'must not use PascalCase root');
    assert.match(xml, /<name>VPK-MUTHER<\/name>/);
    assert.match(xml, /<author>mark\.arnold@devexp\.com<\/author>/);
    assert.match(xml, /<summary>MU\/TH\/UR Console<\/summary>/);
    assert.match(xml, /<deployment_option>incremental<\/deployment_option>/);
    assert.match(xml, /<\/vaultpackage>\s*$/);
  });

  it('respects custom packagetype if provided', () => {
    const spec = {
      name: 'VPK-X',
      summary: 's',
      author: 'a@a.com',
      packagetype: 'migration__v',
    };
    writeManifest(spec, buildDir);
    const xml = readFileSync(join(buildDir, 'vaultpackage.xml'), 'utf8');
    assert.match(xml, /<packagetype>migration__v<\/packagetype>/);
  });
});

describe('isNoiseFile — Task 9', () => {
  it('flags macOS and editor noise files', () => {
    assert.equal(isNoiseFile('.DS_Store'), true);
    assert.equal(isNoiseFile('Thumbs.db'), true);
    assert.equal(isNoiseFile('.gitignore'), true);
    assert.equal(isNoiseFile('foo.swp'), true);
    assert.equal(isNoiseFile('__MACOSX'), true);
  });

  it('does not flag normal files', () => {
    assert.equal(isNoiseFile('index.js'), false);
    assert.equal(isNoiseFile('Page.foo__c.mdl'), false);
    assert.equal(isNoiseFile('vaultpackage.xml'), false);
  });
});

describe('prepBuildDir — Task 9', () => {
  it('removes prior build contents (including noise) and recreates empty', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'vpk-prep-'));
    const buildDir = join(tmp, 'build');
    mkdirSync(buildDir, { recursive: true });
    writeFileSync(join(buildDir, 'stale.txt'), 'old');
    writeFileSync(join(buildDir, '.DS_Store'), 'mac');

    prepBuildDir(buildDir);

    assert.equal(existsSync(join(buildDir, 'stale.txt')), false);
    assert.equal(existsSync(join(buildDir, '.DS_Store')), false);
    assert.equal(existsSync(buildDir), true);

    rmSync(tmp, { recursive: true, force: true });
  });
});

describe('materializeWebsdk — Task 9 (noise filter)', () => {
  it('does not copy .DS_Store from dist source', () => {
    const projectRoot = mkdtempSync(join(tmpdir(), 'vpk-noise-'));
    const buildDir = join(projectRoot, 'build');
    mkdirSync(join(projectRoot, 'client/dist'), { recursive: true });
    writeFileSync(join(projectRoot, 'client/dist/index.js'), 'export const f=()=>{};');
    writeFileSync(join(projectRoot, 'client/dist/.DS_Store'), 'noise');

    const spec = {
      websdk: [
        { name: 'foo__c', distDir: 'client/dist', pageExport: 'f' },
      ],
    };
    materializeWebsdk(spec, buildDir, projectRoot);

    assert.equal(
      existsSync(join(buildDir, 'websdk/foo__c/dist/.DS_Store')),
      false
    );

    rmSync(projectRoot, { recursive: true, force: true });
  });
});