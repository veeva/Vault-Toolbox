---
name: vault-ui-designer
description: Universal UI philosophy and verification criteria for Vault Designer applications.
triggers:
  - ui
  - layout
  - styling
  - accessibility
---

# Vault UI Designer (Base)

This skill provides the universal UI/UX philosophy and validation standards for all applications within the Vault Designer.

## 1. Universal UI Philosophy

### Accessibility
- Maintain high contrast ratios for text and interactive elements.
- Ensure all controls are keyboard-navigable.
- Use aria-labels where visual labels are absent.

### Performance
- Keep assets lean and avoid heavy external dependencies.
- Minimize layout shifts during data loading.

### Feedback and Loading States
- Every data-fetching operation MUST have a visual loading indicator (spinner or skeleton).
- Success and failure states must be clearly communicated to the user.
- **Never Fail Silently:** All operations MUST provide immediate and explicit visual feedback to the user upon failure (e.g., via prominent toasts, error banners, or alert dialogues). Swallowing or logging errors in `catch` blocks without notifying the user in the UI is strictly forbidden.

### Environment Branding
- Applications must provide visual cues to distinguish between Sandbox and Production environments (e.g., color-coded headers or badges).

## 2. Production Protection
- Modifying controls (buttons, toggles, delete actions) MUST be disabled in Production environments unless specifically authorized.
- Disabled controls MUST display a informative message: "This feature is not available in Production."
