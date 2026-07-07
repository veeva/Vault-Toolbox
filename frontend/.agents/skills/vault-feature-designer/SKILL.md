---
name: vault-feature-designer
description: Guides the technical design phase (Phase 2). Use this to create comprehensive design documents after brainstorming.
triggers:
  - design
  - architecture
  - dod
  - definition of done
---

# Vault Feature Designer (Base)

This skill enforces a rigorous design-first workflow. No implementation plan or code should be created until the technical design and Definition of Done (DoD) are fully approved by the user.

## 1. Design Document Creation
Create the design document in .agents/features/[feature_name]/ using the template in assets/feature-design-template.md. It MUST contain:

- Feature Name and Goal: Clear summary of the objective.
- User Story: Agile format (As a..., I want..., so that...).
- Affected Architecture: Precise list of files, components, and services.
- Data and API Specifications: Exact VQL queries and API endpoints verified via vault-developer-mcp (all VQL queries must be verified per [vault-vql-builder](../vault-vql-builder/SKILL.md)).
- Definition of Done (DoD): Itemized list of functional and quality criteria.

## 2. Mandatory DoD: User Interaction Paths
For every UI control (filter, search, button), the DoD MUST explicitly enumerate:
- Happy path with all controls active.
- Each control used in isolation.
- Empty state and error state per control.

## 3. Approval Gate
Present the design to the user. You MUST obtain explicit approval of the DoD before proceeding to the Implementation Plan (Phase 3).

## Rules to Follow
- Strict Approval Gate: Never begin Phase 3 until the DoD is approved.
- Surgical Design: Ensure the Affected Architecture is precise to avoid scope creep.
- Refer to Experts: Use vault-ui-designer for layout patterns and vault-api-integration for API protocols.
