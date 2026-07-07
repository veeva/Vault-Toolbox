const fs = require('fs');
const path = require('path');

/**
 * Unified Knowledge Graph and Skill Manifest Generator (Toolbox Browser Specific)
 * Usage: node generate_graph.js
 */

const APP_CONTEXT = 'toolbox-browser';

const APP_CONFIG = {
    srcDirs: ['src'],
    ignore: ['node_modules', '.git', 'dist', '.agents/meta']
};

/**
 * Synchronously read a line from stdin. Returns '' if no input is available
 * (e.g. stdin is not an interactive TTY), so callers can fall back gracefully.
 */
function promptSync(question) {
    process.stdout.write(question);
    const buf = Buffer.alloc(1024);
    try {
        const bytes = fs.readSync(0, buf, 0, buf.length, null);
        return buf.toString('utf-8', 0, bytes).trim();
    } catch (e) {
        return '';
    }
}

/**
 * Resolve the custom-pages source directories. Defaults to the conventional
 * root-level `client/` and `server/` layout; if either folder is missing from
 * the root, prompts the user for where that code is stored.
 */
function resolveCustomPagesSrcDirs() {
    const root = process.cwd();
    const resolved = [];

    const targets = [
        { folder: 'client', defaultSrc: 'client/src', label: 'client' },
        { folder: 'server', defaultSrc: 'server/src/main/java', label: 'server' }
    ];

    targets.forEach(({ folder, defaultSrc, label }) => {
        if (fs.existsSync(path.resolve(root, folder))) {
            resolved.push(defaultSrc);
        } else {
            const answer = promptSync(
                `Could not find a "${folder}" folder in the root. ` +
                `Where is the ${label} code stored? (path relative to root, blank to skip): `
            );
            if (answer) {
                if (!fs.existsSync(path.resolve(root, answer))) {
                    console.warn(`Warning: "${answer}" does not exist; including it anyway.`);
                }
                resolved.push(answer);
            } else {
                console.warn(`Warning: no ${label} path provided; skipping ${label} sources.`);
            }
        }
    });

    return resolved;
}

const OUTPUT = {
    graph: '.agents/meta/codebase_graph.json',
    repoMap: '.agents/meta/repo_map.md',
    skills: '.agents/meta/skills.md'
};

// --- Core Logic ---

function getAllFiles(dirPath, ignoreList) {
    let results = [];
    if (!fs.existsSync(dirPath)) return results;

    const list = fs.readdirSync(dirPath);
    list.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (ignoreList.some(ignored => fullPath.includes(ignored))) return;

        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(fullPath, ignoreList));
        } else {
            const ext = path.extname(fullPath);
            if (['.js', '.jsx', '.ts', '.tsx', '.java'].includes(ext)) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

function parseFrontmatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;
    const yaml = match[1];
    const metadata = {};
    let currentKey = null;

    yaml.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith('-')) {
            if (currentKey) {
                if (!Array.isArray(metadata[currentKey])) metadata[currentKey] = [];
                metadata[currentKey].push(trimmed.replace(/^- /, '').trim());
            }
        } else {
            const [key, ...valueParts] = trimmed.split(':');
            currentKey = key.trim();
            const value = valueParts.join(':').trim();
            metadata[currentKey] = value || null;
        }
    });
    return metadata;
}

// Global registries for path resolution
const absoluteFiles = new Set();
const javaRegistry = {}; // fullyQualifiedName -> relativePath

function extractPurpose(code) {
    const trimmed = code.trim();
    if (!trimmed) return '';
    
    // Match first block comment: /** ... */ or /* ... */ at the very top of the file
    const blockCommentMatch = trimmed.match(/^\/\*\*?([\s\S]*?)\*\//);
    if (blockCommentMatch) {
        const lines = blockCommentMatch[1].split('\n')
            .map(line => line.replace(/^\s*\*\s*/, '').trim()) // remove leading asterisks
            .filter(Boolean);
        if (lines.length > 0) {
            const firstLine = lines[0];
            return firstLine.split(/[.!?]/)[0].trim() + '.';
        }
    }

    // Match leading single-line comments: // ... // ...
    const singleLineCommentMatches = trimmed.match(/^(\/\/[^\n]*\n)+/);
    if (singleLineCommentMatches) {
        // Grab the first line of the single-line comment block
        const lines = singleLineCommentMatches[0].split('\n')
            .map(line => line.replace(/^\/\/\s*/, '').trim())
            .filter(Boolean);
        if (lines.length > 0) {
            const firstLine = lines[0];
            return firstLine.split(/[.!?]/)[0].trim() + '.';
        }
    }

    return '';
}

function resolveJsTsImport(sourceFile, importTarget) {
    if (!importTarget.startsWith('.')) return importTarget; // external package

    const sourceDir = path.dirname(path.resolve(process.cwd(), sourceFile));
    const targetAbsBase = path.resolve(sourceDir, importTarget);
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];

    // Try absolute path direct matches
    for (const ext of extensions) {
        const candidate = targetAbsBase + ext;
        if (absoluteFiles.has(candidate)) {
            return path.relative(process.cwd(), candidate).split(path.sep).join('/');
        }
    }

    // Try index file matches
    for (const ext of extensions) {
        const candidate = path.join(targetAbsBase, 'index' + ext);
        if (absoluteFiles.has(candidate)) {
            return path.relative(process.cwd(), candidate).split(path.sep).join('/');
        }
    }

    return importTarget;
}

