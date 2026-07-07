---
name: vault-feature-transplant
description: Guidance for surgically transplanting features from a fork into the main project.
triggers:
  - transplant
  - port
  - fork
  - adoption
applicable_apps:
  - toolbox-browser
---

# Skill: vault-feature-transplant

This skill enforces a rigorous "Surgical Transplant" protocol to ensure features from forks or branches are integrated without breaking the baseline.

## 0. The Source Inquiry (Pre-Flight)
If the user asks to transplant a feature but does not provide a source path, you MUST ask:
1. "Where is the source for this transplant? (Local folder, remote repo, or branch?)"
2. List available branches if in the current repo using `git branch`.

## 1. Discovery Protocol (Feature Verification)
Before starting, map the source to ensure all dependencies are captured.

### Step 1: Feature Verification
- Do Not Assume: Existence of design docs does not mean the feature was built.
- Proof of Life: Verify existence of actual code (e.g., Page component or Island).
- Provide Summary: Present a list of verified features in the source.

### Step 2: Architecture Mapping
1. Locate Repo Map: Use repo_map.md to understand the fork's architecture.
2. Search the Graph: Use search_graph.js to identify related components and hooks.
3. Identify Core Pillars: Identify Entry Point, Logic Hook, UI Components, and Service Layer.

## 2. Transplant Protocol

### Step 1: Mapping
Create a destination map. Standard locations:
- src/app/pages/
- src/app/hooks/<feature_name>/
- src/app/components/<feature_name>/
- src/app/services/vapil/

### Step 2: Surgical Copy
- Create directories in destination first.
- Copy files precisely; maintain extensions.
- Update imports to match destination structure.

### Step 3: Nerve Ending Integration
Update global files:
1. Routing (src/app/App.jsx): Register the Route.
2. Context (src/app/App.jsx): Wrap with new Providers if needed.
3. Navigation (SidebarItems.ts): Add sidebar icon and route.
4. Settings (VaultToolboxSettings.ts): Add toggle and metadata.
5. API Facade (ApiService.js): Export new VAPIL wrappers.

### Step 4: Dependency Resolution
- Check for missing NPM packages in package.json.
- Run npm run build to check for import errors.

## 3. Verification
- Build: npm run build must pass.
- Red Baseline: Run npm test to ensure no regressions.
