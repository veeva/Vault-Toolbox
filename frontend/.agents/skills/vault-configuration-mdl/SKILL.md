---
name: vault-configuration-mdl
description: Retrieve, create, update, alter, drop, or describe Veeva Vault configuration via the Metadata Definition Language (MDL) REST API. Use whenever the user asks about MDL, executing MDL scripts, Vault component metadata, RECREATE/ALTER/CREATE/DROP/RENAME of components like Picklist, Object, Aitooltype, Aitool, Aicontexttype, Recordtrigger, Doclifecycle, Objectlifecycle, etc., listing components in a vault, exporting an existing component as an MDL script, or describing a component type's schema. Trigger on phrases like "MDL", "execute MDL", "RECREATE Aitool", "ALTER Object", "CREATE Picklist", "DROP component", "retrieve MDL component", "vault metadata", "component schema", "configuration metadata", "list MDL components", or "deploy this picklist to my vault". In THIS project all MDL/metadata calls go through the authenticated `vault_api.js` gateway — never raw curl, never collect username/password.
---

# Vault Configuration MDL

Drives Veeva Vault's Metadata Definition Language (MDL) REST API to read, create,
update, and delete configuration components. MDL is Vault's DDL — configuration as
text scripts (`CREATE Picklist color__c (...)`, `ALTER Object product__v (...)`)
executed against the Vault.

## In this project: everything goes through `vault_api.js`

This project standardizes on **`.agents/scripts/vault_api.js`** as the single
authenticated API gateway. It holds an **encrypted session** (`.agents/data/vault_env.json`),
so you do **not** collect a sessionId, build `Authorization` headers, or shell out to
`curl`/`python3`. All commands below are Node/JS. Confirm the session first:

```
node .agents/scripts/vault_api.js status
```

If `Connection: SUCCESS`, proceed. If `NOT_CONFIGURED`/`FAILED`, ask the user to
authenticate (they run it; token stays out of your reasoning):

```
node .agents/scripts/vault_api.js auth --sessionid <TOKEN> --vaultdns <DNS>
```

**API version — never hard-code it; it changes across releases.** `/api/mdl/*` endpoints are
unversioned, but `/api/{ver}/metadata|configuration/*` are, and new component types only appear
in recent versions. To choose the version:
1. **Check the current/GA version with the MCP** — `mcp__vault-developer-mcp__search_developer_docs`
   (e.g. query `"current API version"` / `"latest API version"`).
2. **Confirm the target version with the user** — they may want to test against a specific version
   rather than the latest.
3. `vault_api status` (the connection check) discovers and **stores** the Vault's latest version in
   `vault_env.json`, so commands reuse it for free. Pass `--api <ver>` to pin the version the user
   chose to test; otherwise `vault_api` uses the stored value (or discovers it once and stores it).

```
# auto-resolves the Vault's latest version:
node .agents/scripts/vault_api.js metadata-components Aitooltype
# or pin the version the user chose to test:
node .agents/scripts/vault_api.js metadata-components Aitooltype --api <ver>
```

`node .agents/scripts/vault_api.js api-version` prints what the *target Vault* advertises, as a
cross-check against the MCP's GA version.

## Operations — `vault_api` commands

| Goal | Command |
|---|---|
| **List all component types** (definitive; discover names + schema) | `vault_api.js metadata-components [--api <ver>]` |
| Schema of one component type (attributes, requiredness, enums, subcomponents) | `vault_api.js metadata-components <Componenttype> [--api <ver>]` |
| List deployed component **records** (only types with ≥1 record) | `vault_api.js mdl-list` |
| Export a record as a runnable `RECREATE` MDL script (raw text) | `vault_api.js mdl-get <Componenttype.record_name>` |
| Execute an MDL DDL script (CREATE / RECREATE / ALTER / DROP / RENAME) | `vault_api.js execute-mdl --file <path.mdl>` or `--mdl "<...>"` |
| Large ops (10k+ records, lifecycle enable, field add/remove) | `vault_api.js execute-mdl --file <...> --async` → `job-status --id <job> --wait` |
| Describe a component as JSON (when MDL Generate Recreate is unsupported) | `vault_api.js describe <Componenttype.record_name> [--api <ver>]` |
| Full object metadata (fields, types, relationships) | `vault_api.js vobject <object_name> [--api <ver>]` |

