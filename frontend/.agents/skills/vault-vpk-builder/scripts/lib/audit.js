import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createHash } from 'node:crypto';

const REQUIRED_MANIFEST_ELEMENTS = [
  { re: /<name>[^<]+<\/name>/, label: '<name>' },
  { re: /<author>[^<]+<\/author>/, label: '<author>' },
  { re: /<summary>[^<]+<\/summary>/, label: '<summary>' },
  { re: /<deployment_option>[^<]+<\/deployment_option>/, label: '<deployment_option>' },
];

function checkManifest(buildDir, failures) {
  const manifestPath = join(buildDir, 'vaultpackage.xml');
  if (!existsSync(manifestPath)) {
    failures.push('[FAIL] manifest: vaultpackage.xml missing');
    return;
  }

  const xml = readFileSync(manifestPath, 'utf8');

  if (/<VaultPackage[\s>]/.test(xml)) {
    failures.push('[FAIL] manifest: root element must be lowercase <vaultpackage> (per Veeva docs)');
  } else if (!/<vaultpackage\s+xmlns="https:\/\/veevavault\.com\/">/.test(xml)) {
    failures.push('[FAIL] manifest: root must be <vaultpackage xmlns="https://veevavault.com/">');
  }

  for (const { re, label } of REQUIRED_MANIFEST_ELEMENTS) {
    if (!re.test(xml)) {
      failures.push(`[FAIL] manifest: missing or empty ${label}`);
    }
  }
}

function checkComponents(buildDir, failures) {
  const componentsDir = join(buildDir, 'components');
  if (!existsSync(componentsDir)) return;

  const seen = new Set();
  const entries = readdirSync(componentsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const folder = entry.name;

    if (!/^\d{5}$/.test(folder)) {
      failures.push(`[FAIL] components: folder '${folder}' is not 5-digit zero-padded`);
      continue;
    }
    if (seen.has(folder)) {
      failures.push(`[FAIL] components: duplicate folder '${folder}'`);
    }
    seen.add(folder);

    const orderDir = join(componentsDir, folder);
    const files = readdirSync(orderDir);
    const mdlBasenames = new Set();
    const md5Basenames = new Set();

    for (const f of files) {
      if (f.endsWith('.mdl')) mdlBasenames.add(f.replace(/\.mdl$/, ''));
      else if (f.endsWith('.md5')) md5Basenames.add(f.replace(/\.md5$/, ''));
    }

    for (const base of mdlBasenames) {
      if (!md5Basenames.has(base)) {
        failures.push(`[FAIL] components/${folder}: ${base}.mdl has no matching .md5`);
        continue;
      }
      checkMd5(orderDir, folder, base, failures);
      checkMdl(orderDir, folder, base, failures);
    }
    for (const base of md5Basenames) {
      if (!mdlBasenames.has(base)) {
        failures.push(`[FAIL] components/${folder}: orphan ${base}.md5 (no matching .mdl)`);
      }
    }
  }
}

const MD5_PATTERN = /^([a-f0-9]{32}) (.+)$/;

function checkMd5(orderDir, folder, base, failures) {
  const md5Path = join(orderDir, `${base}.md5`);
  const raw = readFileSync(md5Path, 'utf8');

  if (raw.includes('\n') || raw.includes('\r')) {
    failures.push(`[FAIL] components/${folder}/${base}.md5: malformed (must not contain newlines)`);
    return;
  }
  const m = raw.match(MD5_PATTERN);
  if (!m || m[2] !== base) {
    failures.push(`[FAIL] components/${folder}/${base}.md5: malformed (expected '<hex32> ${base}')`);
    return;
  }

  const mdlContent = readFileSync(join(orderDir, `${base}.mdl`));
  const actualHash = createHash('md5').update(mdlContent).digest('hex');
  if (m[1] !== actualHash) {
    failures.push(
      `[FAIL] components/${folder}/${base}.md5: stale (expected ${actualHash}, got ${m[1]})`
    );
  }
}

const MDL_DECL = /^\s*(?:CREATE|RECREATE|ALTER)\s+\w+\s+(\S+)/m;

function checkMdl(orderDir, folder, base, failures) {
  const mdlPath = join(orderDir, `${base}.mdl`);
  const content = readFileSync(mdlPath, 'utf8');

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"')) {
      failures.push(
        `[FAIL] components/${folder}/${base}.mdl:${i + 1}: double-quoted value (use single quotes)`
      );
      break;
    }
  }

  const decl = content.match(MDL_DECL);
  if (decl && !decl[1].endsWith('__c')) {
    failures.push(
      `[FAIL] components/${folder}/${base}.mdl: name '${decl[1]}' missing __c suffix`
    );
  }
}

const NOISE_PATTERNS = [
  /^\.DS_Store$/,
  /^Thumbs\.db$/,
  /^\.git/,
  /\.swp$/,
  /^__MACOSX$/,
];

function walkAllFiles(dir, relBase = '') {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = relBase ? `${relBase}/${e.name}` : e.name;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (NOISE_PATTERNS.some((p) => p.test(e.name))) {
        out.push({ full, rel, name: e.name, isDir: true });
      }
      out.push(...walkAllFiles(full, rel));
    } else if (e.isFile()) {
      out.push({ full, rel, name: e.name, isDir: false });
    }
  }
  return out;
}

