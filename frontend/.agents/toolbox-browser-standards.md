# Technical Standards: Vault Toolbox Browser Extension

## 1. Code & Naming Conventions
- **Custom Hooks:** camelCase with `use` prefix (e.g., `useVqlQuery.ts`).
- **Services & Utils:** PascalCase for major domains (`ApiService.ts`), camelCase for small utilities.
- **Constants:** UPPER_SNAKE_CASE (e.g., `VAULT_API_VERSION`).
- **Variable Naming:** Never use single-character variable names (e.g., `e`, `i`, `n`...) under any circumstances. Name all variables descriptively to clearly communicate their purpose (e.g., use `orderedTreeNodes` instead of ambiguous names like `layoutedNodes`).
- **Library Constants:** If third-party libraries require specific string values (e.g., `'TB'` for layout direction), wrap them in descriptive CONST variables in UPPER_SNAKE_CASE, and include a comment linking directly to the official documentation so developers do not have to search for valid options.

## 2. Styling & Layout Standards
- **Chakra UI v3 ONLY:** Never write raw CSS or use Tailwind for the browser extension. 
- **Semantic Tokens:** Never use hardcoded hex values. Always check `src/app/utils/shared/VeevaTheme.ts` for semantic tokens (e.g., `white_color_mode`).
- **Island Architecture:** Adhere to the **Nested Pillar layout** (Outer Horizontal + Inner Vertical).
- **Tool Visibility:** All new tools MUST be accessible via the application menu bar and have an ON/OFF toggle in the Settings page.

## 3. React Architecture & Hook Standards
- **Pure Helper Functions:** MUST go in dedicated utility files (`.ts` or `.js` depending on migration status). Component files and hooks should remain free of pure calculations, mapping algorithms, or parsers.
- **Hooks Composition:** Custom hooks MUST only contain stateful React logic and functions operating on that state.
- **Hook Dependencies:** Always document the necessity of specific dependencies in React `useEffect`, `useCallback`, or `useMemo` dependency arrays to explain *why* they are required and prevent accidental removals or lint bypasses.

## 4. Key Technical Debts
- **Hybrid JS/TS:** Core services and many components are still in JS/JSX. Migrate to TS when modifying.
- **React Version:** Potential mismatch between `@types/react` (v19) and library (v18.2).
- **Rate Limiting:** No automated HTTP 429 retry mechanism exists in the current `ApiService.js`.
