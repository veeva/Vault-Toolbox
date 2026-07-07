#!/usr/bin/env node

/* global __dirname, Buffer */

/**
 * @file vault_api.js
 * @description Robust, dependency-free command-line interface and HTTP gateway
 * for interacting with the Veeva Vault API.
 * 
 * DESIGN PRINCIPLES & BEST PRACTICES FOR REVIEWERS:
 * 
 * 1. Zero Third-Party Dependencies (Strict Constraint)
 *    To ensure downstream developer folders ("Spokes") can be cleanly dropped into
 *    any environment without requiring `npm install`, this script is written using
 *    Node.js standard library modules only (crypto, fs, path, http, https).
 * 
 * 2. Local Credential Obfuscation (Security Tradeoff)
 *    - To prevent plaintext storage of Vault credentials on disk, we encrypt the
 *      environment file `vault_env.json` using AES-256-GCM (Authenticated Encryption).
 *    - A randomly generated key is stored locally in `vault_key`.
 *    - SECURITY REVIEW NOTE: This is NOT a secure production-grade secret store (since
 *      the key and ciphertext live on the same machine). It is designed strictly for
 *      developer convenience to prevent:
 *        a) Accidental exposure via plaintext string scanning tools.
 *        b) Accidental staging and pushing of raw credentials to git repositories.
 * 
 * 3. Dynamic API Version Resolution
 *    To handle Veeva Vault's three major releases per year, the script does not hardcode
 *    API versions for core commands. On connection checks (`status`), it queries `GET /api`
 *    unversioned, dynamically discovers the latest GA version the Vault advertises, and
 *    persists it into the local environment cache for subsequent calls.
 * 
 * 4. Manual Multipart Construction
 *    Node's standard library `https` lacks native multipart form encoding. The `vaultUpload`
 *    helper manually constructs multipart form-data buffers to preserve the zero-dependency rule.
 */

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_PATH = path.join(__dirname, '../data/vault_key');
const ENV_PATH = path.join(__dirname, '../data/vault_env.json');
const FIXTURES_DIR = path.join(__dirname, '../data/fixtures');
const DOWNLOADS_DIR = path.join(__dirname, '../../../.agents/downloads');
const CLIENT_ID = 'agent-cli-middleware';

const JOB_POLL_INTERVAL_MS = 12000; // > 10s to respect the per-job rate limit
const JOB_TERMINAL_STATUSES = new Set([
    'SUCCESS', 'ERRORS_ENCOUNTERED', 'CANCELLED', 'TIMEOUT',
    'COMPLETED_DUE_TO_INACTIVITY', 'MISSED_SCHEDULE'
]);
const MAX_POLL_ATTEMPTS = 100; // ~20 minutes maximum wait time

let _apiVersionCache = null;

const args = process.argv.slice(2);
const command = args[0];

