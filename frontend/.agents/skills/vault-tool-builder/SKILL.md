---
name: vault-tool-builder
description: Universal methodology for scaffolding new features using Toolbox Designer.
triggers:
  - scaffold
  - blueprint
  - layout
  - island
---

# Vault Tool Builder (Base)

This skill provides the universal methodology for the initial creation and organization of new feature assets.

## 1. Structural Organization
Before writing business logic or styling, you MUST establish the structural foundation of the feature:
- Define the directory structure within the appropriate domain.
- Create the core entry point (Page) and main functional component (Island).
- Initialize the state management hook.

## 2. Methodology
- Separation of Concerns: Separate presentation (components) from logic (hooks) and data (services).
- Design Alignment: Ensure the initial scaffold matches the approved Design Document and Definition of Done.
- Incremental Wiring: Wire the feature into the application shell as the first step to ensure launchability.
