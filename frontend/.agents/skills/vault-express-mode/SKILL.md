---
name: vault-express-mode
description: Fast-prototyping lane that defers (never skips) the heavy lifecycle phases, preserving the safety rails, with a gated graduation path back to full rigor.
triggers:
  - express
  - prototype
  - spike
  - promote
  - feature-express
---

# Vault Express Mode (Base)

Express mode is a **deferred-rigor** fast lane for the Toolbox Designer. It drops
the *expensive ceremony* of the 8-phase lifecycle (formal design doc, ALU plan,
test-first TDD, automated review) so an idea can be validated quickly — but every
deferred phase is recorded as **debt** and MUST be backfilled before the code is
finalized. Express is *deferred* rigor, not *skipped* rigor.

## 1. Hard Rails (NEVER sacrificed in express mode)
These are cheap and high-value, so they always apply:
1. **Production Protection** — modifying Vault operations stay blocked in Production with the standard tooltip.
2. **Mandatory logging** — raw-dump `console.log` on every new integration (powers manual verification).
3. **Platform-native styling** — Chakra UI / VeevaTheme tokens.
4. **Evidence-First** — any new VQL/endpoint is verified via `vault-developer-mcp` (and CLI if connected) **before** code. Counterintuitively this *speeds up* prototyping by preventing rework on wrong syntax/field names. (See the [vault-vql-builder](../vault-vql-builder/SKILL.md) skill for the VQL dynamic verification protocol). Unverified claims are tagged `@express-assumption` and re-checked at graduation.

## 2. The Express Lane — `:feature-express <name>`
A 3-step fast path (replaces phases 1–6 of the standard lifecycle):
1. **Intent & Comprehensive Alignment** — One-line statement of what you're spiking. Create `.agents/features/<name>/` if absent. **Before writing any code, you MUST engage in an exhaustive up-front brainstorming phase. Ask as many questions as needed about anything (visual format, UX, data-tracing scope, layout, workflows, expected inputs/outputs, edge cases, etc.) to align perfectly on the feature direction. Do not limit the questions. We save time in Express Mode by deferring code/build ceremonies (formal documents, test-first TDD, etc.), NOT by rushing the alignment or skipping design clarity.**
2. **Build** — implement directly, with the Hard Rails above. Drop `@express-*` breadcrumb tags and `it.todo()` / `describe.skip()` test stubs inline as you go (see `references/breadcrumb-spec.md`).
3. **Manual verify** — run it live in the extension. Observed behavior is the verification gate that temporarily replaces TDD.

## 3. Graduation — `:promote <name>` (interview-driven)
Re-enters the full lifecycle, backfilling every deferred phase from the breadcrumbs:
1. **Collect** — run `node .agents/scripts/express_guard.js .agents/features/<name>` (or the feature's source dir) to auto-assemble the debt ledger from `@express-*` tags + stubs.
2. **Interrogate assumptions** — for each `@express-assumption`, run the live MCP/CLI check now; confirm or correct (the Evidence gate finally *applied*).
3. **Kill fakes** — replace each `@express-fake` with the real implementation.
4. **Red-Green** — convert each `it.todo` / `describe.skip` into a real failing→passing test (proper Phase 5).
5. **Interview → Doc** — ask the developer targeted questions per `@express-intent` breadcrumb and write the design doc from their answers (proper Phase 2). Built forward from intent, **never reverse-engineered from code**.
6. **Review + sync** — automated code review (Phase 6) + finalization (Phase 8): strip raw-dump logs, run the merge guard, regenerate the graph.

## 4. Comment Disposition at Graduation
- **Durable comments** (the *why* / rationale) → promote to permanent docstrings (drop the `@express-` prefix).
- **Scaffold comments** (`@express-*` tags, raw-dump logs) → MUST be cleared (Phase 8 "remove logs" mandate) or the merge guard fails.

## 5. Merge Guard (HARD BLOCK)
A feature CANNOT be marked finalized while any `@express-*` tag or `it.todo` /
`describe.skip` stub remains. This is enforced by `express_guard.js`, which exits
non-zero when debt remains. Because express code is **not** physically isolated,
this self-policing gate is the safeguard that keeps untested code from shipping.
See `vault-knowledge-sync` (Finalization Guard) and `vault-code-reviewer`.

---

## Reference Materials
- `references/breadcrumb-spec.md`: the `@express-*` tag convention + examples.
