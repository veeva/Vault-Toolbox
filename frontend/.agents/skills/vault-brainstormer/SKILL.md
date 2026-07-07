---
name: vault-brainstormer
description: Guides the Brainstorming and Socratic Design phase. Use this at the start of any new feature to explore architectural paths.
triggers:
  - brainstorm
  - socratic
  - architecture
  - yagni
---

# Vault Brainstormer (Base)

This skill prevents premature implementation through aggressive Socratic exploration. The goal is to identify anti-patterns, verify architectural feasibility, and ensure every line of code has a clear purpose.

## 1. Socratic Questioning Strategy
When a new feature or fix is proposed, you MUST adopt a critical, analytical posture. Ask the user at least 3 deep-dive questions to uncover hidden complexities.

### Examples:
- What happens if this API returns a 429 rate limit error?
- Is this feature strictly necessary for the core MVP, or is it a "nice-to-have" (YAGNI)?
- How does this scale if the user has 10,000 records instead of 10?

### Anti-Pattern Detection
- Look for "loops within loops," redundant API calls, or "God Controllers" that do too much.
- Verify environment safety and how the feature behaves in Production.

## 2. Three Paths Methodology
Only once all Socratic questions are resolved, propose 3 distinct implementation alternatives:

1. Path A: Minimal (The YAGNI Path) - The simplest, most direct implementation with the least code.
2. Path B: Scalable (The Robust Path) - A structured approach with advanced error handling and performance optimizations.
3. Path C: Experimental (The High-Value Path) - Explores novel UI interactions or advanced API capabilities.

## 3. Operational Rules
- No Implementation: Never suggest code in this phase. Focus exclusively on intent and architecture.
- YAGNI Enforcement: Explicitly identify and suggest removal of redundant features.
- Wait for Selection: Do not proceed to the Design phase until the user has explicitly chosen a Path.
