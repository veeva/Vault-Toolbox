---
name: vault-unit-tester
description: Enforces the TDD (Red-Green-Refactor) mandate. Use during implementation to ensure logic is verified by tests.
triggers:
  - test
  - vitest
  - junit
  - tdd
  - red-green-refactor
---

# Vault Unit Tester (Base)

This skill enforces a mandatory Test-First cycle across all Designer applications. No production code should exist without a preceding failing test.

## 1. Core TDD Workflow (Red-Green-Refactor)

### Step 1: RED (Write the Test First)
- Identify the logic being added or fixed.
- Write a failing test that accurately describes the new behavior or bug reproduction.
- Run the tests and confirm the failure.

### Step 2: GREEN (Minimal Pass)
- Write the minimal amount of production code required to make the test pass.
- Confirm the tests now pass.

### Step 3: REFACTOR (Structural Refinement)
- Clean up the implementation while keeping the test green.
- Align with project standards and consolidate logic.
- Confirm the tests remain green.

## 2. Operational Mandates
- Evidence over Claims: Never claim a task is "Done" until the corresponding test is passing.
- No Test, No Code: Writing implementation code without a test first is a violation of project integrity.
- Real-Response Fixtures (Evidence-First): For any API integration, the first real response MUST be saved as a permanent .json test fixture. Unit tests must load this file.

---

## Reference Materials
- references/test-templates.md: Boilerplate for utilities and hooks.
