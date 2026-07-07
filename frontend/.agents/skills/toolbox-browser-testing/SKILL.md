---
name: toolbox-browser-testing
description: Specialized testing and dev-server protocol for the Vault Toolbox Browser Extension.
applicable_apps:
  - toolbox-browser
---

# Skill: toolbox-browser-testing

This skill defines the mandatory testing and local verification steps for the Vault Toolbox Browser Extension.

## Phase 7: User Testing Protocol

1. **Request Permission:** Ask the user: "Are you ready to test this yourself?"
2. **Prepare Environment:** 
   - Execute `npm run build` to generate the `dist/` folder.
   - Execute `npm run dev` to start the watcher.
3. **Load Extension:** Instruct the user to refresh the "Unpacked Extension" in `chrome://extensions/`.
4. **Fix Issues:** You MUST fix any errors encountered during the build or development server startup.
5. **Verify:** Exercise all logic paths and monitor the console.

## Phase 8: Finalization
- **Update Knowledge Graph:** Run `npm run graph:gen`.
