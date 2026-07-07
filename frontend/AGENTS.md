# Agent Guidelines: Vault Designer Mandate

This document defines the high-rigor, test-driven development lifecycle for the Vault Designer. These mandates are absolute and take precedence over all general defaults.

## 1. The Toolbox Designer Lifecycle
Every feature or fix MUST proceed through these 8 distinct phases. Skipping a phase is a violation of project integrity.

- Phase 1: Brainstorm (Socratic Design) - Challenge the "What" and explore 3 paths. (Skill: vault-brainstormer)
- Phase 2: Design Approval - Finalize technical design and itemized DoD. (Skill: vault-feature-designer)
- Phase 3: Implementation Plan - Create Atomic Logic Units (ALUs) with verification steps.
- Phase 4: Persistent ToDo - Maintain progress in .agents/TODO.md.
- Phase 5: TDD (Red-Green-Refactor) - Enforce the "Test-First" rule. (Skill: vault-unit-tester)
- Phase 6: Automated Code Review - Self-audit against project standards. (Skill: vault-code-reviewer)
- Phase 7: User Testing - Manual verification in a live environment. For `custom-pages`, deploy the validated VPK (or a dev-sandbox fast path) to a live Vault via `veeva-vault-deployer` (auth-gated through `vault_api`).
- Phase 8: Finalization and Cleanup - Remove logs, sync docs, and update the graph. (Skill: vault-knowledge-sync)

**Express Lane (gated exception):** `:feature-express` runs a *deferred-rigor* fast lane that drops the heavy phases (2, 3, 5, 6) for fast prototyping while keeping all Hard Rails (logging, Evidence-First, and the project mandates per §4 — see the project-mandates.md skill). This is NOT an exemption: the deferred phases become tracked debt that MUST be backfilled via `:promote` before finalization, enforced by a hard merge guard. (Skill: vault-express-mode)

## 2. Behavioral Pillars
- Think Before Coding: Don't assume. Surface tradeoffs. State assumptions explicitly.
- Simplicity First: Minimum code that solves the problem. No abstractions for single-use code.
- Surgical Changes: Touch only what you must. Match existing style.
- Goal-Driven Execution: Transform tasks into verifiable goals.

## 3. Technical Guardrails
1. Evidence over Claims: Never claim a task is complete without a passing test or empirical verification.
2. Context Efficiency: Use the PageRank Repo Map and filtered Skill Manifest. Use specialized sub-agents for batch tasks.
3. Mandatory MCP First: Always call vault-developer-mcp for live metadata and documentation. Vault API and VQL syntax MUST be verified by reading the MCP response directly — never rely on a recalled, inferred, or paraphrased answer.
4. Testing Evolution: All new logic MUST include Vitest or JUnit suites.
5. Mandatory Logging: New APIs MUST include console.log statements until Phase 8.

## 4. Project Mandates
There are critical project mandates that you MUST follow. These are specific to the current project you are running in.
- **Where to find them**: Read the `project-mandates.md` skill located under `.agents/skills/project-mandates/project-mandates.md`.
- **Onboarding Protocol**: Always read this file as part of your onboarding protocol.

## 5. Output Formatting and Copy-Paste Hygiene
Any text the user is expected to copy verbatim MUST be rendered inside its own fenced code block (triple backticks) with a language tag when applicable.
- NEVER wrap copy-paste content in a blockquote or inline code.
- NEVER surround copy-paste content with quotation marks or parentheses.
- DO place each distinct payload in its own fenced block.

## 6. Skill Loading Protocol
1. Read the Manifest: Read .agents/meta/skills.md to identify available procedural knowledge.
2. On-Demand Loading: Only load a specific skill when the request matches its triggers.
3. Global Skills: The following are always active: vault-api-integration, vault-ui-designer, project-mandates.

## 7. Onboarding Protocol
Whenever I start working in this project, I MUST:
1. Confirm Documentation: State that I have read .agents/ and AGENTS.md.
2. Test MCP Server: Explicitly state that `vault-developer-mcp` is CONNECTED.
3. Verify Vault API Utility: 
    - Ask the user: "Would you like use the Vault API Utility to connect to a Vault for live metadata and query verification?"
    - If NO, proceed to Step 4.
    - If YES, run `node .agents/scripts/vault_api.js status`.
      - If the output is `Connection: SUCCESS`, proceed. (`status` also identifies and stores the Vault's latest API version in `vault_env.json`, so later commands need no version hard-coded — pass `--api <ver>` only to pin a specific one. Never hard-code the API version anywhere; it changes across releases. Confirm the current/GA version with the MCP and the user when it matters.)
      - If `NOT_CONFIGURED` or `FAILED`, prompt for the preferred authentication method (`Username and Password` or `Session ID / API Access Token`) and the required credentials (DNS, etc.).
      - Execute the exact authentication command based on the user's choice:
        - **Session ID / API Access Token:** `node .agents/scripts/vault_api.js auth --sessionid <token_or_session_id> --vaultdns <dns>`
        - **Username/Password:** `node .agents/scripts/vault_api.js auth --username <user> --password <pass> --vaultdns <dns>`
4. Regenerate Knowledge Base: Run `node .agents/scripts/generate_graph.js` to regenerate `codebase_graph.json`, `repo_map.md`, and `skills.md`.
5. Load Global Skills: Confirm load of global skills (vault-api-integration, vault-ui-designer, and project-mandates which contains your active project mandates).
6. Provide Onboarding Summary: Recapitulate the session context, app, connection status, and **ALWAYS display all Specialized Commands in a formatted Markdown table including their parameters and descriptions**.

## 8. Specialized Commands

| Command | Parameter(s) | Description | Active Skill / Guidance |
| :--- | :--- | :--- | :--- |
| **`:onboard`** | *None* | Re-run the onboarding sequence and knowledge graph update. | *Onboarding Protocol* |
| **`:tutorial`** | *None* | Start an interactive, guided walkthrough of the Toolbox Designer lifecycle with an example feature using the app-specific tutor skill. | `vault-tutor` |
| **`:feature`** | `<name>` | Start a new feature lifecycle with full rigor (Phases 1-8). | `vault-feature-designer` |
| **`:feature-express`** | `<name>` | Start a feature in the Express Lane (deferred-rigor fast prototyping). | `vault-express-mode` |
| **`:promote`** | `<name>` | Graduate an express feature back to full rigor (interview-driven design doc, backfilled tests, killed fakes, code review, finalization). | `vault-express-mode` |
| **`:fix`** | `<issue>` | Reproduce and fix a bug using the standard lifecycle. | *Standard Lifecycle* |
| **`:transplant`** | `<path>` | Surgically port a feature from a fork or directory. | `vault-feature-transplant` |
| **`:speakmode`** | `<mode> <on/off>` | Toggle token-efficient communication (`rocky`, `eridani`, `signal`, `caveman`). | `vault-speak-modes` |

---
**Available Actions:** `:onboard` | `:feature` | `:feature-express` | `:promote` | `:fix` | `:transplant` | `:speakmode` | `:tutorial`
