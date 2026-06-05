# The Toolbox Designer Workflow (8 Phases)

Every feature or fix MUST proceed through these 8 phases.

### Skill Loading Protocol
When any phase or command references `Skill: <name>`, you MUST immediately read `.agents/skills/<name>/SKILL.md` and follow ALL instructions in it before proceeding.

1. **Phase 1: Brainstorm (`vault-brainstormer`)**
   - Challenge requirements (Socratic Method).
   - **vault-developer-mcp Mandate:** Use **vault-developer-mcp** tools to verify current Vault limits or API behaviors.
   - Propose 3 Paths (Minimal, Scalable, Experimental).
   - Enforce YAGNI.

2. **Phase 2: Design Approval (`vault-feature-designer`)**
   - Create `<name>_design.md`.
   - **vault-developer-mcp Mandate:** Document the specific API endpoints/VQL objects found via the **vault-developer-mcp** server.
   - **Itemize Definition of Done (DoD).** 
   - DoD MUST include: Menu bar launchability and Settings toggle.
   - Get explicit user approval.

3. **Phase 3: Implementation Plan**
   - Create `<name_implementation.md>`.
   - Define tasks as **"Atomic Logic Units"** (e.g., "Implement the Hook logic", "Build the Header component").
   - Each task must have a specific verification step.

4. **Phase 4: Persistent ToDo**
   - Initialize `.agents/TODO.md`.
   - Track progress turn-by-turn.

5. **Phase 5: TDD (Red-Green-Refactor) (`vault-unit-tester`)**
   - **RED:** Write failing test.
   - **GREEN:** Write minimal code to pass.
   - **REFACTOR:** Clean up and align with standards.

6. **Phase 6: Automated Code Review (`vault-code-reviewer`)**
   - Audit UI (19-point checklist + Menu/Settings check).
   - Audit API (patterns & normalization).
   - Audit Architecture (YAGNI & SDD).

7. **Phase 7: User Testing**
   - Ask: *"Are you ready to test this yourself?"*
   - Execute `npm run build` and `npm run dev`.
   - **Fix all errors** encountered during build/dev startup.
   - Instruct user to check DevTools > Console (F12).

8. **Phase 8: Finalization & Cleanup**
   - **Logging Cleanup Gate:** Ask to remove `console.log` statements.
   - Documentation sync.
   - **Update Knowledge Graph:** Run `npm run graph:gen`.
   - Final review and verification.