> **`metadata-components` (all types) is the authoritative discovery source** — use it to
> verify a component type exists and to read its schema before writing MDL. `mdl-list`
> only returns types that already have records and silently omits the rest, so it's for
> "what's deployed", not "what's possible".

## MDL script anatomy

```
<COMMAND> <Componenttype> <name> (
   <attribute>(<value>),
   <Subcomponenttype> <name>( <attribute>(<value>) )
);
```

- `<COMMAND>`: `CREATE` (fail if exists), `RECREATE` (upsert), `ALTER` (modify a subset),
  `DROP` (delete), `RENAME` (only some types).
- `<Componenttype>` is **TitleCase**, no spaces (`Picklist`, `Aitooltype`, `Recordtrigger`).
- `<name>` carries the suffix (`color__c`, `product__v`).
- String values use single quotes: `label('Color')`. Multi-line XML attributes
  (`source_code`, `configuration`) use `{ ... }` delimiters / embedded XML.
- Multi-value attributes are comma-separated inside parentheses. End every statement with `;`.

For a component type's full attribute list, either `metadata-components <Type>` against the
Vault, **or** the MCP: `mcp__vault-developer-mcp__search_developer_docs` (query e.g.
`"Aitooltype attributes MDL"`). Per AGENTS.md Guardrail #4, **confirm MDL syntax against the
MCP** before writing it — the schema differs significantly between component types.

A curated cheat sheet of common types lives in `references/component-types.md` — read on demand.

### Live Vault is the source of truth — local snapshots are at most a hint
Cached snapshots (a `toolbox/mdl/` export, hand-saved `*.mdl` files) drift the moment an
admin changes anything and may not exist at all. Whenever you need to know if a field /
attribute / relationship / picklist value / lifecycle state is real, or a record's current
definition, confirm against the **target Vault** via `metadata-components`, `vobject`,
`mdl-get`, or `describe` before that content lands in generated code, MDL, VQL, or docs.

## Workflows

**"Create / update component X"** — confirm `CREATE` vs `RECREATE` + type; if given a full
script, validate against the type schema (`metadata-components <Type>` or MCP); if described
in English, draft the MDL from the schema and **show it before executing**; run
`execute-mdl`; parse `responseStatus`, surfacing `script_execution.warnings`/`failures` and
`statement_execution[]` (line/column on failure).

**"Show me the MDL for X"** — `mdl-get <Type.record>`; return the body verbatim (runnable RECREATE).

**"What attributes does Type X have?"** — `metadata-components <Type>`, or MCP for an overview.

**"What component types exist? / does X exist?"** — `metadata-components` (definitive). Not `mdl-list`.

## Safety
- **Preview destructive ops.** `DROP`, and any `RECREATE`/`ALTER` that removes
  attributes/subcomponents, can wipe in-use config. Show the full MDL and confirm before
  executing — even on a sandbox.
- **Sandbox vs prod.** Custom-pages config is GxP-deployed to Production by design (AGENTS.md §3),
  but ad-hoc `execute-mdl` against a Production Vault is still destructive — confirm the target
  DNS (`vault_api status` shows it) before CREATE/RECREATE/ALTER/DROP.
- **No credentials in chat.** Auth is the encrypted `vault_api` session; never collect a
  username/password and never build a sessionId header by hand.

## Related skills
- **`veeva-vault-deployer`** — VPK / single-file / client-distribution deploys; its Page-MDL
  step and any arbitrary MDL defer here. (Both share `vault_api`'s `execute-mdl`.)
- **`vault-vpk-builder`** — packages MDL components into a VPK (vs. live `execute-mdl` here).
- **`custom-pages-code-reviewer` / `-feature-designer`** — the `Page` component MDL specifics
  for Custom Pages build on this general MDL authority.
