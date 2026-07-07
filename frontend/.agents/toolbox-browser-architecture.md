# Architecture and Design Document: Vault Toolbox Browser Extension

## Folder Structure Map

The project follows a feature-based organization combined with role-based separation (hooks, components, utils) within a standard React application structure. As a Manifest V3 Chrome Extension, it also separates the background service worker from the React frontend (`app`).

```text
src/
 app/                        # Main React application code
    components/             # Reusable UI components, grouped by feature
       component-editor/   # MDL Component Editor UI
       data-navigator/     # Data Navigator table and cells
       data-tools/         # Asynchronous data job UI (Count/Delete)
       file-browser/       # File Staging and Direct Data UI
       login/              # Authentication and Vault selection UI
       settings/           # Configuration panels
       shared/             # Common UI (Layout, Context Panel, generic elements)
          ui-components/  # Base Chakra UI wrappers and snippets
       vault-info/         # Vault information display
       vql-editor/         # VQL Query Editor and Builder UI
       [modular-tool]/     # Modular feature components (documented in features/)
    context/                # React Context providers for global state
       AuthContext.tsx
       SettingsContext.tsx
    hooks/                  # Custom React hooks containing business logic
       component-editor/
       data-navigator/
       data-tools/
       file-browser/
       login/
       settings/
       shared/
       vault-info/
       vql-editor/
       [modular-tool]/     # Modular feature hooks (documented in features/)
    pages/                  # Top-level route components
    services/               # API clients and external communications
       vapil/              # Veeva API domain-specific requests
       ApiService.js       # Base API configuration
       SharedServices.ts
    utils/                  # Helper functions and constants
    App.jsx                 # Main application router and layout wrapper
    index.jsx               # React DOM entry point
 background/                 # Chrome Extension Background Service Worker
    background.js
 images/                     # Static assets (logos, icons)
 manifest.json               # Chrome Extension Manifest V3 configuration
 types.d.ts                  # Global TypeScript declarations

```

## Development Philosophy: SDD & TDD

Vault Toolbox follows **Subagent-Driven Development (SDD)** and strict **Test-Driven Development (TDD)**.

1. **Subagent Delegation:** Complex or high-volume tasks (e.g., "Refactor all hooks") MUST be delegated to the `generalist` or `codebase_investigator` sub-agents. This keeps the main session history lean and focused on strategic orchestration.
2. **TDD (Red-Green-Refactor):** No production code is written without a preceding failing test. Refer to `vault-unit-tester` for the mandatory 3-step cycle.
3. **YAGNI (You Aren't Gonna Need It):** Features are only implemented when strictly required by the current approved design. "Just-in-case" abstractions are discouraged.

## UI Architecture: The "Nested Pillar" Pattern

The application follows a strict **Nested Pillar layout** to ensure visual depth and feature isolation. Use the `vault-ui-designer` skill for the full implementation checklist and tokens.

### Outer Layout (Horizontal Pillars)
Every tool page is primarily split into two horizontal pillars:
1. **Pillar A (Main Content Area):** A `VStack` (with `flex: 1`) containing the core tool workspace.
2. **Pillar B (Right Sidebar):** A fixed or collapsible `Box` (with `flex: 0 0 auto`) for contextual actions, help, or configuration.

### Inner Layout (Vertical Stack - within Pillar A)
Within Pillar A, content is arranged in a vertical stack (using `VStack` with `gap: 0`):
1. **Header Row:** Clear page title and global actions (**Outside** the island).
2. **Main Island:** The primary functional workspace (Inside a depth-providing `VStack` container).
3. **Status Island:** Fixed-height (`42px`) bottom telemetry bar (`<VaultInfoIsland>`).

## State Management Flow

The application relies heavily on React's built-in state management primitives, utilizing a combination of local state, custom hooks, and React Context. It avoids heavy external libraries like Redux in favor of a lighter, hook-driven approach.

1. **Global State (React Context):**
* **`AuthContext`**: Manages the user's authentication state, active Vault session ID, base URL, and user details. This context is critical as it wraps the protected routes and provides the necessary credentials for all `services/vapil` API calls.
* **`SettingsContext`**: Manages user preferences, UI configurations (like dark/light mode, default API versions), and feature-specific settings.


2. **Feature-Level State (Custom Hooks):**
* Business logic and complex state transitions are abstracted into custom hooks (e.g., `useVqlQuery`, `useFileStagingTree`, `useComponentTree`).
* These hooks encapsulate `useState` and `useEffect` logic, handling API data fetching, loading states, and error handling, returning clean interfaces to the presentation components.
* **Reducers:** For highly complex state scenarios (like managing the dynamic table states in the Data Navigator), the `useReducer` pattern is employed (e.g., `useDataReducer.ts`) to ensure predictable state transitions.


3. **Local UI State:**
* Simple toggle states (modals, dropdowns, active tabs) are handled within individual components using standard `useState`.



## Component Hierarchy

The component tree is designed with a clear separation between routing, layout, and feature-specific "Islands".

* **Root Provider Level (`index.jsx`)**
* `ChakraProvider` (Styling & Theming)
* `AuthProvider` (Global Auth State)
* `SettingsProvider` (Global Preferences)
* `MemoryRouter` / `HashRouter` (Client-side Routing)
* **App Level (`App.jsx`)**
* **`Layout` Component:** Contains the global shell.
* `Sidebar` / `CollapsedSidebar` (Navigation)
* `ErrorBoundaryCard` (Catch UI crashes gracefully)
* `Box (flex={1})` with `Outlet` (Main Content Area)
* **Page Level (`pages/*.jsx|tsx`)**
* *Examples: `VqlEditorPage`, `ComponentEditorPage`, `LoginPage*`
* **Island Components (`components/*/*Island.jsx`)**
* Feature-specific wrappers that compose the tools (e.g., `VqlEditorIsland` contains the `VqlConsole`, `VqlTableBody`, etc.).
* These components connect directly to their respective feature hooks for data.


## Styling Guide

The project uses **Chakra UI** as its primary design system and component library, emphasizing a clean, accessible, and responsive interface.

1. **CSS-in-JS Philosophy:**
* Avoid writing raw CSS files unless strictly necessary. Rely on Chakra UI's style props (e.g., `bg`, `color`, `px`, `mt`, `flexDir`) directly on components (`<Box>`, `<Flex>`, `<Grid>`) to construct layouts.


2. **Theming and Colors:**
* The app supports Color Modes (Light/Dark). Use semantic color tokens provided by Chakra (e.g., `useColorModeValue('gray.800', 'white')`) rather than hardcoding hex values.
* Custom Veeva-specific theme overrides may be defined in `src/app/utils/shared/VeevaTheme.ts`.


3. **Component Encapsulation:**
* Base UI components (buttons, inputs, modals) are wrapped or customized in `src/app/components/shared/ui-components/` to ensure a consistent look and feel across the extension. When building new features, prefer importing from this shared directory over raw Chakra components if a wrapped version exists.


4. **Layouts:**
* Use `<Flex>` for 1-dimensional layouts (rows/columns) and alignment.
* Use `<Grid>` for 2-dimensional complex layouts.
* Resizing behavior (e.g., between the code editor and results table) is handled via dedicated components like `HorizontalResizeHandle` and `VerticalResizeHandle` interacting with generic wrapper dimensions.
