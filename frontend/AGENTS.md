# Agent Guidelines: Vault Toolbox Designer Mandate

This document defines the high-rigor, test-driven development lifecycle for the **Vault Toolbox Designer**. The Toolbox Designer is a core feature of the project, encompassing the AI agent instructions, configuration, and specialized development workflows. All designer-related information, paths, and versioning are stored in `.agents/toolbox-designer.json`. These mandates are absolute and take precedence over all general defaults.

## The Toolbox Designer Lifecycle
Every feature or bug fix MUST proceed through these 8 distinct phases. Skipping a phase is a violation of the project integrity.

### Phase 1: Brainstorm (Socratic Design)
Before any design is finalized, you MUST:
- **Challenge the "What":** Use the Socratic method to refine the user's request.
- **Explore Alternatives:** Propose at least 3 implementation paths (e.g., "Minimal", "Scalable", "Experimental").
- **YAGNI Enforcement:** Explicitly identify and remove "just-in-case" features.
- **Skill:** `vault-brainstormer`

### Phase 2: Design Approval
Finalize the technical design in `.agents/features/<name>_design.md`.
- **Definition of Done (DoD):** MUST be itemized and approved by the user. 
- **Mandatory DoD Items:** 
    1. Tool MUST be launchable from the application menu bar.
    2. Tool MUST have an ON/OFF toggle in the Settings page.
- **Skill:** `vault-feature-designer`

### Phase 3: Implementation Plan
Create `.agents/features/<name>_implementation.md`.
- Break the work into **"Atomic Logic Units"** (e.g., "Implement the Hook logic", "Build the Header component").
- Each task MUST specify: File path, Logic, and Verification (Test) step.

### Phase 4: Persistent ToDo
Initialize `.agents/TODO.md` based on the Implementation Plan.
- This is the "Source of Truth" for session progress.
- Update it (`[x]`) after EVERY task completion.

### Phase 5: TDD (Red-Green-Refactor)
Enforce the "Test-First" rule.
1. **RED:** Write a failing test in Vitest (`.test.ts/tsx`) that describes the new behavior.
2. **GREEN:** Write the *minimal* code to pass that test.
3. **REFACTOR:** Align the code with Island Architecture and API patterns.
- **Skill:** `vault-unit-tester`

### Phase 6: Automated Code Review
Before marking a task as "Done," perform a self-audit:
- **UI Audit:** Check against the 19-point Island Architecture Checklist (Nested Pillar Layout).
- **API Audit:** Check against `ApiService` patterns and error handling.
- **New Checks:** Verify menu bar integration and Settings toggle presence.
- **Skill:** `vault-code-reviewer`

### Phase 7: User Testing
Before finalization, the user MUST verify the implementation in a live environment.
1. **Request Permission:** Ask the user: *"Are you ready to test this yourself?"*
2. **Prepare Environment:** If yes, execute `npm run build` and `npm run dev`. 
3. **Fix Issues:** You MUST fix any errors encountered during the build or development server startup.
4. **Instruct User:** Remind the user to check **DevTools > Console (F12)** if behavior is unexpected, as development logging is mandatory during this phase.

### Phase 8: Finalization & Cleanup
Final verification and cleanup.
1. **Logging Cleanup:** Ask the user: *"Should development logging be removed now?"* If yes, remove `console.log` statements and have the user perform one final test.
2. **Sync Docs:** Run `vault-knowledge-sync`.
3. **Update Knowledge Graph & Repo Map:** Run `npm run graph:gen` to rebuild the JSON graph (`.agents/ai_agent_instructions/codebase_graph.json`) and the PageRank-powered repo map (`.agents/ai_agent_instructions/repo_map.md`).
4. **Verification:** Prepare a descriptive commit message and propose the changes for final review.

---

## 🛠️ Operational & Behavioral Mandates
These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Behavioral Pillars
- **Think Before Coding:** Don't assume. Don't hide confusion. Surface tradeoffs. State assumptions explicitly before implementing. If multiple interpretations exist, present them—don't pick silently. If something is unclear, STOP and ask.
- **Simplicity First:** Minimum code that solves the problem. Nothing speculative. No features beyond what was asked. No abstractions for single-use code. If you write 200 lines and it could be 50, rewrite it.
- **Surgical Changes:** Touch only what you must. Match existing style. Don't "improve" adjacent code. Remove orphans YOUR changes created, but don't touch pre-existing dead code unless asked. Every changed line must trace to the request.
- **Goal-Driven Execution:** Transform tasks into verifiable goals (e.g., "Fix bug" → "Write reproduction test, then make it pass"). Define strong success criteria to allow independent looping.

### 2. Technical Guardrails
1.  **Evidence over Claims:** Never claim a task is complete without a passing Vitest test or empirical verification.
2.  **Production Protection Mandate:** By default, features MUST NOT allow changes (Create, Update, Delete, Cancel, Remove) in Production environments. 
    - **Check:** Always use `isProductionVault()` from `SharedServices.ts` to detect the environment.
    - **Scope:** Read-only (Retrieve) operations are permitted in Production. Modifying operations MUST be blocked.
    - **UI Enforcement:** Buttons or controls for modifying operations MUST be disabled in Production.
    - **User Feedback:** Disabled controls MUST display a hover message or tooltip: *"This feature is not available in Production."*