function getOrCreateKey() {
    if (fs.existsSync(KEY_PATH)) {
        return fs.readFileSync(KEY_PATH);
    }
    const dir = path.dirname(KEY_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const key = crypto.randomBytes(32);
    fs.writeFileSync(KEY_PATH, key);
    return key;
}

function encrypt(text) {
    const key = getOrCreateKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedData) {
    const key = getOrCreateKey();
    const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function formatSessionId(sessionId) {
    if (!sessionId) return sessionId;
    const tokenMarker = 'veeva-vault-';
    const idx = sessionId.toLowerCase().indexOf(tokenMarker);
    if (idx !== -1) {
        const tokenProper = sessionId.substring(idx).trim();
        return 'Bearer ' + tokenProper;
    }
    return sessionId;
}

// Module-scope arg reader so every command can parse flags.
function getArg(flags) {
    if (typeof flags === 'string') flags = [flags];
    for (const flag of flags) {
        const idx = args.indexOf(flag);
        if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
    }
    return null;
}

function pickLatestVersion(versions) {
    return versions.slice().sort((a, b) => {
        // version parts. E.g., "v25.2"  →  pa = [25, 2]
        const pa = a.replace(/^v/, '').split('.').map(Number);
        const pb = b.replace(/^v/, '').split('.').map(Number);
        return (pa[0] - pb[0]) || ((pa[1] || 0) - (pb[1] || 0));
    }).pop();
}

// GET /api (unversioned) → latest supported version string. No caching/persisting.
async function discoverApiVersion() {
    const resp = await vaultFetch('/api');
    const versions = Object.keys((resp && resp.values) || {});
    if (!versions.length) throw new Error('Could not discover API version from GET /api (check session / connectivity)');
    return pickLatestVersion(versions);
}

// Persist the resolved version into the encrypted config (non-fatal on failure).
function persistApiVersion(ver) {
    try {
        const config = getConfig();
        config.apiVersion = ver;
        config.apiVersionDate = new Date().toISOString();
        fs.writeFileSync(ENV_PATH, encrypt(JSON.stringify(config)));
    } catch { /* best-effort cache */ }
}

// Precedence: --api override (one-off, e.g. testing a specific version)
//   > in-process cache > stored vault_env.json value > live discovery (then stored).
async function resolveApiVersion() {
    const override = getArg(['--api', '--api-version']);
    if (override) return override;
    if (_apiVersionCache) return _apiVersionCache;
    try {
        const config = getConfig();
        const stored = config.apiVersion;
        const storedDateStr = config.apiVersionDate;
        if (stored) {
            let isFresh = true;
            if (storedDateStr) {
                const storedDate = new Date(storedDateStr);
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                if (storedDate < oneMonthAgo) {
                    isFresh = false;
                }
            }
            if (isFresh) {
                _apiVersionCache = stored;
                return stored;
            }
        }
    } catch { /* no config yet */ }
    const ver = await discoverApiVersion();
    _apiVersionCache = ver;
    persistApiVersion(ver);
    return ver;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getConfig() {
    if (!fs.existsSync(ENV_PATH)) {
        throw new Error('No credentials found. Run "auth" first.');
    }
    const encrypted = fs.readFileSync(ENV_PATH, 'utf8');
    return JSON.parse(decrypt(encrypted));
}

async function vaultFetch(endpoint, options = {}) {
    const config = getConfig();
    const url = new URL(endpoint, config.vaultUrl);
    
    const headers = {
        'X-VaultAPI-ClientID': CLIENT_ID,
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (config.sessionId) {
        headers['Authorization'] = config.sessionId;
    } else if (options.isLogin) {
        // No auth for login
    } else {
        // Auto-login if no session
        const session = await login();
        headers['Authorization'] = session;
    }

    return new Promise((resolve, reject) => {
        const reqOptions = {
            method: options.method || 'GET',
            headers: headers
        };

        const req = https.request(url, reqOptions, (res) => {
            let data = '';
            if (options.isStream) {
                resolve(res);
                return;
            }
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }
        req.end();
    });
}

async function login() {
    const config = getConfig();
    // Bootstrap exception: username/password auto-login runs before any session
    // exists, so it can't discover the version via GET /api (that needs a session
    // and would recurse). The auth endpoint accepts any supported version. This
    // path is unused in this project's session-id auth flow.
    const url = new URL('/api/v26.1/auth', config.vaultUrl);
    
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-VaultAPI-ClientID': CLIENT_ID
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                if (json.responseStatus === 'SUCCESS') {
                    // Update config with session ID
                    config.sessionId = json.sessionId;
                    fs.writeFileSync(ENV_PATH, encrypt(JSON.stringify(config)));
                    resolve(json.sessionId);
                } else {
                    reject(new Error(`Login failed: ${json.errors?.[0]?.message || 'Unknown error'}`));
                }
            });
        });

        req.on('error', reject);
        req.write(`username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}`);
        req.end();
    });
}