function listPageMdls(buildDir) {
  const componentsDir = join(buildDir, 'components');
  if (!existsSync(componentsDir)) return [];
  const out = [];
  for (const folder of readdirSync(componentsDir)) {
    if (!/^\d{5}$/.test(folder)) continue;
    const orderDir = join(componentsDir, folder);
    for (const f of readdirSync(orderDir)) {
      if (!f.endsWith('.mdl')) continue;
      const base = f.replace(/\.mdl$/, '');
      out.push({
        folder,
        base,
        full: join(orderDir, f),
        content: readFileSync(join(orderDir, f), 'utf8'),
      });
    }
  }
  return out;
}

function extract(content, attr) {
  const m = content.match(new RegExp(`${attr}\\('([^']*)'\\)`));
  return m ? m[1] : null;
}

function checkPageReferences(buildDir, failures) {
  const mdls = listPageMdls(buildDir);
  const pageNames = new Set(
    mdls.filter((m) => m.base.startsWith('Page.')).map((m) => m.base)
  );

  for (const mdl of mdls) {
    if (!mdl.base.startsWith('Page.')) continue;

    const controllerRef = extract(mdl.content, 'page_controller');
    if (controllerRef) {
      const className = controllerRef.replace(/^Pagecontroller\./, '');
      const expectedPath = join(
        buildDir,
        'javasdk/src/main/java',
        `${className.replaceAll('.', '/')}.java`
      );
      if (!existsSync(expectedPath)) {
        failures.push(
          `[FAIL] components/${mdl.folder}/${mdl.base}.mdl: page_controller '${className}' has no matching .java`
        );
      }
    }

    const distRef = extract(mdl.content, 'client_distribution');
    if (distRef) {
      const distName = distRef.replace(/^Clientdistribution\./, '');
      if (!existsSync(join(buildDir, 'websdk', distName))) {
        failures.push(
          `[FAIL] components/${mdl.folder}/${mdl.base}.mdl: client_distribution '${distName}' has no matching websdk folder`
        );
      }
    }

    const codeRef = extract(mdl.content, 'page_client_code');
    if (codeRef) {
      const codeName = codeRef.replace(/^Pageclientcode\./, '');
      if (!existsSync(join(buildDir, 'websdk', codeName))) {
        failures.push(
          `[FAIL] components/${mdl.folder}/${mdl.base}.mdl: page_client_code '${codeName}' has no matching websdk folder`
        );
      }
    }

    const urlPath = extract(mdl.content, 'url_path_name');
    if (urlPath && !/^[a-z0-9-]+$/.test(urlPath)) {
      failures.push(
        `[FAIL] components/${mdl.folder}/${mdl.base}.mdl: url_path_name '${urlPath}' is not URL-safe (use kebab-case: a-z, 0-9, -)`
      );
    }
  }

  for (const mdl of mdls) {
    if (!mdl.base.startsWith('Tab.')) continue;
    const pageRef = extract(mdl.content, 'page');
    if (pageRef && !pageNames.has(pageRef.replace(/^Page\./, 'Page.'))) {
      const expectedName = pageRef.startsWith('Page.') ? pageRef : `Page.${pageRef}`;
      if (!pageNames.has(expectedName)) {
        failures.push(
          `[FAIL] components/${mdl.folder}/${mdl.base}.mdl: page '${pageRef}' not found in VPK`
        );
      }
    }
  }
}

function checkWebsdkManifests(buildDir, failures) {
  const websdkDir = join(buildDir, 'websdk');
  if (!existsSync(websdkDir)) return;

  for (const entry of readdirSync(websdkDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const wsdkRoot = join(websdkDir, entry.name);
    const manifestPath = join(wsdkRoot, 'distribution-manifest.json');
    if (!existsSync(manifestPath)) continue;

    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch (err) {
      failures.push(
        `[FAIL] websdk/${entry.name}/distribution-manifest.json: invalid JSON (${err.message})`
      );
      continue;
    }

    const pages = Array.isArray(manifest.pages) ? manifest.pages : [];
    for (let i = 0; i < pages.length; i++) {
      const filePath = pages[i].file;
      if (filePath && !existsSync(join(wsdkRoot, filePath))) {
        failures.push(
          `[FAIL] websdk/${entry.name}: pages[${i}].file '${filePath}' not found`
        );
      }
    }
    const sheets = Array.isArray(manifest.stylesheets) ? manifest.stylesheets : [];
    for (let i = 0; i < sheets.length; i++) {
      if (!existsSync(join(wsdkRoot, sheets[i]))) {
        failures.push(
          `[FAIL] websdk/${entry.name}: stylesheets[${i}] '${sheets[i]}' not found`
        );
      }
    }
  }
}

function checkNoiseFiles(buildDir, failures) {
  for (const entry of walkAllFiles(buildDir)) {
    if (NOISE_PATTERNS.some((p) => p.test(entry.name))) {
      failures.push(`[FAIL] ${entry.rel}: noise file must be stripped before packaging`);
    }
  }
}

export function runAudit(buildDir) {
  const failures = [];
  checkManifest(buildDir, failures);
  checkComponents(buildDir, failures);
  checkPageReferences(buildDir, failures);
  checkWebsdkManifests(buildDir, failures);
  checkNoiseFiles(buildDir, failures);
  return { passed: failures.length === 0, failures };
}