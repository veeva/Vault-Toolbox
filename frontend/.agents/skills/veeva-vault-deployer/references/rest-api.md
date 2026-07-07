# Vault REST API — Deployment Endpoints

> **Project note (Toolbox Designer):** This file is the API ground-truth (endpoints, payloads, status values). In this project you do **not** call these endpoints with a raw user-supplied sessionId — the project's `.agents/scripts/vault_api.js` is the authenticated gateway (it holds an encrypted session from `vault_api.js auth`). Sections below that describe "sessionId, supplied by the user" reflect the upstream skill; here, the equivalent commands are `vault_api.js import-package / job-status / deploy-package / deploy-code / upload-distribution / execute-mdl`. Read this for *what* Vault expects; see `SKILL.md` for *how* this project sends it.

Verbatim-grounded reference for the Vault REST endpoints needed to import + deploy a VPK, or to PUT a single source file, sourced from the Veeva Vault API Reference (v26.1):

- https://general.veevavault.dev/vault-api/api-reference/26.1/configuration-migration/import-package
- https://general.veevavault.dev/vault-api/api-reference/26.1/configuration-migration/deploy-package
- https://general.veevavault.dev/vault-api/api-reference/26.1/jobs/retrieve-job-status
- https://general.veevavault.dev/vault-api/api-reference/26.1/configuration-migration/retrieve-package-deploy-results
- https://general.veevavault.dev/vault-api/api-reference/26.1/managing-vault-java-sdk/add-or-replace-single-source-code-file

Read before writing or debugging any deployment networking code. The endpoint paths and payload shapes here are what Vault actually expects — not what your training data thinks.

---

## 1. Authentication — sessionId, supplied by the user

This skill assumes the user already has a valid Vault sessionId — obtained externally via VaultDX, a separate `POST /api/{version}/auth` call, OAuth/OIDC, or whatever flow they manage themselves. The skill **never** collects a username and password.

The sessionId goes into the `Authorization` header on every request:

```
Authorization: <sessionId>
```

Vault also accepts the bearer form (`Authorization: Bearer <sessionId>`) — the bundled script uses the basic form to match every curl example in the Veeva docs.

**Session lifetime:** Sessions time out after a period of inactivity (configured per-Vault) and the **maximum lifetime is 48 hours** even if kept active. If the user provided a sessionId an hour ago and you're about to make a fresh API call, that's usually fine; if it's been longer than that, ask them to refresh it. Vault returns `{"responseStatus":"FAILURE","errors":[{"type":"INVALID_SESSION_ID",...}]}` for expired sessions.

**If the user wants password-based login**, the documented endpoint is `POST /api/{version}/auth` with form-encoded `username` + `password` — but they should run that themselves and bring back the resulting `sessionId`. It's intentionally outside this skill's scope.

## 2. Import Package (uploads the VPK)

```
PUT /api/{version}/services/package
Host: {vault_dns}
Authorization: {sessionId}
Accept: application/json
Content-Type: multipart/form-data; boundary=<boundary>
```

**Body**: multipart/form-data with one field:

| Field | Required? | Description |
|---|---|---|
| `file` | yes | The `.vpk` file. |

**Response (success):**

```json
{
  "responseStatus": "SUCCESS",
  "url": "/api/v26.1/services/jobs/88717",
  "job_id": 88717
}
```

The import is **asynchronous**. The response gives you a `job_id` — you must poll the job-status endpoint (§4) until the job reaches a terminal state. Vault also emails the user a link to the validation log (with details on any compilation errors, allowlist violations, etc.).

> The import response intentionally does **not** include the `vault_package__v` record's `id`. To deploy, you need that ID — see §3 for how to find it.

### Curl reference (matches the shape the script sends)

```bash
curl -L -X PUT \
  -H 'Authorization: {sessionId}' \
  -H 'Accept: application/json' \
  -F 'file=@my-package.vpk' \
  https://myvault.veevavault.com/api/v26.1/services/package
```

## 3. Find the `package_id` (the deploy ID)

The deploy endpoint requires a `vault_package__v` record ID like `0PI000000000101`. The import endpoint doesn't return it directly. Two ways to obtain it:

**Option A — VQL (programmatic, used by the script):** after the import job reaches `SUCCESS`, query:

