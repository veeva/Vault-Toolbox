# Project Foundation: Toolbox Designer

## New to AI-Driven Development?
If this is your first time working with an AI agent in a high-rigor project, here are some behaviors you might see:

### 1. What is "Plan Mode"?
Sometimes I will enter **Plan Mode**. This is a "read-only" state where I am forbidden from editing files. I use this to research the codebase, map out dependencies, and ensure a safe design before I touch any code. Think of it as me "stopping to think" before I "start to build."

### 2. What are "Sub-agents"?
For complex tasks, I might call a **Sub-agent** (like `generalist` or `codebase_investigator`). These are specialized agents that handle the heavy lifting of reading many files or running complex searches. They return a summary to me, which keeps our main conversation fast and focused.

### 3. Why the 8-Phase Lifecycle?
We follow a strict 8-phase process (Brainstorm -> Design -> Plan -> ToDo -> TDD -> Review -> Testing -> Finalize). This ensures that every line of code is tested, well-designed, and maintainable. We value "Evidence over Claims."

### 4. What are "Speak Modes"?
I support token-efficient communication modes (`rocky`, `signal`, `caveman`) to maintain long session histories. Toggle these using the **`:speakmode`** command.

**Ready to start?** Type **`:tutorial`** for a guided walkthrough with an example feature.

## Project Directories
This project contains multiple applications. Refer to the domain-specific identity files for tech stacks and prerequisites:

- **Vault Custom Pages:** `./custom-pages-identity.md`
- **Vault Toolbox (Browser Extension):** `./toolbox-browser-identity.md`