function generateGraph() {
    console.log(`Generating Knowledge Graph for: ${APP_CONTEXT}...`);

    const graph = {
        metadata: {
            generatedAt: new Date().toISOString(),
            app: APP_CONTEXT,
            fileCount: 0
        },
        nodes: [],
        edges: []
    };

    const files = [];
    APP_CONFIG.srcDirs.forEach(dir => {
        files.push(...getAllFiles(path.resolve(process.cwd(), dir), APP_CONFIG.ignore));
    });

    graph.metadata.fileCount = files.length;

    // Build registries first
    files.forEach(file => {
        absoluteFiles.add(file);
        const relativePath = path.relative(process.cwd(), file).split(path.sep).join('/');

        if (file.endsWith('.java')) {
            const code = fs.readFileSync(file, 'utf-8');
            const packageMatch = code.match(/package\s+([\w\.]+);/);
            const classMatch = code.match(/public\s+class\s+(\w+)/);
            if (packageMatch && classMatch) {
                const fqName = `${packageMatch[1]}.${classMatch[1]}`;
                javaRegistry[fqName] = relativePath;
            }
        }
    });

    files.forEach(file => {
        const code = fs.readFileSync(file, 'utf-8');
        const relativePath = path.relative(process.cwd(), file).split(path.sep).join('/');
        
        const fileNode = { 
            id: relativePath, 
            type: 'FILE',
            extension: path.extname(file),
            exports: [],
            purpose: extractPurpose(code)
        };
        graph.nodes.push(fileNode);

        // Basic parsing (Regex-based for portability across domains)
        if (file.endsWith('.java')) {
            parseJava(fileNode, code, graph);
        } else {
            parseJsTs(fileNode, code, graph);
        }
    });

    // Resolve imports to real file IDs in graph.edges
    const resolvedEdges = [];
    graph.edges.forEach(edge => {
        if (edge.relation === 'IMPORTS') {
            if (edge.source.endsWith('.java')) {
                const target = edge.target;
                if (target.endsWith('.*')) {
                    const prefix = target.slice(0, -1); // e.g. "com.veeva.vault.custom.pages."
                    Object.keys(javaRegistry).forEach(fqName => {
                        if (fqName.startsWith(prefix)) {
                            resolvedEdges.push({
                                source: edge.source,
                                target: javaRegistry[fqName],
                                relation: 'IMPORTS'
                            });
                        }
                    });
                } else if (javaRegistry[target]) {
                    resolvedEdges.push({
                        source: edge.source,
                        target: javaRegistry[target],
                        relation: 'IMPORTS'
                    });
                } else {
                    // Keep external java import as is
                    resolvedEdges.push(edge);
                }
            } else {
                // JS/TS import
                const resolvedTarget = resolveJsTsImport(edge.source, edge.target);
                resolvedEdges.push({
                    source: edge.source,
                    target: resolvedTarget,
                    relation: 'IMPORTS'
                });
            }
        } else {
            resolvedEdges.push(edge);
        }
    });
    graph.edges = resolvedEdges;

    // Ensure output dir
    const dir = path.dirname(path.resolve(process.cwd(), OUTPUT.graph));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.resolve(process.cwd(), OUTPUT.graph), JSON.stringify(graph, null, 2));
    console.log(`Graph saved to ${OUTPUT.graph}`);

    // PageRank and Repo Map
    const fileNodes = graph.nodes.filter(n => n.type === 'FILE');
    const importEdges = graph.edges.filter(e => e.relation === 'IMPORTS' || e.relation === 'REFERENCES');
    const ranks = calculatePageRank(fileNodes, importEdges);
    generateRepoMap(fileNodes, ranks, importEdges);

    // Filtered Skills Manifest
    generateSkillsManifest();
}

function parseJava(fileNode, code, graph) {
    const classMatch = code.match(/public class (\w+)/);
    if (classMatch) {
        const name = classMatch[1];
        fileNode.exports.push({ name, type: 'JAVA_CLASS' });
        addEntity(graph, fileNode.id, name, 'JAVA_CLASS');
    }
    const importRegex = /import ([\w\.]+);/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
        graph.edges.push({ source: fileNode.id, target: match[1], relation: 'IMPORTS' });
    }
}