// Upload a single file as multipart/form-data field "file" to a Vault endpoint.
// Reuses the encrypted session (or auto-logs-in like vaultFetch). Stdlib-only.
async function vaultUpload(endpoint, filePath, method) {
    const config = getConfig();
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    let sessionId = config.sessionId;
    if (!sessionId) sessionId = await login();

    const url = new URL(endpoint, config.vaultUrl);
    const boundary = '----vaultcli' + crypto.randomBytes(16).toString('hex');
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);
    const head = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        `Content-Type: application/octet-stream\r\n\r\n`, 'utf8');
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const body = Buffer.concat([head, fileContent, tail]);

    const headers = {
        'X-VaultAPI-ClientID': CLIENT_ID,
        'Authorization': sessionId,
        'Accept': 'application/json',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
    };

    return new Promise((resolve, reject) => {
        const req = https.request(url, { method, headers }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch { resolve(data); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// Poll GET /services/jobs/{id} until terminal (>=12s cadence) when --wait is set;
// otherwise return a single status snapshot.
async function pollJob(jobId, { wait }) {
    const ver = await resolveApiVersion();
    let attempt = 0;
    while (true) {
        const resp = await vaultFetch(`/api/${ver}/services/jobs/${jobId}`);
        const status = (resp.data && resp.data.status) || resp.status || 'UNKNOWN';
        console.log(`[job ${jobId}] status=${status}`);
        if (!wait || JOB_TERMINAL_STATUSES.has(status)) {
            return { status, resp };
        }
        attempt++;
        if (wait && attempt >= MAX_POLL_ATTEMPTS) {
            console.warn(`[job ${jobId}] Warning: Maximum poll attempts reached (${MAX_POLL_ATTEMPTS}). Timed out.`);
            return { status: 'TIMEOUT', resp };
        }
        await sleep(JOB_POLL_INTERVAL_MS);
    }
}

async function run() {
    try {
        switch (command) {
            case 'auth': {
                // Encrypt and local-cache credentials
                const username = getArg(['--username', '--un']);
                const password = getArg(['--password', '--pwd', '--pw']);
                const rawSessionId = getArg(['--sessionid', '--session-id', '--session', '--sid']);
                const vaultDns = getArg(['--vaultdns', '--dns', '--url']);
                
                if (!vaultDns || (!rawSessionId && (!username || !password))) {
                    console.error('Usage:');
                    console.error('  node vault_api.js auth --username <user> --password <pass> --vaultdns <dns>');
                    console.error('  node vault_api.js auth --sessionid <session_id_or_api_access_token> --vaultdns <dns>');
                    process.exit(1);
                }

                const sessionId = formatSessionId(rawSessionId);
                const vaultUrl = `https://${vaultDns}`;
                const config = { vaultUrl, username, password, sessionId, vaultDns };
                const encrypted = encrypt(JSON.stringify(config));
                fs.writeFileSync(ENV_PATH, encrypted);
                console.log('Credentials encrypted and saved to vault_env.json');
                break;
            }

            case 'serve': {
                // Start local HTTP proxy for Veeva Vault API
                const portIndex = args.indexOf('--port');
                const port = portIndex !== -1 ? parseInt(args[portIndex + 1]) : 3001;
                
                const server = http.createServer(async (req, res) => {
                    // Handle CORS
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-VaultAPI-ClientID, Authorization');

                    if (req.method === 'OPTIONS') {
                        res.writeHead(204);
                        res.end();
                        return;
                    }

                    // Security check: Only forward API requests to protect authentication credentials
                    if (!req.url.startsWith('/api/')) {
                        res.writeHead(403, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ responseStatus: 'FAILURE', errors: [{ message: 'Proxy only forwards /api/ paths.' }] }));
                        return;
                    }

                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', async () => {
                        try {
                            const forwardHeaders = {
                                'X-VaultAPI-ClientID': req.headers['x-vaultapi-clientid'] || 'agent-cli-proxy'
                            };
                            if (req.headers['content-type']) {
                                forwardHeaders['Content-Type'] = req.headers['content-type'];
                            }
                            
                            const response = await vaultFetch(req.url, {
                                method: req.method,
                                body: body || null,
                                headers: forwardHeaders,
                                isStream: true
                            });
                            // Forward Vault's actual status and content-type so binary
                            // responses (e.g. PDF renditions) pass through correctly
                            res.writeHead(response.statusCode || 200, {
                                'Content-Type': response.headers['content-type'] || 'application/octet-stream',
                                'Access-Control-Allow-Origin': '*',
                            });
                            response.pipe(res);
                        } catch (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ responseStatus: 'FAILURE', errors: [{ message: err.message }] }));
                        }
                    });
                });

                server.listen(port, () => {
                    console.log(`[Proxy] Vault API Proxy listening at http://localhost:${port}`);
                    console.log(`[Proxy] Relay to: ${getConfig().vaultUrl}`);
                });
                break;
            }

            case 'vql': {
                // GET /api/{version}/query — Execute a VQL query
                const query = args[1];
                if (!query) {
                    console.error('Usage: node vault_api.js vql "<query>" [--fixture <name>]');
                    process.exit(1);
                }
                const response = await vaultFetch(`/api/${await resolveApiVersion()}/query?q=${encodeURIComponent(query)}`);
                console.log(JSON.stringify(response, null, 2));

                const fixtureIndex = args.indexOf('--fixture');
                if (fixtureIndex !== -1) {
                    const name = args[fixtureIndex + 1];
                    const fixturePath = path.join(FIXTURES_DIR, `${name}.json`);
                    fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
                    fs.writeFileSync(fixturePath, JSON.stringify(response, null, 2));
                    console.log(`[Evidence] Saved fixture to ${fixturePath}`);
                }
                break;
            }

            case 'component-query': {
                // POST /api/{version}/query/components — Execute a Component query
                const compQuery = args[1];
                if (!compQuery) {
                    console.error('Usage: node vault_api.js component-query "<query>" [--fixture <name>]');
                    process.exit(1);
                }
                const compResponse = await vaultFetch(`/api/${await resolveApiVersion()}/query/components`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `q=${encodeURIComponent(compQuery)}`
                });
                console.log(JSON.stringify(compResponse, null, 2));

                const compFixtureIndex = args.indexOf('--fixture');
                if (compFixtureIndex !== -1) {
                    const name = args[compFixtureIndex + 1];
                    const fixturePath = path.join(FIXTURES_DIR, `${name}.json`);
                    fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
                    fs.writeFileSync(fixturePath, JSON.stringify(compResponse, null, 2));
                    console.log(`[Evidence] Saved fixture to ${fixturePath}`);
                }
                break;
            }

            case 'download': {
                // GET /api/... — Download a binary file from the specified endpoint
                const endpoint = args[1];
                const outputIndex = args.indexOf('--output');
                if (!endpoint || outputIndex === -1) {
                    console.error('Usage: node vault_api.js download <endpoint> --output <filename>');
                    process.exit(1);
                }
                const filename = args[outputIndex + 1];
                const downloadsDir = DOWNLOADS_DIR;
                fs.mkdirSync(downloadsDir, { recursive: true });
                const downloadPath = path.join(downloadsDir, filename);

                const res = await vaultFetch(endpoint, { isStream: true });
                const fileStream = fs.createWriteStream(downloadPath);
                res.pipe(fileStream);
                
                fileStream.on('finish', () => {
                    console.log(`Downloaded file to ${downloadPath}`);
                });
                break;
            }

            case 'test-crypto': {
                // Local test of credential encryption and decryption
                const secret = "VaultSecret123";
                const enc = encrypt(secret);
                const dec = decrypt(enc);
                console.log(`Original: ${secret}`);
                console.log(`Encrypted: ${enc}`);
                console.log(`Decrypted: ${dec}`);
                if (secret === dec) console.log(" Crypto test passed!");
                else console.error(" Crypto test failed!");
                break;
            }

            case 'status': {
                // GET /api/{version}/scim/v2/Me — Check connection and refresh API version
                try {
                    const statusConfig = getConfig();
                    console.log(`Config found for: ${statusConfig.vaultUrl}`);
                    const statusResponse = await vaultFetch(`/api/${await resolveApiVersion()}/scim/v2/Me`);
                    if (statusResponse.id) {
                        console.log('Connection: SUCCESS');
                        console.log(`Vault DNS: ${statusConfig.vaultDns}`);
                        console.log(`User ID: ${statusResponse.id}`);
                        console.log(`User Name: ${statusResponse.userName}`);
                        // Part of the connection check: refresh + store the latest API version.
                        try {
                            const ver = await discoverApiVersion();
                            persistApiVersion(ver);
                            _apiVersionCache = ver;
                            console.log(`Latest API Version: ${ver} (stored in vault_env.json)`);
                        } catch (e) {
                            console.log(`Latest API Version: (could not determine: ${e.message})`);
                        }
                    } else {
                        console.log('Connection: FAILED');
                        if (statusResponse.errors && statusResponse.errors[0]) {
                            console.log(`Reason: ${statusResponse.errors[0].message}`);
                        } else {
                            console.log(`Reason: Unknown error (check permissions for SCIM Me)`);
                        }
                    }
                } catch (e) {
                    console.log('Connection: NOT_CONFIGURED');
                    console.log(`Reason: ${e.message}`);
                }
                break;
            }

            case 'import-package': {
                // PUT /api/{version}/services/package — Upload a package (.vpk)
                const file = getArg(['--file', '--vpk']);
                if (!file) {
                    console.error('Usage: node vault_api.js import-package --file <path.vpk> [--api <ver>]');
                    process.exit(1);
                }
                const resp = await vaultUpload(`/api/${await resolveApiVersion()}/services/package`, file, 'PUT');
                console.log(JSON.stringify(resp, null, 2));
                if (resp.responseStatus !== 'SUCCESS') process.exit(1);
                console.log(`[import] job_id=${resp.job_id} — poll with: job-status --id ${resp.job_id} --wait`);
                break;
            }

            case 'deploy-package': {
                // POST /api/{version}/vobject/vault_package__v/{id}/actions/deploy — Deploy package
                const pkgId = getArg(['--id', '--package-id']);
                if (!pkgId) {
                    console.error('Usage: node vault_api.js deploy-package --id <package_id> [--api <ver>]');
                    console.error('Find the package_id via: vql "SELECT id, name__v FROM vault_package__v ORDER BY created_date__v DESC LIMIT 10"');
                    process.exit(1);
                }
                const resp = await vaultFetch(
                    `/api/${await resolveApiVersion()}/vobject/vault_package__v/${pkgId}/actions/deploy`,
                    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                );
                console.log(JSON.stringify(resp, null, 2));
                if (resp.responseStatus !== 'SUCCESS') process.exit(1);
                console.log(`[deploy] job_id=${resp.job_id} — poll with: job-status --id ${resp.job_id} --wait`);
                break;
            }

            case 'deploy-results': {
                // GET /api/{version}/vobject/vault_package__v/{id}/actions/deploy/results — Retrieve deploy results
                const pkgId = getArg(['--id', '--package-id']);
                if (!pkgId) {
                    console.error('Usage: node vault_api.js deploy-results --id <package_id> [--api <ver>]');
                    process.exit(1);
                }
                const resp = await vaultFetch(
                    `/api/${await resolveApiVersion()}/vobject/vault_package__v/${pkgId}/actions/deploy/results`
                );
                console.log(JSON.stringify(resp, null, 2));
                break;
            }

            case 'job-status': {
                // GET /api/{version}/services/jobs/{id} — Check status of an asynchronous job
                const jobId = getArg(['--id', '--job-id']);
                if (!jobId) {
                    console.error('Usage: node vault_api.js job-status --id <job_id> [--wait] [--api <ver>]');
                    process.exit(1);
                }
                const wait = args.includes('--wait');
                const { status, resp } = await pollJob(jobId, { wait });
                console.log(JSON.stringify(resp, null, 2));
                if (status !== 'SUCCESS') process.exit(1);
                break;
            }

            case 'deploy-code': {
                // PUT /api/{version}/code — Hot-deploy a single Java class
                const file = getArg(['--file', '--java']);
                if (!file) {
                    console.error('Usage: node vault_api.js deploy-code --file <path.java> [--api <ver>]');
                    process.exit(1);
                }
                const resp = await vaultUpload(`/api/${await resolveApiVersion()}/code`, file, 'PUT');
                console.log(JSON.stringify(resp, null, 2));
                if (resp.responseStatus !== 'SUCCESS') process.exit(1);
                break;
            }

            case 'upload-distribution': {
                // POST /api/{version}/uicode/distributions — Upload Custom Page client bundle (.zip)
                const file = getArg(['--file', '--zip']);
                if (!file) {
                    console.error('Usage: node vault_api.js upload-distribution --file <path.zip> [--api <ver>]');
                    process.exit(1);
                }
                const resp = await vaultUpload(`/api/${await resolveApiVersion()}/uicode/distributions`, file, 'POST');
                console.log(JSON.stringify(resp, null, 2));
                if (resp.responseStatus !== 'SUCCESS') process.exit(1);
                break;
            }

            case 'execute-mdl': {
                // POST /api/mdl/execute — Execute MDL script (synchronously or asynchronously)
                const file = getArg(['--file', '--mdl-file']);
                const inline = getArg(['--mdl']);
                if (!file && !inline) {
                    console.error('Usage: node vault_api.js execute-mdl --file <path.mdl> | --mdl "<RECREATE ...>" [--async]');
                    process.exit(1);
                }
                const mdlText = inline || fs.readFileSync(file, 'utf8');
                const isAsync = args.includes('--async');
                const resp = await vaultFetch(isAsync ? '/api/mdl/execute_async' : '/api/mdl/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: mdlText,
                });
                console.log(JSON.stringify(resp, null, 2));
                if (isAsync && resp.job_id) console.log(`[mdl] async job_id=${resp.job_id} — poll: job-status --id ${resp.job_id} --wait`);
                const failures = (resp.script_execution && resp.script_execution.failures) || 0;
                if (resp.responseStatus !== 'SUCCESS' || failures > 0) process.exit(1);
                break;
            }

            case 'api-version': {
                // GET /api — Discover latest Vault API version and update local cache
                const latest = await discoverApiVersion();
                persistApiVersion(latest);
                _apiVersionCache = latest;
                console.log(latest);
                break;
            }

            case 'mdl-list': {
                // GET /api/mdl/components — List deployed component records
                const resp = await vaultFetch('/api/mdl/components');
                console.log(JSON.stringify(resp, null, 2));
                break;
            }

            case 'mdl-get': {
                // GET /api/mdl/components/{Type.record} — Export record as RECREATE MDL script
                const name = args[1];
                if (!name || name.startsWith('--')) { console.error('Usage: node vault_api.js mdl-get <Componenttype.record_name>'); process.exit(1); }
                const resp = await vaultFetch(`/api/mdl/components/${encodeURIComponent(name)}`);
                console.log(typeof resp === 'string' ? resp : JSON.stringify(resp, null, 2));
                break;
            }

            case 'metadata-components': {
                // GET /api/{version}/metadata/components[/{Type}] — List component types or describe type schema
                const type = (args[1] && !args[1].startsWith('--')) ? args[1] : null;
                const endpoint = type
                    ? `/api/${await resolveApiVersion()}/metadata/components/${type}`
                    : `/api/${await resolveApiVersion()}/metadata/components`;
                const resp = await vaultFetch(endpoint);
                console.log(JSON.stringify(resp, null, 2));
                break;
            }

            case 'describe': {
                // GET /api/{version}/configuration/{Type.record} — Get JSON representation of a record
                const name = args[1];
                if (!name || name.startsWith('--')) { console.error('Usage: node vault_api.js describe <Componenttype.record_name> [--api <ver>]'); process.exit(1); }
                const resp = await vaultFetch(`/api/${await resolveApiVersion()}/configuration/${encodeURIComponent(name)}`);
                console.log(JSON.stringify(resp, null, 2));
                break;
            }

            case 'vobject': {
                // GET /api/{version}/metadata/vobjects/{name} — Describe VObject metadata (fields, relationships)
                const name = args[1];
                if (!name || name.startsWith('--')) { console.error('Usage: node vault_api.js vobject <object_name> [--api <ver>]'); process.exit(1); }
                const resp = await vaultFetch(`/api/${await resolveApiVersion()}/metadata/vobjects/${name}`);
                console.log(JSON.stringify(resp, null, 2));
                break;
            }

            default: {
                console.log('Vault API CLI');
                console.log('Authentication Methods:');
                console.log('  1. Username and Password');
                console.log('  2. Session ID / API Access Token');
                console.log('Commands:');
                console.log('  auth --username <user> --password <pass> --vaultdns <dns>');
                console.log('  auth --sessionid <session_id_or_api_access_token> --vaultdns <dns>');
                console.log('  status');
                console.log('  vql "<query>" [--fixture <name>]');
                console.log('  component-query "<query>" [--fixture <name>]');
                console.log('  download <endpoint> --output <filename>');
                console.log('  serve [--port <port>]');
                console.log('  test-crypto');
                console.log('  --- deploy (authenticated; payload built by packaging scripts) ---');
                console.log('  import-package --file <path.vpk> [--api <ver>]');
                console.log('  job-status --id <job_id> [--wait] [--api <ver>]');
                console.log('  deploy-package --id <package_id> [--api <ver>]');
                console.log('  deploy-results --id <package_id> [--api <ver>]');
                console.log('  deploy-code --file <path.java> [--api <ver>]      (single-file hot deploy)');
                console.log('  upload-distribution --file <path.zip> [--api <ver>]');
                console.log('  --- MDL / configuration (vault-configuration-mdl skill) ---');
                console.log('  execute-mdl --file <path.mdl> | --mdl "<RECREATE ...>" [--async]');
                console.log('  api-version                                  (latest API version the Vault advertises)');
                console.log('  metadata-components [Componenttype] [--api <ver>] (all types, or one type\'s schema)');
                console.log('  mdl-list                                     (deployed component records)');
                console.log('  mdl-get <Componenttype.record_name>          (export a record as RECREATE MDL)');
                console.log('  describe <Componenttype.record_name> [--api <ver>] (JSON describe)');
                console.log('  vobject <object_name> [--api <ver>]                (object metadata)');
            }
        }
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    run();
}

module.exports = {
    formatSessionId,
    encrypt,
    decrypt,
    resolveApiVersion,
    persistApiVersion,
    pollJob,
    resetVersionCache: () => { _apiVersionCache = null; }
};
