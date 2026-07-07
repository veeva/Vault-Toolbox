---
name: vault-vpk-builder
description: Packages Custom Pages into deployable Vault Packages (VPKs) via the vpk CLI.
applicable_apps:
  - custom-pages
---

# Skill: vault-vpk-builder

This skill is CLI-first: a single Node command does all materialization, auditing, and zipping. Do not hand-craft VPKs.

## 1. How to Package

```bash
node .agents/skills/vault-vpk-builder/scripts/vpk.js <VPK-NAME>
```

The CLI in one shot:
1. Reads vpk.config.json (repo root) for the named package.
2. Materializes a fresh staging area in toolbox/vpk/build/.
3. Runs the 12-point verification checklist.
4. On audit pass, zips the build into toolbox/vpk/packages/<VPK-NAME>.vpk.

## 2. The 12-Point Verification Checklist

The CLI runs this audit before zipping. Every check has an explicit pass/fail diagnostic.

1. vaultpackage.xml exists at build root.
2. Manifest root is lowercase <vaultpackage xmlns="https://veevavault.com/">.
3. Every components/*/ folder is a 5-digit zero-padded number.
4. Every .mdl has a sibling .md5.
5. Each .md5 is exactly <hex32> <basename-no-ext> on one line.
6. MD5 hash in .md5 equals md5(.mdl content).
7. MDL contains no double-quoted values (single quotes only).
8. Every MDL component name ends with __c.
9. Page MDL: references resolve to real .java and websdk folders.
10. Tab MDL: page reference resolves in this VPK.
11. distribution-manifest.json is valid; all file paths exist.
12. No noise files (.DS_Store, Thumbs.db, .git) present.

## 3. Operational Mandates
1. CLI Only: Never hand-build VPKs.
2. Audit Is Mandatory: A passing audit is a precondition for zipping.
3. Build/Ship Separation: This skill only **packages** (produces the audited `.vpk` in `toolbox/vpk/packages/`). To **deploy** it — REST import + deploy, Java single-file hot-deploy, or Custom Page client direct-deploy — use the **`veeva-vault-deployer`** skill (auth-gated via `vault_api`). Manual upload through the Vault UI also remains an option.
