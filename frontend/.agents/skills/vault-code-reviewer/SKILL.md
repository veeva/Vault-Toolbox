---
name: vault-code-reviewer
description: Performs an automated self-audit of code and metadata. Use this at the end of every task to ensure compliance with standards.
triggers:
  - ui-check
  - review
  - audit
  - checklist
---

# Vault Code Reviewer (Base)

This skill acts as an automated self-audit for any new or modified code. It ensures that the project's high standards are met before work is considered complete.

## 1. Operational Review

### Evidence-First Audit
- Verify that any field access marked as "assumed" is identified and flagged for confirmation against real data.
- Check that parsers for external data include logging for unexpected or empty results.
- Confirm that test fixtures are derived from real response payloads, not hand-crafted.

### TDD and Quality
- Confirm that new logic is covered by Vitest (Frontend) or JUnit (Backend) tests.
- Audit for redundant code or over-engineering (YAGNI).
- Verify that development logs are present and ready for removal only in Phase 8.
- **Failures and Catch Blocks:** Audit all catch blocks and async handlers to ensure they do not fail silently. Swallowed errors (logging to console without presenting a visual notification, toast, or alert to the user) are a blocker.
- **Variable & Parameter Naming:** Verify that single-character variable names (e.g., `e`, `i`, `n`...) are NEVER used. Ensure variables are named descriptively to clearly communicate their purpose (e.g., avoid vague names like `layoutedNodes`).

### Express Debt Audit
- For features built via the Express Lane (`:feature-express`), run `node .agents/scripts/express_guard.js <featureDir>` and surface every residual `@express-*` tag and `it.todo` / `describe.skip` stub.
- Any open express debt is a **BLOCKED** result until graduated via `:promote`. (See `vault-express-mode`.)

## 2. Environment Safety
- Verify that operations that modify data include checks (e.g., isProductionVault()) to ensure they are not running in a Production environment unless specifically authorized.

## 3. API Pattern Compliance
- **Status Check Audit:** The automated code review MUST verify that API response handling explicitly checks for `FAILURE` and does not rigidly require `SUCCESS`. This accounts for Vault API returning `WARNING` for valid data retrieval.

## 4. Output: Review Report
At the end of an audit, provide a brief summary:
- PASS: Standards met.
- REFACTOR: Minor deviations from naming or styling standards.
- BLOCKED: Critical violations (e.g., missing tests, framework violations, security risks).
