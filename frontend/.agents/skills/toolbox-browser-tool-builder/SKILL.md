---
name: toolbox-browser-tool-builder
description: Specialized scaffolding and shell integration for the Vault Toolbox Browser Extension.
applicable_apps:
  - toolbox-browser
---

# Skill: toolbox-browser-tool-builder

This skill provides the specialized wiring guide for integrating features into the Vault Toolbox Extension shell.

## 1. End-to-End Tool Wiring
Follow these 4 steps to integrate a new feature:

1. Register Route (App.jsx): Add the page to the main router within the Layout component.
2. Navigation Sidebar (SidebarItems.ts): Add an entry with an appropriate PiIcon and pageId.
3. Register in Settings (VaultToolboxSettings.ts):
   - Add to defaultSettings (enabled: true).
   - Add to PageSettingsMetadata (Label and InfoText).
4. Layout Verification: Ensure the Nested Pillar consistency (Header, Island, Status, Context Panel).

## 2. Implementation Rules
- Shared Components: Always use VirtualizedTable, CodeEditor, and CustomSelect from src/app/components/shared/.
- Snippet Enforcement: Import standard UI components from .../shared/ui-components/ ONLY.
- Background Messaging: For cross-origin or persistent tasks, use chrome.runtime.sendMessage to communicate with background.js.
