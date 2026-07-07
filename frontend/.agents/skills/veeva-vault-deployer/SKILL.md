---
name: veeva-vault-deployer
description: Packages and deploys Veeva Vault custom code — auto-detects whether a feature has client (Custom Page) and/or server (Java SDK) code and packages it as one all-in-one VPK, then deploys via the project's authenticated vault_api gateway. Also offers Java single-file hot-deploy and Custom Page client direct-deploy. Use whenever the user asks to build a VPK, deploy SDK code, push code to a Vault sandbox, hot-patch a single Java class, build/upload a custom page client distribution, run a Page MDL, or run a full feature deploy. Triggers — "build a VPK", "deploy my code", "push to my vault", "hot patch", "PUT /code", "deploy my custom page", "upload distribution", "uicode/distributions", "execute MDL", "full deploy", "deploy everything". Deployment is gated on whether vault_api is authenticated; if not, the skill offers to authenticate, and if declined, packages the VPK and stops so the user can deploy manually later.
---

# Veeva Vault Deployer

Ships Vault custom code from this repo to a Vault. The design separates two concerns cleanly:

- **Packaging is done by scripts** (deterministic, offline, no auth) — they produce artifacts on disk: an all-in-one `.vpk`, a Custom Page client `.zip`, a `page.mdl`.
- **API calls are made through `vault_api.js`** (the project's single authenticated gateway, holding an encrypted session) — the LLM drives `vault_api` commands with the packaged files as the payload.

This means a Vault session **never** leaves `vault_api` / `.agents/data/vault_env.json`. No sessionId is collected in the conversation or passed on a command line.

## The auth gate (always run this first)

Deployment depends on whether `vault_api` is authenticated into an environment:

```bash
node .agents/scripts/vault_api.js status
```

- `Connection: SUCCESS` → you may run any deploy method below.
- `NOT_CONFIGURED` / `FAILED` → **ask the user whether they want to authenticate.**
  - **Yes** → authenticate, then proceed:
    ```bash
    node .agents/scripts/vault_api.js auth --sessionid <token> --vaultdns <dns>
    # or: auth --username <user> --password <pass> --vaultdns <dns>
    ```
  - **No** → **package only** (build the VPK and stop). Tell the user where the `.vpk` landed and that they can deploy it later (Vault UI import, or re-run this skill once authenticated). Never deploy without an authenticated session.

## Step 1 — Detect what's present, package as one

Auto-detect the feature's surface and **package client + server together into one all-in-one VPK**:

- **Client present** if `client/` (or a client dir) has `esbuild.mjs` / `distribution-manifest.json` / `.jsx`.
- **Server present** if `server/` has `pom.xml` + `src/main/java/.../*.java`.
- **MDL present** if there are `Page`/`Tab` components under `toolbox/vpk/source/.../components/`.

The all-in-one VPK is built by the incumbent **`vault-vpk-builder`** skill (it bundles `components/` MDL + `websdk/` client + `javasdk/` server into one package and runs a 12-point audit):

```bash
node .agents/skills/vault-vpk-builder/scripts/vpk.js <VPK-NAME>
# → toolbox/vpk/packages/<VPK-NAME>.vpk
```

## Step 2 — Deploy (only when authenticated)

Pick the method that matches the change. All API calls go through `vault_api`.

### A. Full VPK import + deploy (recommended for production)
```bash
# 1. Import the all-in-one VPK (async)
node .agents/scripts/vault_api.js import-package --file toolbox/vpk/packages/<VPK-NAME>.vpk
# 2. Poll the import job to completion
node .agents/scripts/vault_api.js job-status --id <import_job_id> --wait
# 3. Find the package_id (the import response does NOT include it)
node .agents/scripts/vault_api.js vql "SELECT id, name__v, created_date__v FROM vault_package__v ORDER BY created_date__v DESC LIMIT 10"
# 4. ⚠️ Have the user enable Configuration Mode in the Vault UI (recommended; cannot be set via API)
# 5. Deploy (async) + poll
node .agents/scripts/vault_api.js deploy-package --id <package_id>
node .agents/scripts/vault_api.js job-status --id <deploy_job_id> --wait
# 6. (optional) component-level results
node .agents/scripts/vault_api.js deploy-results --id <package_id>
```

### B. Java single-file hot-deploy (fast iteration only)
Synchronous `PUT /code`, no Configuration Mode. Veeva **discourages** this for production (bypasses validation, can break dependent classes) — use only to hot-patch one class.
```bash
node .agents/scripts/vault_api.js deploy-code --file server/src/main/java/com/veeva/vault/custom/pages/HelloWorld.java
```

### C. Custom Page client direct-deploy (no VPK)
Build the client bundle + `page.mdl` with the packaging script, then upload the distribution and run the Page MDL. Synchronous, no Configuration Mode.
```bash
# Package only (offline): build esbuild bundle → zip (dist/ prefix + manifest) → generate page.mdl
node .agents/skills/veeva-vault-deployer/scripts/package_client.js --client-dir client
# Upload the client bundle (auto-creates Clientdistribution + Pageclientcode)
node .agents/scripts/vault_api.js upload-distribution --file client/<dist-name>.zip
# Publish the Page MDL that wires it together (do this AFTER the upload + any PageController deploy)
node .agents/scripts/vault_api.js execute-mdl --file client/mdl-components/page.mdl
```
Then surface the page URL(s): `https://<vault-dns>/ui/#custom/page/<url_path_name>`.

### Full feature (server + client)
Deploy the server half first (A), confirm `SUCCESS`, then the client half (C) — the client's `PageController` binding needs the Java class deployed first. Stop and report if the server half fails.

## Step 3 — Cleanup
```bash
node .agents/skills/veeva-vault-deployer/scripts/cleanup.js --source-root . --client-dir client --dry-run
```
Removes `target/`, `dist/`, packaged `*.zip`, and the auto-generated `mdl-components/page.mdl`. `--keep-page-mdl` preserves hand-edited Page MDL; always `--dry-run` first.

## Which packager when (boundary with `vault-vpk-builder`)

| You need… | Use |
|---|---|
| One package containing MDL + client + server, audited | `vault-vpk-builder` (`vpk.js`) → all-in-one `.vpk` |
| To import/deploy that `.vpk` over REST | this skill's `vault_api import-package` / `deploy-package` |
| A standalone client bundle (no VPK) for direct upload | this skill's `package_client.js` → `vault_api upload-distribution` |
| To hot-patch one `.java` class | this skill's `vault_api deploy-code` |
| To run a `Page`/MDL statement | this skill's `vault_api execute-mdl` (narrow: the Page wiring for a page we just shipped) |

`vault-vpk-builder` **builds**; this skill **deploys** (and provides the non-VPK fast paths). Don't reimplement VPK building here.

## Verification — after every run
- **VPK import:** job status must end `SUCCESS`. `ERRORS_ENCOUNTERED` = compilation/allowlist error → direct user to Admin → Inbound Packages for the log.
- **VPK deploy:** job `SUCCESS`. `ERRORS_ENCOUNTERED` after a clean import often means Configuration Mode was off, or a runtime dependency is missing.
- **`package_id` lookup:** match the manifest `<name>` against `name__v` (Vault may append `-N`). If multiple users import to the same Vault, confirm you matched the right record.
- **Hot-deploy:** `responseStatus: SUCCESS` + a `url` like `/api/v26.1/code/<FQCN>`. 403 = missing *Admin: Configuration: Vault Java SDK: Create/Edit*.
- **Client upload:** `responseStatus: SUCCESS` with `data.updateType` (`ADDED`/`MODIFIED`/`NO_CHANGE`). `MODIFIED` on a brand-new name = name collision; confirm. The bundle alone won't render — the matching `Page` MDL must exist.
- **MDL execute:** `responseStatus: SUCCESS` **and** `script_execution.failures == 0`.

If verification fails, surface the specific failure + log location; do not silently retry.

## Things to avoid
- **Deploying without an authenticated `vault_api` session.** Always run `status` first; if not authed and the user declines auth, package only.
- **Defaulting to single-file hot-deploy** for anything beyond a one-class patch — prefer the VPK flow.
- **Defaulting to `replace_all` / `delete_all`** in the VPK manifest — both are destructive; default `incremental` and warn before changing.
- **Polling a job faster than ~12s** per `job_id` (`API_LIMIT_EXCEEDED`). `job-status --wait` already paces at 12s.
- **Inventing endpoints or `vault_package__v` fields.** Ground in `references/rest-api.md`; only `id, name__v, created_date__v` are safe query fields.
- **Uploading a client distribution without confirming the `Page` MDL exists** — it'll succeed but the page won't render.

## Related skills (in this project)
- **`vault-vpk-builder`** — builds the all-in-one VPK (packaging only). This skill deploys it.
- **`custom-pages-*`** — authoring the Page (controller, client, MDL) this skill ships.
- **`vault-configuration-mdl`** — the authority for arbitrary MDL beyond the narrow Page wiring here. Ground any new `Page` attribute via the MCP (`mcp__vault-developer-mcp__search_developer_docs`, query "Page component attributes MDL") or `node .agents/scripts/vault_api.js metadata-components Page` before emitting it. Never emit the internal-only attributes (`default_client_code`, `disable_configuration`, `disable_permission`, `server_code`).
