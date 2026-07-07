---
name: toolbox-browser-unit-tester
description: Specialized testing requirements for the Vault Toolbox Browser Extension, focusing on Vitest and Chrome context.
applicable_apps:
  - toolbox-browser
---

# Skill: toolbox-browser-unit-tester

This skill provides specialized testing protocols for the Manifest V3 Browser Extension environment.

## 1. Mocking Rules
- Chrome Context: Always mock chrome.cookies and chrome.runtime.
- Storage: Mock global sessionStorage and localStorage.
- Global Providers: Wrap hooks/components in AuthContext or SettingsContext mocks.

## 2. Framework Initialization
If package.json lacks testing dependencies, you MUST propose:
- Installing vitest, @testing-library/react, @testing-library/jest-dom, and jsdom.
- Adding a test script: "test": "vitest run".
