---
name: toolbox-browser-brainstormer
description: Specialized design challenges for the Vault Toolbox Browser Extension, focusing on VQL prototyping.
applicable_apps:
  - toolbox-browser
---

# Skill: toolbox-browser-brainstormer

This skill provides specialized validation rules for the Vault Toolbox Browser Extension.

## 1. VQL Query Prototyping (MANDATORY)
VQL queries must be exact. You MUST strictly request the user to provide the VQL Query to be used.
- If you (the agent) suggest a query, ask the user to prototype it in the Vault Toolbox's VQL Editor first.
- Ask the user to provide the exact query string and a sample JSON response that confirms it returns the desired data.
- For detailed VQL syntax rules and the Dynamic Verification Protocol, refer to the [vault-vql-builder](../vault-vql-builder/SKILL.md) skill.

## 2. Island Architecture Validation
- Challenge any request that violates the Nested Pillar layout or Island Architecture.
- Ensure tool visibility is planned (Menu bar launchability and Settings toggle).
