---
name: toolbox-browser-ui-designer
description: UI standards for the Vault Toolbox Browser Extension focusing on Chakra UI and the Nested Pillar layout.
applicable_apps:
  - toolbox-browser
---

# Skill: toolbox-browser-ui-designer

This skill defines the architectural patterns and styling standards for the Vault Toolbox Browser Extension.

## 1. The Nested Pillar Layout
The application uses a Nested Pillar approach to separate the main workspace from contextual tools.

### Outer Layout (Horizontal Split)
1. Pillar A (Workspace): A VStack with flex: 1 and minWidth: 0.
2. Pillar B (Right Sidebar): A Box with flex: 0 0 auto housing contextual actions.

### Inner Layout (Vertical Workspace Stack - Pillar A)
1. Header Row: Outside the main island container. Margin-left: 25px.
2. Main Island: White background, borderRadius: 8px, shadow 0 0 5px rgba(0,0,0,0.25). Width: calc(100% - 200px). Margins: 0px 10px 5px 10px.
3. Status Island: Fixed-height (42px) bottom bar.

## 2. Chakra UI and Semantic Tokens
- No Raw CSS: Always use Chakra UI v3 style props.
- Mandatory Token Usage: Use semantic tokens from src/app/utils/shared/VeevaTheme.ts (e.g., white_color_mode, veeva_orange_color_mode).
- Depth: Pillar A MUST use the StackStyle with inset shadows for visual depth.

## 3. Component Reuse & React Integrity
- **Pattern Reuse over Invention:** Do not invent new, ad-hoc UI implementations or custom DOM manipulation tricks. Reuse existing components and patterns (e.g., the standard file upload button/component from the file staging tool) to ensure UI and UX consistency across the extension.
- **Declarative React Integrity:** NEVER break out of React by using raw DOM selectors (`document.querySelector`, custom ref mutations to bypass state, etc.) unless specifically approved or required by low-level Chrome Extension APIs. Manage UI elements declaratively through React state and props.

## 4. UI Checklist (Toolbox Browser)
1. Nested Pillars present.
2. Stack Elevation (inset shadows).
3. Horizontal Alignment (Header/Island widths match).
4. Contextual Help: Button located at bottom of Pillar B.
5. Standard Tab Sizing: 60px height, xl text, 180px trigger width.
