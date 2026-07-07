# Vault Knowledge Sync: Task Completion Checklist

Run this checklist after completing any task to ensure the project's documentation remains the "Source of Truth."

## 1. Documentation Review
- [ ] Foundation: If a new capability was added, is it listed in toolbox-designer-identity.md / <app_name>-identity.md?
- [ ] Architecture: If folder structures or state flows changed, is <app_name>-architecture.md updated?
- [ ] Standards: If naming conventions or styling rules changed, is toolbox-designer-standards.md / <app_name>-standards.md updated?
- [ ] Workflow: If dependencies or lifecycle phases changed, is toolbox-designer-workflow.md updated?

## 2. Knowledge Graph Synchronization
- [ ] Rebuild Graph: Run the generation script with the correct --app flag.
- [ ] Verify Manifest: Check skills.md to ensure new skills are indexed and faceted correctly.
- [ ] Verify Connections: Run search_graph.js for your new components/hooks.

## 3. Summarization
- [ ] Briefly state which documents were updated.
- [ ] Confirm the graph was regenerated based on verified code changes.
