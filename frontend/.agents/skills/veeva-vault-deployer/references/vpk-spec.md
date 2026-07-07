# VPK Specification

> **Project note (Toolbox Designer):** This describes the *Java-SDK-only* VPK shape (`vaultpackage.xml` + `javasdk/`). This project's primary packager is the incumbent **`vault-vpk-builder`** skill, which builds an *all-in-one* VPK (`components/` MDL + `websdk/` client bundle + `javasdk/`) via `node .agents/skills/vault-vpk-builder/scripts/vpk.js <NAME>`. Use this spec to understand the `javasdk/` portion and the manifest; use `vault-vpk-builder` to actually build the package. See `SKILL.md` § "Which packager when".

Verbatim-grounded reference for building a Vault Java SDK VPK package, sourced from the Veeva Vault Developer Portal docs:

- https://general.veevavault.dev/vault-sdk/deploying-code/create-vpk
- https://general.veevavault.dev/vault-sdk/deploying-code/import-vpk
- https://general.veevavault.dev/vault-sdk/deploying-code/deploy-vpk

Read this file before generating or modifying VPK packaging logic. Don't trust your training data — Veeva renames and reshapes things.

---

## What a VPK is

A VPK is a `.zip` archive renamed to `.vpk` containing exactly two things at its **root**:

1. A `javasdk/` folder holding the Vault SDK source tree.
2. A `vaultpackage.xml` manifest file.

The end goal is captured in the official quote:

> Create a VPK by zipping your `javasdk` folder and the `vaultpackage.xml` manifest file and renaming it with the `.vpk` extension.

## File-structure rules (mandatory)

These are validated by Vault on import — violating any of them causes the import to fail outright.

- Source files must live under `javasdk/` in a Maven project layout:
  ```
  javasdk/src/main/java/com/veeva/vault/custom/...
  ```
- Subpackages under `custom/` may be arbitrarily named — `custom.triggers`, `custom.actions`, `custom.tooltype`, etc.
- Hard limits per VPK:
  - **No more than 1,000 `.java` source files**.
  - **No more than 50 MB total** uncompressed (the docs phrase this as "50MB of data in a single deploy").
- Anything that's *not* a `.java` file inside the structure above is silently ignored on import.
- Anything outside `javasdk/src/main/java/com/veeva/vault/custom/` is silently ignored.

> Practical consequence: don't bother including `pom.xml`, `target/`, `.idea/`, MDL files, or test folders in the zip — Vault will ignore them, and including them just inflates the package size against the 50 MB limit.

## `vaultpackage.xml` manifest

The manifest **must** be named `vaultpackage.xml` and **must** sit at the root of the zip (sibling to `javasdk/`, not inside it).

### Required structure

```xml
<vaultpackage xmlns="https://veevavault.com/">
  <name>PKG-DEPLOY</name>
  <source>
    <vault></vault>
    <author>mmurray@veepharm.com</author>
  </source>
  <summary>PromoMats RecordTrigger</summary>
  <description>Record trigger on the Product object for PromoMats.</description>
  <javasdk>
    <deployment_option>incremental</deployment_option>
  </javasdk>
</vaultpackage>
```

### Attribute table

All attributes below must appear in the manifest. Attributes marked *Optional* must still be present (the tag itself), but may have empty content.

| Attribute | Required? | Purpose |
|---|---|---|
| `<vaultpackage xmlns="https://veevavault.com/">` | Required | Top-level wrapper. The `xmlns` value is mandatory and exact. |
| `<name>` | Required | A human-friendly identifier for this package. e.g. `MY-PKG-001`. |
| `<source>` | Required | Wrapper for `<vault>` and `<author>`. |
| `<source><vault>` | Optional content | Leave empty for inbound VPKs. Vault populates this on export only. |
| `<source><author>` | Required | Vault user name of the package author. Typically the user running the deploy. |
| `<summary>` | Required | Shown in **Admin → Deployment → Inbound Packages**. Keep concise. |
| `<description>` | Optional content | Tag must be present, content may be blank. |
| `<javasdk><deployment_option>` | Required | One of `incremental`, `replace_all`, `delete_all`. See below. |

### Deployment options

| Option | Behavior |
|---|---|
| `incremental` | Adds new code, overwrites existing files with the same fully-qualified class name. **Never deletes** code from the target. Safest default. |
| `replace_all` | Wipes **all** existing source code in the target Vault, then deploys what's in this VPK. Destructive. |
| `delete_all` | Deletes all source code in the target. Only valid if the VPK has an empty `javasdk/` folder (or no `javasdk/` at all). |

> Pick `incremental` unless you have an explicit reason not to. `replace_all` and `delete_all` are convenient ways to lose code permanently.

## Building the zip — practical recipe

The bundled `scripts/deploy_vpk.py` does this exact procedure:

1. Resolve the Maven project root (the directory containing `pom.xml` and `src/`).
2. Walk `src/main/java/com/veeva/vault/custom/**/*.java` and collect file paths.
3. For each `.java` file, store it in the zip at `javasdk/src/main/java/com/veeva/vault/custom/...` — the `javasdk/` prefix is what makes Vault recognize it.
4. Write `vaultpackage.xml` at the zip root (no folder prefix).
5. Save the zip with a `.vpk` extension.

Concrete example: a Java file at `<project>/src/main/java/com/veeva/vault/custom/triggers/HelloWorld.java` lands in the VPK at `javasdk/src/main/java/com/veeva/vault/custom/triggers/HelloWorld.java`.

## What a successful VPK looks like

```
my-package.vpk (zip)
├── vaultpackage.xml
└── javasdk/
    └── src/main/java/com/veeva/vault/custom/
        ├── triggers/HelloWorld.java
        ├── tooltype/MyToolHandler.java
        └── ...
```

## Common failure modes

- **Manifest at the wrong level.** It must be at the zip root, not inside `javasdk/`. If you put it inside `javasdk/`, Vault won't find it and the import will fail with an unhelpful "no manifest" error.
- **Source files outside `com/veeva/vault/custom/`.** Vault silently ignores them — your import "succeeds" but your code never gets deployed.
- **Wrong `<deployment_option>`.** Must be exactly one of `incremental`, `replace_all`, `delete_all` (lowercase, underscored). Anything else is rejected.
- **Missing `xmlns` on `<vaultpackage>`.** The attribute `xmlns="https://veevavault.com/"` is mandatory.
- **VPK over 50 MB or 1,000 files.** Vault rejects on import. If you hit this, you almost certainly have generated/test code or images mistakenly included in `src/main/java`.
- **Renaming the file extension matters.** Vault's import endpoint accepts the file by content type, but other tooling (UI uploads, the Maven plugin) cares about the `.vpk` extension. Save it as `.vpk`, not `.zip`.

## After packaging

The VPK is just one of three pieces:

1. **Build VPK** (this doc).
2. **Import VPK** to Vault (see `rest-api.md` § Import).
3. **Deploy VPK** in Vault — requires Vault to be in **Configuration Mode** first (see `rest-api.md` § Deploy).
