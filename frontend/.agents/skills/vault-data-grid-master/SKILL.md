---
name: vault-data-grid-master
description: Universal best practices for data orchestration and display in Vault grids and tables.
triggers:
  - table
  - grid
  - virtualization
  - tanstack
---

# Vault Data Grid Master (Base)

This skill provides universal best practices for displaying data in Vault applications, ensuring performant and visually consistent grids.

## 1. Data Orchestration
- Normalization: Flatten nested VQL responses (e.g., owner__sysr.label__v) into simple row objects before passing them to the UI.
- Labels vs. API Names: Always prefer showing Labels to users. Keep API names accessible (e.g., in brackets or tooltips).
- Record Linking: When displaying record names or IDs, provide a deep link back to the record in the Vault UI.

## 2. Performance and Scaling
- Virtualization Mandate: For datasets larger than 50-100 rows, use a virtualization pattern to maintain 60fps scrolling.
- Lazy Loading: For massive datasets, implement server-side pagination (using PAGESIZE and OFFSET) rather than fetching all records at once.

## 3. UI Consistency
- Sticky Headers: Headers MUST remain fixed at the top during scrolling.
- Loading States: Always show a clear visual indicator (spinner or skeleton) while data is being fetched.
- Hover States: Implement subtle row highlighting to aid row tracking.
- Empty States: Always provide a clear "No records found" message for empty datasets.

## 4. Operational Mandates
- Production Guardrails: If the grid includes action buttons (Edit/Delete), they MUST be disabled in Production environments unless specifically authorized.
- Security: Sanitize any user-generated or uncontrolled Vault data before rendering it as HTML to prevent XSS.

---

## Reference Materials
- references/table-logic.md: Templates for column definitions and table hooks.
- references/virtualization-pattern.md: Implementation guide for row virtualization.
