---
name: project-mandates
description: App-specific mandates and technical guardrails for toolbox-browser.
triggers:
  - mandates
  - rules
  - guardrails
---

# App-Specific Mandates: Toolbox Browser

This document defines the custom guidelines, guardrails, and deployment protocols specific to the **toolbox-browser** application. These mandates are active and must be followed.

## 1. Production Protection
The `toolbox-browser` app MUST NOT perform modifying operations against Production: block them and display informative tooltips.

## 2. Platform-Native Styling
- **Rule**: Use platform tokens.
- **Styling**: Implement Chakra UI properties or use `VeevaTheme.ts`.

## 3. Deployment
- Operates directly against a live Vault, so typical package deployment steps are not applicable (`n/a`).

---

### App-Specific Mandates Matrix

| Mandate | `toolbox-browser` |
|---|---|
| Production changes | **Blocked** — Production Protection (guardrail #2) |
| Styling | Platform tokens (Chakra UI / `VeevaTheme.ts`) |
| Deployment | n/a (operates on a live Vault directly) |