```
POST /api/{version}/query
Authorization: {sessionId}
Content-Type: application/x-www-form-urlencoded

q=SELECT id, name__v, created_date__v
  FROM vault_package__v
  ORDER BY created_date__v DESC
  LIMIT 10
```

The most recently created record is the one you just imported. To disambiguate, match the manifest's `<name>` against `name__v`. Vault often appends a `-N` suffix to `name__v` if a record with that base name already exists (e.g., manifest `<name>MY-PKG-001</name>` may end up as `name__v=MY-PKG-001-1`), so use substring matching rather than equality.

> Earlier drafts of this skill queried for `package_summary__v` — that field does not exist on `vault_package__v` and the query fails with `INVALID_DATA: Unknown field 'package_summary__v'`. Stick to the standard fields above.

**Option B — UI (manual):** Admin → Deployment → Inbound Packages. The package ID appears in the URL of the package detail page.

## 4. Retrieve Job Status (poll for completion)

```
GET /api/{version}/services/jobs/{job_id}
Host: {vault_dns}
Authorization: {sessionId}
Accept: application/json
```

**Response (success):**

```json
{
  "responseStatus": "SUCCESS",
  "responseMessage": "OK",
  "data": {
    "id": 1201,
    "status": "SUCCESS",
    "method": "POST",
    "links": [...],
    "created_by": 44533,
    "created_date": "2016-04-20T18:14:42.000Z",
    "run_start_date": "2016-04-20T18:14:43.000Z",
    "run_end_date": "2016-04-20T18:14:44.000Z"
  }
}
```

**Status values** (from the docs):

| Status | Terminal? | Meaning |
|---|---|---|
| `SCHEDULED`, `QUEUED`, `RUNNING`, `QUEUEING` | no | Still in progress — keep polling. |
| `SUCCESS` | yes | Done, no errors. |
| `ERRORS_ENCOUNTERED` | yes | Failed — check Vault email/UI for log. |
| `CANCELLED`, `TIMEOUT`, `COMPLETED_DUE_TO_INACTIVITY`, `MISSED_SCHEDULE` | yes | Failed in some way. |

**Rate limit:** This endpoint is limited to **one call per 10 seconds per `job_id`**. Polling faster returns `API_LIMIT_EXCEEDED`. The script uses 12s as a safe cadence.

## 5. Deploy Package

Run this **only after** the user has put the Vault into Configuration Mode (cannot be done via API — must be done in the UI by an admin).

```
POST /api/{version}/vobject/vault_package__v/{package_id}/actions/deploy
Host: {vault_dns}
Authorization: {sessionId}
Content-Type: application/x-www-form-urlencoded
Accept: application/json
```

`{package_id}` is the ID found in §3, e.g. `0PI000000000101`. No body needed.

**Response (success):**

```json
{
  "responseStatus": "SUCCESS",
  "url": "/api/v26.1/services/jobs/23301",
  "job_id": 23301
}
```

Deploy is async too — poll the job (§4) until terminal.

When the deploy job runs, Vault first **validates** the VPK (compilation, allowlist, dependencies). If validation fails, deployment stops, and any partial changes are NOT rolled back — you're expected to download the deployment log and fix forward.

## 6. Retrieve Package Deploy Results (optional, after deploy completes)

```
GET /api/{version}/vobject/vault_package__v/{package_id}/actions/deploy/results
Authorization: {sessionId}
Accept: application/json
```

**Response includes:**

- `package_status__v`: `deployed__v`, `deployed_with_warnings__v`, `deployed_with_failures__v`, etc.
- `deployment_log[]`: URLs to download the validation and deployment log files (useful when triaging a partial failure).
- `package_steps[]`: per-component breakdown of what was deployed, skipped, or failed.

## 7. Add or Replace Single Source Code File (single-file flow)

A separate, much simpler flow: PUT one `.java` file directly. **Synchronous** — Vault returns the result immediately, no job to poll. **No Configuration Mode required.** Vault parses the file's `package` declaration to determine the FQCN, so the URL doesn't need to specify it.

> Veeva explicitly **discourages** this for production code: it bypasses VPK validation and can introduce a class that breaks compilation of dependent classes already in the Vault. Use only for hot-patching a single class during development.

