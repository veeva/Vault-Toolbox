import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../../..');
const VPK_SCRIPT = join(REPO_ROOT, '.agents/skills/vault-vpk-builder/scripts/vpk.js');
const EXPECTED_FILES = [
  'components/00010/Page.hello_world_react_esbuild__c.md5',
  'components/00010/Page.hello_world_react_esbuild__c.mdl',
  'components/00020/Tab.hello_world_react_esbuild__c.md5',
  'components/00020/Tab.hello_world_react_esbuild__c.mdl',
  'components/00030/Page.muthur__c.md5',
  'components/00030/Page.muthur__c.mdl',
  'components/00040/Tab.muthur__c.md5',
  'components/00040/Tab.muthur__c.mdl',
  'javasdk/src/main/java/com/veeva/vault/custom/pages/HelloWorldController.java',
  'vaultpackage.xml',
  'websdk/hello_world_react_esbuild__c/dist/index.css',
  'websdk/hello_world_react_esbuild__c/dist/index.css.map',
  'websdk/hello_world_react_esbuild__c/dist/index.js',
  'websdk/hello_world_react_esbuild__c/dist/index.js.map',
  'websdk/hello_world_react_esbuild__c/distribution-manifest.json',
];

describe('vpk CLI — Task 12: VPK-MUTHER smoke test', () => {
  it('produces VPK-MUTHER.vpk with the canonical file list (no .DS_Store)', () => {
    const built = spawnSync('node', [VPK_SCRIPT, 'VPK-MUTHER'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    assert.equal(built.status, 0, built.stdout + built.stderr);

    const vpkPath = join(REPO_ROOT, 'toolbox/vpk/packages/VPK-MUTHER.vpk');
    assert.ok(existsSync(vpkPath), 'VPK file must exist');

    const listed = spawnSync('unzip', ['-Z1', vpkPath], { encoding: 'utf8' });
    assert.equal(listed.status, 0);
    const actualFiles = listed.stdout
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.endsWith('/'))
      .sort();

    assert.deepEqual(actualFiles, EXPECTED_FILES.slice().sort());
    assert.equal(
      actualFiles.includes('websdk/.DS_Store'),
      false,
      '.DS_Store must be stripped'
    );
  });
});