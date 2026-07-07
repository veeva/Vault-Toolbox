# Identity: Vault Toolbox Browser Extension

**Project Title:** Vault Toolbox

**Description:**
Vault Toolbox is a Chrome Extension (Manifest V3) designed specifically for Veeva Vault developers and administrators. It acts as an integrated development environment within the browser, providing a suite of advanced tools to interact directly with Vault APIs and metadata. By operating within an authenticated session, it streamlines workflows that are typically cumbersome or require external scripting.

The core features include:

* **Component Editor:** An interface with Monaco Editor to view, fetch, and deploy MDL (Metadata Definition Language) component configurations.
* **VQL Editor:** A robust query editor for executing Vault Query Language (VQL) commands, featuring a visual query builder, query history, and CSV export capabilities.
* **Data Tools:** Utilities to initiate asynchronous data jobs, such as counting or deleting Vault objects and documents.
* **File Browser:** A file manager interface to explore, upload, and download files from the Vault File Staging area and the Direct Data API.
* **Data Navigator:** A powerful record inspector that parses Vault IDs and URLs, queries their full metadata, and presents it in a searchable, tabular format with deep links to related references and the Vault Admin UI.

### Modular Features
In addition to the core suite, the project may have modular tools specific to this branch/workspace only. Detailed requirements and technical designs for these tools are maintained independently in the `.agents/features/` directory.

**Tech Stack List**
- **React (v18.2):** The core UI library.
- **React Router DOM (v7.1):** For handling client-side routing within the extension.
- **TypeScript / JavaScript:** The primary programming languages.
- **Chakra UI (v3.13):** The foundational component library used for layout, typography, and interactive UI elements.
- **Emotion:** Used internally by Chakra UI for CSS-in-JS styling.
- **React Icons (v5.5):** For scalable vector icons used throughout the interface.
- **TanStack Table (v8.21):** Used for building complex, sortable, and filterable data grids.
- **TanStack Virtual (v3.13):** Used for windowing/virtualizing large datasets in tables.
- **React Complex Tree (v2.4):** Used for rendering nested folder structures.
- **Monaco Editor (v0.52):** The code editor that powers the VQL and MDL text areas.
- **Webpack (v5.97) & Webpack CLI:** Used to bundle the application assets.
- **Babel (v7.26):** For transpiling modern JavaScript and React JSX.
- **ESLint (v9.21):** For code quality and linting.
- **Chrome Extensions API (Manifest V3):** For browser integration.

**Prerequisites**
- **Node.js:** A modern active LTS version (v18+ is recommended).
- **npm:** Node package manager.
- **Google Chrome:** To load and test the unpacked extension.
- **Veeva Vault Access:** Credentials or an active session for a Veeva Vault environment.

**Installation and Setup**
1. **Install Dependencies:**
Navigate to the root directory of the project and run `npm install`.

2. **Configure Environment Variables:**
Create a `.env` file in the root directory.

3. **Build the Project:**
To build the project for development: `npm run dev`.
To create a production build: `npm run build`.

4. **Load the Extension in Chrome:**
- Open Google Chrome and navigate to `chrome://extensions/`.
- Enable **"Developer mode"**.
- Click the **"Load unpacked"** button and select the `dist/` folder.