```
PUT /api/{version}/code
Host: {vault_dns}
Authorization: {sessionId}
Accept: application/json
Content-Type: multipart/form-data; boundary=<boundary>
```

**Body**: multipart/form-data with one field:

| Field | Required? | Description |
|---|---|---|
| `file` | yes | The `.java` file. **Maximum allowed size is 1 MB.** |

**Response (success):**

```json
{
  "responseStatus": "SUCCESS",
  "responseMessage": "Modified file",
  "url": "/api/v26.1/code/com.veeva.vault.custom.actions.MyCustomAction"
}
```

The `url` field encodes the FQCN of the class that was added or modified — useful for confirmation and for subsequent enable/disable/delete calls on `/api/{ver}/code/{FQCN}`.

**Permissions:** the user must have *Admin: Configuration: Vault Java SDK: Create* and *Edit*. Without those, the call returns a 403.

### Curl reference

```bash
curl -X PUT \
  -H 'Authorization: {sessionId}' \
  -F 'file=@/path/to/MyCustomAction.java' \
  https://myvault.veevavault.com/api/v26.1/code
```

### When to use this vs the VPK flow

| Concern | VPK flow | Single-file flow |
|---|---|---|
| Multiple files at once | yes | no — one PUT per file |
| Async with status polling | yes (job_id) | no — synchronous |
| Configuration Mode required | yes | no |
| Validation gate (compilation, allowlist, dependencies) | yes | no — just adds/replaces |
| Risk of breaking existing classes | low (validation catches it) | high (no gate) |
| Deletes anything not in the upload | only with `replace_all` / `delete_all` | never |
| Recommended by Veeva for production deploys | yes | no — hot-patch only |

## End-to-end timelines

### VPK flow

```
[client]                              [Vault]
   |                                     |
   | PUT /services/package (multipart) ─►|       (using user-supplied sessionId)
   |◄─── job_id (import) ───────────────|
   |                                     |
   | GET /services/jobs/{id}  (loop, 12s)|   ← async import + validation
   |◄─── status: SUCCESS ───────────────|      (Vault emails validation log)
   |                                     |
   | POST /query  (VQL, vault_package__v)|
   |◄─── package_id ────────────────────|
   |                                     |
   |  ── ⚠️ user puts Vault in Config Mode in UI ──|
   |                                     |
   | POST /…/{pkg}/actions/deploy ──────►|
   |◄─── job_id (deploy) ───────────────|
   |                                     |
   | GET /services/jobs/{id}  (loop, 12s)|   ← async deploy
   |◄─── status: SUCCESS ───────────────|
   |                                     |
   | GET /…/{pkg}/actions/deploy/results | (optional)
   |◄─── component-level results ───────|
```

### Single-file flow

```
[client]                              [Vault]
   |                                     |
   | PUT /api/{ver}/code (multipart) ───►|       (using user-supplied sessionId)
   |◄─── SUCCESS + FQCN url ────────────|
```

## 8. Custom Page client distribution

A third flow, for **Vault Custom Pages**, ships a bundled JavaScript client (typically a React app built with esbuild) plus a `distribution-manifest.json` that maps Page component names to bundle files. **Synchronous** — Vault returns the result immediately, no job to poll. **No Configuration Mode required.**

This endpoint does **not** ship code that runs in the JVM. It ships browser-side assets that Vault serves when the matching `Page` MDL component is opened in the UI.

### Mental model: resource endpoints vs. MDL-managed components

Two kinds of records live in Vault's configuration:

| Kind | How records are created | How records are deleted | Examples |
|---|---|---|---|
| **MDL-managed components** | `CREATE`/`RECREATE`/`ALTER` via `/api/mdl/execute` | `DROP <Componenttype> <name>;` via `/api/mdl/execute` | `Page`, `Object`, `Picklist`, `Recordtrigger`, `Doclifecycle`, … |
| **Resource-endpoint-owned components** | **Side effect** of uploading the underlying artifact to a dedicated REST endpoint | Dedicated `DELETE` REST endpoint (NOT MDL — see below) | `Clientdistribution` (+ child `Pageclientcode`), `Pagecontroller` |

