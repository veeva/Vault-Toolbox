---
name: toolbox-browser-data-grid
description: Specialized data grid implementation for the Vault Toolbox Browser Extension using TanStack Table/Virtual.
applicable_apps:
  - toolbox-browser
---

# Skill: toolbox-browser-data-grid

This skill provides specialized implementation rules for the Vault Toolbox Browser Extension using TanStack libraries.

## 1. TanStack Implementation Patterns
- Table Hook: Use the useFeatureTable pattern for standardizing sorting and filtering logic.
- Virtualization: Use the TanStack Virtual prefix/suffix padding row pattern to preserve sticky header behavior.

## 2. Styling with Chakra UI
- Environment Awareness: Headers must change color based on environment:
    - Sandbox: veeva_sandbox_green.500
    - Production: veeva_midnight_indigo.500
- Semantic Tokens: Use white_color_mode for island backgrounds and beige_color_mode for hover states.

## 3. Shared Component Priority
- Always check if src/app/components/shared/VirtualizedTable.jsx can meet the requirements before building a custom grid.