3.  **Context Efficiency:** Use the **PageRank Repo Map** (`.agents/ai_agent_instructions/repo_map.md`) for autonomous codebase navigation. Use specialized sub-agents (`codebase_investigator`, `generalist`) for research and batch tasks to keep the main session history lean.
4.  **Mandatory vault-developer-mcp First:** For ANY Vault API endpoint, VQL object/field, MDL command, or SDK detail — call the relevant **vault-developer-mcp** tool BEFORE writing any code or making any design decisions. Never use training knowledge as a substitute. Applies regardless of which phase or skill is active.
5.  **No Manual CSS:** Always use Chakra UI v3 style props and semantic tokens from `VeevaTheme.ts`.
6.  **Testing Evolution:** All new features and bug fixes MUST include Vitest suites. This is a non-negotiable standard.
7.  **Mandatory Logging:** New APIs MUST include development logging until Phase 8. Instruct users to monitor the browser console for insights.

### 3. Output Formatting & Copy-Paste Hygiene
Any text the user is expected to copy verbatim — commands, prompts, VQL queries, JSON payloads, sample responses, endpoint strings, file paths to type in a shell, etc. — MUST be rendered inside its own **fenced code block** (triple backticks), with a language tag when applicable (`sql`, `json`, `http`, `bash`).

- **NEVER** wrap copy-paste content in a blockquote (`> ...`). Terminal renderers such as the Claude Code CLI inject a vertical bar (`▎`) into each blockquote line; that bar is captured when the user highlight-copies, breaking the copied text.
- **NEVER** wrap copy-paste content in inline code (single backticks) when the content is multi-line or longer than a short phrase — it wraps unpredictably and can introduce stray characters.
- **NEVER** surround copy-paste content with quotation marks, parentheses, or other framing characters that would also be copied.
- **DO** place each distinct copy-paste payload in its own fenced block. If multiple payloads are presented together (e.g., endpoint + payload + sample response), give each its own fence.
- Explanatory framing — callouts, "Tutor Notes", section labels, prose — MAY still use blockquotes. The rule applies only to content the user must copy.

This mandate applies to **all agents** (Claude, Gemini, Codex, etc.) operating in this project and to **every skill** under `.agents/skills/`. New or updated skills MUST follow it; reviewers MUST flag violations.

## 🔌 Skill Loading Protocol
Whenever I start working in this project, I MUST:
1.  **Read the Manifest:** Read `.agents/ai_agent_instructions/skills.md` to identify available procedural knowledge.
2.  **On-Demand Loading:** You MUST NOT load all files in `.agents/skills/` upfront. Only load a specific `SKILL.md` when the user's request semantically matches the description or triggers in the manifest.

The following skills are **globally active** and MUST be read at every `:onboard`:
- `.agents/skills/vault-api-integration/SKILL.md` — API patterns + MCP mandate
- `.agents/skills/vault-ui-designer/SKILL.md` — Layout tokens + UI checklist

## ⌨️ Specialized Commands
*   **`:tutorial`**: Start an interactive, guided walkthrough of the Toolbox Designer lifecycle with an example feature.
*   **`:onboard`**: Re-run the onboarding sequence and knowledge graph update.
*   **`:feature <name>`**: Start a new feature lifecycle.
*   **`:fix <issue>`**: Reproduce and fix a bug.
*   **`:docs`**: Refresh AI context from instruction files.
*   **`:graph`**: Manually update the codebase knowledge graph.
*   **`:ui-check`**: Audit a feature against the 19-point UI Checklist.
*   **`:transplant <path>`**: Surgically port a feature from a fork or directory.
*   **`:speakmode <mode> <on/off>`**: Toggle token-efficient communication (available: `rocky`, `eridani`, `signal`, `caveman`).
*   **Skill:** `vault-speak-modes`

## 6. Onboarding Protocol
Whenever I start working in this project, I MUST:
1.  **Confirm Documentation:** After reading it, state that I have read `.agents/ai_agent_instructions/` and `AGENTS.md` as well as any other AI Model specific files (e.g. GEMINI.md, CLAUDE.md, etc).
2.  **Update Knowledge Graph & Repo Map:** Run `npm run graph:gen`.
3.  **Verify Context:** Confirm visibility of `.agents/ai_agent_instructions/repo_map.md` and verify that `.agents/ai_agent_instructions/codebase_graph.json` is gitignored.
4.  **Load Global Skills:** Read and confirm:
    - `.agents/skills/vault-api-integration/SKILL.md`
    - `.agents/skills/vault-ui-designer/SKILL.md`
    Display the 10-point UI checklist from `vault-ui-designer` as confirmation of load.
5.  **Test MCP Server:** List the available tools for the `vault-developer-mcp` MCP Server. Explicitly state that the `vault-developer-mcp` MCP Server is **CONNECTED** upon a successful test. (No query required for testing).
6.  **Offer Action Entry Points:** Present the consolidated commands list, highlighting **`:tutorial`** for new users.

---
**Available Actions:** `:onboard` | `:help` | `:feature` | `:fix` | `:refactor` | `:test` | `:docs` | `:graph` | `:ui-check` | `:transplant` | `:speakmode` | `:update_reqs` | `:tutorial`