`Clientdistribution.<name>` and its child `Pageclientcode.*` records are **auto-created by `POST /uicode/distributions`** itself — there is no MDL `CREATE Clientdistribution …`. The `updateType: ADDED` in the upload response means Vault just created the record; `MODIFIED` means it replaced an existing one; `NO_CHANGE` means the checksum was identical so it no-op'd. The `Pageclientcode` subcomponents (one per `pages[]` entry in `distribution-manifest.json`) come along with their parent Clientdistribution automatically.

Same pattern for `Pagecontroller.<fqcn>`: it's auto-created when a Java class is uploaded to `/api/{ver}/code` (either via the VPK flow or single-file `PUT /code`), and removed when the class is deleted via `DELETE /api/{ver}/code/<fqcn>`.

Your `Page` MDL component is the wiring that **references** these auto-created records:

```
RECREATE Page hello_world__c (
  ...,
  client_distribution('Clientdistribution.hello_world__c'),   // must already exist (from the upload)
  page_client_code('Pageclientcode.hello_world__c'),          // child subcomponent of the Clientdistribution
  page_controller('Pagecontroller.com.veeva.vault.custom.pages.HelloWorld')   // must already exist (from /code)
);
```

So the dependency order on first deploy is: **upload the distribution + Java first, then publish the `Page` MDL that points at them.** The deployer skill enforces this in Mode 5 by uploading before executing the MDL; Mode 6 deploys the VPK (which creates the Pagecontroller) before the client half.

```
POST /api/{version}/uicode/distributions
Host: {vault_dns}
Authorization: {sessionId}
Accept: application/json
Content-Type: multipart/form-data; boundary=<boundary>
```

**Body**: multipart/form-data with one field:

| Field | Required? | Description |
|---|---|---|
| `file` | yes | A zip archive containing the built `dist/` directory and a `distribution-manifest.json` at the zip root. |

**Required zip layout:**

```
hello-world.zip
├── distribution-manifest.json   ← at zip root
└── dist/
    ├── hello-world.js           ← the bundled entry, referenced by the manifest
    └── hello-world.js.map       ← optional sourcemap
```

**`distribution-manifest.json` shape:**

```json
{
  "name": "hello_world__c",
  "pages": [
    {
      "name": "hello_world__c",
      "file": "dist/hello-world.js"
    }
  ]
}
```