function parseJsTs(fileNode, code, graph) {
    // Basic export detection
    const exportRegex = /export (?:const|function|class|default) (\w+)/g;
    let match;
    while ((match = exportRegex.exec(code)) !== null) {
        const name = match[1];
        let type = 'VARIABLE';
        if (/^[A-Z]/.test(name)) type = 'COMPONENT';
        if (/^use/.test(name)) type = 'HOOK';
        fileNode.exports.push({ name, type });
        addEntity(graph, fileNode.id, name, type);
    }
    // Basic import detection
    const importRegex = /import .* from ['"](.*)['"]/g;
    while ((match = importRegex.exec(code)) !== null) {
        graph.edges.push({ source: fileNode.id, target: match[1], relation: 'IMPORTS' });
    }
}

function addEntity(graph, fileId, name, type) {
    const id = `${fileId}#${name}`;
    graph.nodes.push({ id, name, type, parentFile: fileId });
    graph.edges.push({ source: fileId, target: id, relation: 'DEFINES' });
}

function calculatePageRank(nodes, edges, iterations = 20, d = 0.85) {
    const nodeIds = nodes.map(n => n.id);
    const N = nodeIds.length;
    if (N === 0) return {};
    let ranks = {};
    nodeIds.forEach(id => ranks[id] = 1 / N);
    const outDegree = {};
    const inEdges = {};
    nodeIds.forEach(id => { outDegree[id] = 0; inEdges[id] = []; });
    edges.forEach(edge => {
        if (outDegree[edge.source] !== undefined && inEdges[edge.target] !== undefined) {
            outDegree[edge.source]++;
            inEdges[edge.target].push(edge.source);
        }
    });
    for (let i = 0; i < iterations; i++) {
        let newRanks = {};
        let sinkRank = 0;
        nodeIds.forEach(id => { if (outDegree[id] === 0) sinkRank += ranks[id]; });
        nodeIds.forEach(id => {
            let rankSum = 0;
            inEdges[id].forEach(src => { rankSum += ranks[src] / outDegree[src]; });
            newRanks[id] = (1 - d) / N + d * (rankSum + sinkRank / N);
        });
        ranks = newRanks;
    }
    return ranks;
}

function generateRepoMap(nodes, ranks, edges) {
    const sorted = nodes.map(n => ({ ...n, rank: ranks[n.id] || 0 })).sort((a, b) => b.rank - a.rank);

    // Pre-calculate coupling metrics
    const inDegree = {};
    const outDegree = {};
    nodes.forEach(n => {
        inDegree[n.id] = 0;
        outDegree[n.id] = 0;
    });

    edges.forEach(edge => {
        if (edge.relation === 'IMPORTS') {
            if (outDegree[edge.source] !== undefined) outDegree[edge.source]++;
            if (inDegree[edge.target] !== undefined) inDegree[edge.target]++;
        }
    });

    let md = `# Project Map: ${APP_CONTEXT}\n\n`;
    md += `Generated at: ${new Date().toLocaleString()}\n\n`;
    md += '## Core Logic\n';
    sorted.slice(0, 15).forEach(node => {
        md += `### ${node.id}\n`;
        md += `  - **Coupling**: Imported by ${inDegree[node.id] || 0} files | Imports ${outDegree[node.id] || 0} files\n`;
        if (node.purpose) {
            md += `  - **Purpose**: ${node.purpose}\n`;
        }
        if (node.exports.length > 0) {
            md += `  - **Exports**: ${node.exports.map(e => e.name).join(', ')}\n`;
        }
        md += '\n';
    });
    fs.writeFileSync(path.resolve(process.cwd(), OUTPUT.repoMap), md);
}

function generateSkillsManifest() {
    const skillsDir = path.resolve(process.cwd(), '.agents/skills');
    if (!fs.existsSync(skillsDir)) return;

    console.log(`Generating Filtered Skills Manifest for: ${APP_CONTEXT}...`);

    let md = '# Agent Skills Manifest\n';
    md += `Generated at: ${new Date().toLocaleString()}\n`;
    md += `Filtered for: ${APP_CONTEXT}\n\n`;

    const baseSkills = [];
    const appSkills = [];

    function scanSkills(dir) {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                scanSkills(fullPath);
            } else if (file === 'SKILL.md') {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const meta = parseFrontmatter(content);
                if (meta) {
                    const skill = { 
                        name: meta.name, 
                        desc: meta.description, 
                        path: path.relative(process.cwd(), fullPath),
                        apps: meta.applicable_apps || []
                    };
                    
                    if (skill.apps.length === 0 || skill.apps.includes('universal')) {
                        baseSkills.push(skill);
                    } else if (skill.apps.includes(APP_CONTEXT)) {
                        appSkills.push(skill);
                    }
                }
            }
        });
    }

    scanSkills(skillsDir);

    md += '## Base Skills (Universal)\n';
    baseSkills.forEach(s => {
        md += `- [${s.name}](${s.path}): ${s.desc}\n`;
    });

    md += `\n## App-Specific Skills (${APP_CONTEXT})\n`;
    appSkills.forEach(s => {
        md += `- [${s.name}](${s.path}): ${s.desc}\n`;
    });

    fs.writeFileSync(path.resolve(process.cwd(), OUTPUT.skills), md);
    console.log(`Manifest saved to ${OUTPUT.skills}`);
}

generateGraph();
