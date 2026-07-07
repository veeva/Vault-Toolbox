# Technical Standards: Toolbox Designer (Base)

## 1. Core Engineering Mandates

### Mandatory vault-developer-mcp First
For ANY Vault API endpoint, VQL object/field, MDL command, or SDK detail  you MUST call the relevant **vault-developer-mcp** tool BEFORE writing any code or making any design decisions. Never use training knowledge as a substitute for live Vault metadata and documentation.

### Mandatory Development Logging
New APIs and complex integration logic MUST include `console.log` statements for debugging during development (Phases 1-7). You MUST instruct the user to monitor **DevTools > Console (F12)** for real-time feedback. All development logs MUST be removable in Phase 8.

### TypeScript Preference
Use **TypeScript (TSX/TS)** for all new files to ensure type safety. Avoid using `any`; define explicit interfaces for all data structures, especially those derived from Vault API responses.

## 2. Shared Naming Conventions
- **Directories:** kebab-case (e.g., `component-editor`).
- **React Components:** PascalCase (e.g., `DataNavigator`).
- **Events:** Prefix with `handle` (internal functions) or `on` (component props).

## 3. Environment & Testing
- **Testing Evolution:** Manual QA is legacy. Vitest/JUnit TDD is the mandatory standard for all new logic. Use the `vault-unit-tester` skill to ensure coverage.
- **Environment Safety:** Operations that modify data MUST include checks (e.g., `isProductionVault()`) to ensure they are not running in a Production environment unless specifically authorized.
