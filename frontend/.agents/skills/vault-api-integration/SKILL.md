---
name: vault-api-integration
description: Universal methodology for Vault API interaction. Includes Evidence-First mandate and Vault API CLI guide.
triggers:
  - api
  - vql
  - fetch
  - authentication
  - evidence
  - fixture
---

# Vault API Integration (Base)

This skill provides the universal mandates and tools for interacting with Veeva Vault APIs across all Designer applications.

## 1. Core Mandates

### Evidence-First Integration
Before writing any parser for an external data source, you MUST obtain a real response sample.
1. **Mandatory API Utility Evidence (Hard Gate):** Before proceeding to Phase 3 (Implementation Plan), you MUST run at least one Vault API Utility command for every new VQL target or API endpoint to verify syntax and response structure. This evidence must be referenced in the Design Document.
2. **Real sample before code:** Use `vault_api.js` to obtain a real sample (raw-dump log or real call) before writing transformation logic.
3. **Raw-dump log first:** Add `console.log('[raw]', JSON.stringify(response, null, 2))` as the first line of any new integration hook.
4. **Save real response as fixture:** Use the `--fixture` flag in `vault_api.js` to save real responses. Unit tests MUST load these fixtures.
5. **Never infer field names:** Documentation and UI labels are NOT field names. Only valid source is an actual response payload.

### Handling Vault API Responses
1. **Strict Failure Checking:** Never check for `responseStatus === 'SUCCESS'`. The Vault API may return `WARNING` with valid data. Always explicitly check for `responseStatus === 'FAILURE'` to handle errors; treat all other statuses as successful data retrieval.
2. **Query Wrapper Awareness:** When interacting with `ApiService.query` or `queryByPage`, explicitly note that the Vault response payload is wrapped inside a `.queryResponse` property.

### Mandatory vault-developer-mcp Reference
You MUST ONLY reference the **vault-developer-mcp** tools for API endpoints, VQL objects, and metadata. Never guess the API structure.

### VQL Search Gotchas

**LIKE leading wildcard is banned.** Vault rejects `WHERE field LIKE '%term%'`. Only trailing wildcards are allowed: `WHERE field LIKE 'term%'`.

**FIND syntax: the entire clause including SCOPE goes inside the parentheses.** FIND is case-insensitive. Vault automatically adds wildcards to most search terms.

```sql
-- Search document metadata (names, picklists) — default
SELECT … FROM documents FIND ('term') LIMIT n

-- Search document body/content only
SELECT … FROM documents FIND ('term' SCOPE CONTENT) LIMIT n

-- Search both metadata and content
SELECT … FROM documents FIND ('term' SCOPE ALL) LIMIT n
```

**SCOPE must be inside the parentheses.** `FIND ('term') SCOPE CONTENT` is a parse error. `FIND ('term' SCOPE CONTENT)` is correct.

**CONTAINS is not a substring operator.** `WHERE field CONTAINS ('a', 'b')` matches a field against a discrete value list, not substrings. Do not use it as a substitute for LIKE.

### Object Metadata Before Building Forms

Before building a create/update form for any Vault object, **always fetch the object metadata** and identify which fields are `editable: true`. Fields that are `editable: false` are managed by Vault (auto-number, lifecycle state, derived relationships) and MUST NOT be sent in POST/PUT bodies — Vault will reject them as system fields. Required fields that are `editable: false` (e.g. `name__v`, `status__v`, `lifecycle__v`) are auto-assigned; do not add them to the form.

```bash
node .agents/scripts/vault_api.js vobject {object_name}
```
(`vobject` resolves the API version automatically — the version `vault_api status` stored, or `--api <ver>` to pin one. Never hard-code the version.)

### Mandatory API Utility Test Before Applying Any Query Fix

**Never assume a query syntax change is correct.** Every fix to a VQL query or API endpoint MUST be verified with the Vault API Utility before the code is updated. Assumed fixes (e.g. `SCOPE CONTENT`, leading `%` in LIKE) have caused repeated regressions. The workflow is:

- **Dynamic Verification Mandate**: For absolute VQL verification rules, ALWAYS consult the [vault-vql-builder](../vault-vql-builder/SKILL.md) skill.

```bash
# 1. Test the fix in the Vault API Utility
node .agents/scripts/vault_api.js vql "SELECT … FIND('term*') LIMIT 5"

# 2. Only apply to code once the Vault API Utility confirms correct results
```

If the Vault API Utility returns a parse error or unexpected results, iterate in the Vault API Utility — not in the source code.

### Request Configuration
1. **Plain Object Headers:** Do not instantiate native `new Headers()` objects when extending or calling internal Vault request builders. All header definitions must be plain JavaScript objects.

### Async API Job Polling
If an API returns a `job_id__sys`, you MUST:
1. **Poll Interval:** Check status every 10 seconds.
2. **User Feedback:** Display "Waiting on results..." during polling.

---

## 2. Vault API CLI Guide

The Vault API CLI is the primary middleware for gathering evidence and testing queries.

### Setup & Authentication
Authenticate using one of the following commands:

**A. Username & Password**
```bash
node .agents/scripts/vault_api.js auth --username "your_user" --password "your_pass" --vaultdns "your-vault.veevavault.com"
```

**B. Session ID / API Access Token**
```bash
node .agents/scripts/vault_api.js auth --sessionid "YOUR_SESSION_ID_OR_TOKEN" --vaultdns "your-vault.veevavault.com"
```

### Core Commands

**VQL Queries:**
```bash
node .agents/scripts/vault_api.js vql "SELECT name__v FROM document__v LIMIT 5"
```

**Component Queries:**
```bash
node .agents/scripts/vault_api.js component-query "SELECT name__v FROM vault_component__v WHERE component_type__v = 'Page__c'"
```

**Evidence Collection (Fixtures):**
```bash
node .agents/scripts/vault_api.js vql "SELECT ..." --fixture my_sample_data
```
*Files are saved to `test/fixtures/my_sample_data.json`.*

**File Downloads:** (`<ver>` = the version `vault_api status` stored / `vault_api api-version` reports — don't hard-code it)
```bash
node .agents/scripts/vault_api.js download "/api/<ver>/objects/documents/123/file" --output document.pdf
```