- `name` — the distribution component name. Conventionally matches the `Page` component name (`<page>__c`).
- `pages[]` — every Page component the distribution serves. Each entry needs `name` (the Page MDL component name) and `file` (the path *inside the zip* to that Page's bundled entry, including the `dist/` prefix).

**Response (success):**

```json
{
  "responseStatus": "SUCCESS",
  "data": {
    "name": "hello_world__c",
    "updateType": "ADDED",
    "checksum": "c3578dfc876acabebc5af824a1448ed3"
  }
}
```

- `updateType: ADDED` — first upload of this `name`.
- `updateType: MODIFIED` — replaces the previously uploaded distribution with this `name`.
- `updateType: NO_CHANGE` — the uploaded zip's checksum matches the existing distribution; Vault no-ops and returns success. Common when re-running a deploy without changing any client source. Not an error.
- `checksum` — MD5-ish of the uploaded zip; useful to confirm what Vault stored.

**Curl reference:**

```bash
curl -L -X POST \
  -H 'Authorization: {sessionId}' \
  -F 'file=@hello-world.zip' \
  https://myvault.veevavault.com/api/v26.1/uicode/distributions
```

### Deleting a distribution

```
DELETE /api/{version}/uicode/distributions/{name}
Host: {vault_dns}
Authorization: {sessionId}
Accept: application/json
```

Removes the uploaded client bundle from Vault. Returns `{"responseStatus":"SUCCESS"}` on success.

```bash
curl -L -X DELETE \
  -H 'Authorization: {sessionId}' \
  https://myvault.veevavault.com/api/v26.1/uicode/distributions/hello_world__c
```

**Important — `Clientdistribution` is NOT MDL-managed.** Trying to remove the distribution via `DROP Clientdistribution <name>` through `/api/mdl/execute` fails with `[FAILURE] DROP Clientdistribution <name> — Component type [Clientdistribution] does not support MDL` (error code `GEN-FDRO-II-22004`). Use the `DELETE /uicode/distributions/{name}` REST endpoint above; do not detour through MDL.

When cleaning up an obsolete Custom Page, the right order is:

1. `DROP Page <name>__c;` via `/api/mdl/execute` — Page references both the Clientdistribution and the Pagecontroller, so it has to go first to free those references.
2. `DELETE /api/{ver}/uicode/distributions/<name>` — removes the client bundle record.
3. `DELETE /api/{ver}/code/<fqcn>` — removes the underlying Java class (which also cleans up the auto-generated `Pagecontroller` component that referenced it).

### Important: the distribution is only half the page

The upload ships the **client bundle**. For the page to actually render, you also need:

1. A `Page` MDL component published via `POST /api/mdl/execute`:
   ```
   RECREATE Page hello_world__c (
     label('Hello World'),
     url_path_name('hello-world'),
     page_client_code('Pageclientcode.hello_world__c'),
     client_distribution('Clientdistribution.hello_world__c')
   );
   ```
2. *(Optional)* If the page has a server-side `PageController`, bind it via:
   ```
   ALTER Page hello_world__c (
     page_controller('Pagecontroller.com.veeva.vault.custom.<package>.<ClassName>')
   );
   ```
   The `PageController` Java class must already be deployed (via VPK or single-file PUT) before the ALTER will resolve.

These MDL operations are out of scope for this skill — direct the user to the `vault-configuration-mdl` skill.

### Client distribution flow

```
[client]                              [Vault]
   |                                     |
   | node esbuild.mjs                    |       (local build → dist/)
   | zip dist + distribution-manifest.json
   | POST /api/{ver}/uicode/distributions ►|     (using user-supplied sessionId)
   |◄─── SUCCESS + name/updateType/checksum
   |                                     |
   |  (separately) POST /api/mdl/execute ►|     ← RECREATE/ALTER Page if not already done
   |◄─── SUCCESS ───────────────────────|
```

## Common failure modes

- **`INVALID_SESSION_ID`** — sessionId expired (likely after 48h, or after inactivity). Ask the user to refresh it via their auth flow and provide a new one; this skill never collects credentials directly.
- **`API_LIMIT_EXCEEDED` while polling** — you polled the same `job_id` faster than once per 10s. Back off to ≥12s.
- **Import succeeds but deploy fails with no obvious error** — almost always means Vault is not in Configuration Mode. Toggle it via the UI and retry the deploy step (the package is already imported; you just need to re-call deploy).
- **VQL returns no records** — the import job reported SUCCESS but the `vault_package__v` record isn't visible yet. Wait a few seconds (eventual consistency) and retry the query.
- **VQL `INVALID_DATA: Unknown field 'X'`** — only the standard fields exist on `vault_package__v`. Stick to `id, name__v, created_date__v`. Do **not** invent fields like `package_summary__v` or `summary__v`.
- **`ERRORS_ENCOUNTERED` on the import job** — almost always a Java compilation error or use of a non-allowlisted class. Check the validation log emailed by Vault, or re-run with the dedicated `POST /api/{version}/services/package/actions/validate` endpoint to inspect errors without committing the package.
- **Single-file `PUT /code` returns 403** — the user lacks *Admin: Configuration: Vault Java SDK: Create* / *Edit* permissions on this Vault.
- **Single-file `PUT /code` returns FAILURE with a parser/compilation error** — the `.java` file's `package` declaration must put it under `com.veeva.vault.custom.*`, and the file must compile in the context of what's already deployed. Vault rejects malformed or non-compiling files.
- **Client distribution upload succeeds but the Page renders blank / 404** — almost always means the `Page` MDL component does not exist yet (or its `client_distribution(...)` does not point at the uploaded `name`). Run the matching `RECREATE Page <name>__c (...)` via `POST /api/mdl/execute`.
- **Client distribution upload succeeds but the page errors with "module not found"** — the zip's internal layout drifted from the manifest. Confirm that `distribution-manifest.json` lives at the zip root and that every `"file": "dist/..."` resolves to an actual `.js` inside the zip. The most common cause is zipping from one directory up so files end up at `<dir>/dist/...` instead of `dist/...`.
- **Client distribution `updateType: MODIFIED` when the user expected `ADDED`** — a distribution with the same `name` already exists in this Vault. Confirm with the user before re-uploading.
