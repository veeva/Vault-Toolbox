---
name: vault-knowledge-sync
description: Synchronizes project documentation, the codebase knowledge graph, and the skills manifest. Use after implementing features or refactoring.
triggers:
  - sync
  - documentation
  - graph
  - repo_map
---

# Vault Knowledge Sync (Base)

This skill ensures that the project's "Source of Truth" documents and the automated knowledge graph accurately reflect the current state of the codebase.

## 1. Documentation Update
When project architecture, standards, or workflows change:
- Update foundational files in .agents/ (toolbox-designer-identity.md, toolbox-designer-workflow.md, toolbox-designer-standards.md).
- Update app-specific foundational files in .agents/ (<app_name>-architecture.md, <app_name>-standards.md).
- Ensure new feature design or implementation documents are archived in .agents/features/.

## 2. Graph and Repo Map Synchronization (MANDATORY)
The knowledge graph is the backbone of autonomous navigation. Rebuild it after any significant code or metadata change:
- Rebuild Command: Run the app-specific generation command (e.g., `node .agents/scripts/generate_graph.js`).
- Verify Output:
  - Check codebase_graph.json for new file nodes and relationships.
  - Inspect repo_map.md to ensure high-rank components are correctly identified.

## 3. Skills Manifest Synchronization
The skills manifest (skills.md) is automatically generated from SKILL.md frontmatter:
- Validation: Ensure all SKILL.md files have valid YAML frontmatter including name, description, and applicable_apps.
- Discovery: The manifest facets skills by application for efficient AI discovery.

## 4. Finalization Guard (Express Mode)
Before a feature may be marked **finalized** (Phase 8), the Express merge guard MUST pass:
- Run `node .agents/scripts/express_guard.js <featureDir>`.
- A non-zero exit (any residual `@express-*` tag or `it.todo` / `describe.skip` stub) **hard-blocks** finalization. Graduate the feature via `:promote` first.
- This gate is mandatory because express code is not physically isolated; the guard is what prevents deferred-rigor code from shipping un-backfilled. (See `vault-express-mode`.)

## 5. Knowledge Verification
Use the search script to verify the graph's understanding of new symbols:
- Search Command: node .agents/scripts/search_graph.js <SymbolName>
- Confirm both Inbound (usage) and Outbound (dependency) relationships.

---

## Reference Materials
- references/sync-checklist.md: Task completion checklist.
