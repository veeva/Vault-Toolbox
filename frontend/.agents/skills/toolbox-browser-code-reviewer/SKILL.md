---
name: toolbox-browser-code-reviewer
description: Specialized audit for the Vault Toolbox Browser Extension, focusing on Island Architecture and UI visibility.
applicable_apps:
  - toolbox-browser
---

# Skill: toolbox-browser-code-reviewer

This skill provides specialized audit criteria for the Vault Toolbox Browser Extension to ensure UI consistency and visibility.

## 1. UI Review (Island Architecture)
Check all new or modified UI components against the Island Architecture standards:
- Pillars: Header Row, Main Island, Status Island, and Right Sidebar (Context Panel).
- Tokens: Correct semantic tokens from VeevaTheme.ts (e.g., white_color_mode).
- Hierarchy: Pages must use the VStack template with inset shadows.
- Accessibility: Tooltips on all icons; high-contrast borders for checkboxes in Dark Mode.
- Split Pane Audit: Any UI utilizing `VerticalResizeHandle` MUST be audited to ensure the parent container is a `<PanelGroup>` and sibling panes are `<Panel>` components from `react-resizable-panels`.
- Local Component Audit: Verify that `InputGroup` usage strictly adheres to the local component signature (`startElement` prop, single `<Input>` child) rather than default Chakra UI patterns.

## 2. Visibility and Integration
- Visibility: Verify the tool is integrated into the application menu bar.
- Settings: Confirm an ON/OFF toggle exists in the Settings page.
- Production Protection: Confirm that modifying controls are disabled in Production with appropriate tooltip messaging.

## 3. API Pattern Compliance
- Auth: Sessions retrieved via cookies (Manifest V3 pattern).
- Normalization: Use of handleErrors normalization and telemetry inclusion.
- Request Builders: All Vault calls must use the vapil request builders.

## 4. React Architecture & Code Quality Audit
- **Pure Helpers:** Verify that any pure helper functions (parsers, math, mapping logic) are extracted into dedicated helper utility files (`.ts` or `.js`). Ensure components/hooks contain only state/lifecycle management and events.
- **Hooks Isolation:** Confirm custom hooks only house React-stateful logic and functions operating on that state, not decoupled static functions.
- **Component Reuse over DOM Selectors:** Explicitly check for direct DOM manipulation (`document.querySelector` or direct ref overrides). Ensure standard components (like the standard file upload button) are reused instead of inventing custom selector-based hacks.
- **Library Constants:** Verify that any third-party library specific strings are defined as UPPER_SNAKE_CASE constants with clear documentation comments linking to the library's official reference page.
- **Hook Dependencies:** Ensure React hook dependency arrays (`useEffect`, `useCallback`, `useMemo`) have brief documentation explaining *why* specific dependencies are included.
