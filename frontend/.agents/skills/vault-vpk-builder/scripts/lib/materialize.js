import {
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { resolve, join, basename, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const NOISE_PATTERNS = [
  /^\.DS_Store$/,
  /^Thumbs\.db$/,
  /^\.git/,
  /\.swp$/,
  /^__MACOSX$/,
];

export function isNoiseFile(name) {
  return NOISE_PATTERNS.some((p) => p.test(name));
}

export function prepBuildDir(buildDir) {
  rmSync(buildDir, { recursive: true, force: true });
  mkdirSync(buildDir, { recursive: true });
}

export function materializeComponents(spec, buildDir, projectRoot = process.cwd()) {
  const componentsDir = join(buildDir, 'components');
  mkdirSync(componentsDir, { recursive: true });

  for (const component of spec.components) {
    const orderDir = join(componentsDir, component.order);
    mkdirSync(orderDir, { recursive: true });

    const srcPath = resolve(projectRoot, component.file);
    const mdlBasename = basename(srcPath);
    const destMdlPath = join(orderDir, mdlBasename);
    copyFileSync(srcPath, destMdlPath);

    const mdlContent = readFileSync(srcPath);
    const hash = createHash('md5').update(mdlContent).digest('hex');
    const md5Name = mdlBasename.replace(/\.mdl$/, '');
    writeFileSync(join(orderDir, `${md5Name}.md5`), `${hash} ${md5Name}`);
  }
}

const WEBSDK_FILES = ['index.js', 'index.css', 'index.js.map', 'index.css.map'];

export function materializeWebsdk(spec, buildDir, projectRoot = process.cwd()) {
  if (!spec.websdk?.length) return;

  for (const w of spec.websdk) {
    const wsdkDir = join(buildDir, 'websdk', w.name);
    const wsdkDistDir = join(wsdkDir, 'dist');
    mkdirSync(wsdkDistDir, { recursive: true });

    const srcDistDir = resolve(projectRoot, w.distDir);
    const hasCss = existsSync(join(srcDistDir, 'index.css'));

    for (const f of WEBSDK_FILES) {
      if (isNoiseFile(f)) continue;
      const src = join(srcDistDir, f);
      if (existsSync(src)) copyFileSync(src, join(wsdkDistDir, f));
    }

    const manifest = {
      name: w.name,
      pages: [{ name: w.name, file: 'dist/index.js', export: w.pageExport }],
    };
    if (hasCss) manifest.stylesheets = ['dist/index.css'];

    writeFileSync(
      join(wsdkDir, 'distribution-manifest.json'),
      JSON.stringify(manifest, null, 2) + '\n'
    );
  }
}

function walkJavaFiles(dir, relBase = '') {
  if (!existsSync(dir)) return [];
  const entries = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    const rel = relBase ? join(relBase, e.name) : e.name;
    if (e.isDirectory()) {
      entries.push(...walkJavaFiles(full, rel));
    } else if (e.isFile() && e.name.endsWith('.java')) {
      entries.push({ src: full, rel });
    }
  }
  return entries;
}

export function materializeJavasdk(spec, buildDir, projectRoot = process.cwd()) {
  if (!spec.javasdk) return;
  const srcRoot = resolve(projectRoot, spec.javasdk);
  if (!existsSync(srcRoot)) return;

  const destRoot = join(buildDir, 'javasdk/src/main/java');
  for (const { src, rel } of walkJavaFiles(srcRoot)) {
    const dest = join(destRoot, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
  }
}

function xmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function writeManifest(spec, buildDir) {
  mkdirSync(buildDir, { recursive: true });
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<vaultpackage xmlns="https://veevavault.com/">',
    `  <name>${xmlEscape(spec.name)}</name>`,
    '  <source>',
    '    <vault></vault>',
    `    <author>${xmlEscape(spec.author)}</author>`,
    '  </source>',
  ];
  if (spec.packagetype) {
    lines.push(`  <packagetype>${xmlEscape(spec.packagetype)}</packagetype>`);
  }
  lines.push(`  <summary>${xmlEscape(spec.summary)}</summary>`);
  if (spec.description) {
    lines.push(`  <description>${xmlEscape(spec.description)}</description>`);
  }
  lines.push(
    '  <javasdk>',
    '    <deployment_option>incremental</deployment_option>',
    '  </javasdk>',
    '</vaultpackage>',
    ''
  );
  writeFileSync(join(buildDir, 'vaultpackage.xml'), lines.join('\n'));
}