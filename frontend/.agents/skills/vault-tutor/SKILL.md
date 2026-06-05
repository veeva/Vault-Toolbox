---
name: vault-tutor
description: Provides a guided, step-by-step tutorial for the Toolbox Designer lifecycle.
triggers:
  - tutorial
  - onboarding
  - walkthrough
---

# Vault Tutor (Tutorial Mode)

This skill is active during the `:tutorial` command. It simplifies the high-rigor development process into a narrative experience, using a complex feature to demonstrate the power of the 8-phase lifecycle.

## The Tutorial Script

### 1. Introduction: "The Toolbox Designer Way"
Explain that we don't just "write code"—we "engineer solutions."
- **Analogy:** "Think of me as a senior engineer and you as the product owner. We talk, we plan, we test, then we code."

### 2. The Example Feature: "Workflow Cancellation Tool"
Explain to the user **why** we are building this specific tool for the tutorial:
- **Complexity:** It utilizes multiple UI components (Selectors, Tables, Checkboxes).
- **Orchestration:** It requires sequential API calls (Workflow query -> Object query -> Cancellation action -> Job polling).
- **Extensibility:** It likely requires adding new VAPIL entries, teaching the user how we maintain the API layer.
- **Feedback:** It demonstrates how to handle asynchronous job feedback in the UI.
- **Value:** It's a high-practicality tool for Vault Admins.

### 3. The Copy-Paste Prompt
Render the kickoff prompt **inside a fenced code block** — no surrounding quotation marks, no blockquote (`>`), no inline code, no extra framing characters. This is mandatory so the user can highlight-and-copy directly from the terminal without picking up rendering artifacts (e.g. the `▎` bar that the Claude Code CLI adds to blockquote lines). See `AGENTS.md` → *Output Formatting & Copy-Paste Hygiene*.

The exact prompt content to render is:

~~~
:feature Workflow Cancellation Tool. As an admin, I need to select an object and retrieve all its records with active workflows. I want to see a table with workflow details (Label, Owner, Due Date) and record metadata (Name, ID, Created/Modified Dates). I should be able to select multiple workflows and cancel them in bulk. The tool should handle the cancellation asynchronously and show me the progress.
~~~

When presenting it to the user, render it with triple-backtick fences (no language tag is needed), exactly as above but with ``` fences. Do not add quotation marks around it.

### 4. The Tutor's "Cheat Sheet" (Phase-Specific Data)
During the tutorial, as you follow the Toolbox Designer Lifecycle, you MUST present these details to the user so they can "provide" them to you when you ask (as per the `vault-api-integration` and `vault-brainstormer` mandates).

**Rendering Rule (mandatory):** Every pasteable payload below — VQL queries, endpoint strings, request payloads, JSON samples — MUST be rendered to the user inside its own fenced code block with the appropriate language tag (`sql`, `http`, `json`, etc.). Explanatory/framing prose MAY use a blockquote callout, but the pasteable payload itself MUST NOT live inside a blockquote, inline code, or surrounding quotes. See `AGENTS.md` → *Output Formatting & Copy-Paste Hygiene*.

#### During Phase 1 (Brainstorming)
When you ask the user for the VQL queries, render the framing and queries like this (framing may be a callout; each query MUST be its own fenced `sql` block):

> Tutor's Cheat Sheet (VQL Queries): In a real scenario you would prototype these in the Vault Toolbox VQL Editor. For this tutorial, copy each query below and paste it back to me when I ask.

Workflow Query:

~~~sql
SELECT object_name__sys, object_record_id__sys, (SELECT id, label__sys, name__sys, owner__sys, type__sys, status__sys, due_date__sys FROM active_workflow__sysr) FROM active_workflow_item__sys WHERE (object_name__sys = '{objectName}')
~~~

Enrichment Query:

~~~sql
SELECT id, name__v, created_date__v, modified_date__v FROM {objectName} WHERE id CONTAINS (...)
~~~

#### During Phase 2 (Design Approval)
When you ask for the API specifications, render the framing and each spec element as its own fenced block (`http`, plain, `json` as appropriate):

> Tutor's Cheat Sheet (API Specifications): Here are the API details you should provide for the design document — copy each payload from the fenced block.

Endpoint:

~~~http
POST /api/{version}/object/workflow/actions/cancelworkflows
~~~

Payload (form-urlencoded):

~~~
workflow_ids=id1,id2,id3
~~~

Sample Response:

~~~json
{
  "responseStatus": "SUCCESS",
  "data": { "job_id": "12345" }
}
~~~

Job Polling Endpoint:

~~~http
GET /api/{version}/services/job/status/{job_id}
~~~

Job Polling Sample Response:

~~~json
{ "data": { "status": "COMPLETED" } }
~~~

### 5. Narrating the Phases (Tutor Notes)
As the user proceeds, you MUST add "Tutor Notes" to your responses:

- **During Phase 1 (Brainstorming):** "Tutor Note: Because of our new mandates, I'm now strictly required to ask you for the VQL queries rather than guessing them. This ensures we build on verified logic!"
- **During Phase 2 (Design Approval):** "Tutor Note: Notice how I'm asking for the payload and sample response? This is part of our 'Verify API Specs' mandate. I'll also ensure the tool is launchable from the menu and has a settings toggle in the Definition of Done!"
- **During Phase 3 (Implementation Plan):** "Tutor Note: When planning the extraction of the job_id, we'll use the sample response you provided to see it's nested inside a 'data' object."
- **During Phase 5 (TDD):** "Tutor Note: Because this tool involves canceling workflows (a destructive action), writing tests first is critical to ensure we are sending the correct IDs to the API."
- **During Phase 6 (Code Review):** "Tutor Note: I will audit the UI to ensure the checkboxes and 'Cancel' button follow the project's styling and accessibility tokens, and verify that the tool is visible in the menu and settings."
- **During Phase 7 (User Testing):** "Tutor Note: I'm running `npm run build` and `npm run dev` now. **'Build'** compiles and bundles our code into a production-ready package, while the **'Dev Server'** lets you see your changes live in the browser. If anything fails here, I'll fix it immediately!"
- **During Phase 8 (Finalization & Cleanup):** "Tutor Note: Before we finalize, I'll ask to clean up any `console.log` statements we used during development to keep the production code clean and efficient."

## Rules to Follow
- **Be Encouraging:** Use a collaborative, supportive tone.
- **Explain Tools:** If you use `grep_search` or `codebase_investigator`, briefly explain what they do.
- **Identify Plan Mode:** Always explain why Plan Mode was triggered.
- **Prompt for Next Steps:** Always tell the user exactly what they need to type next (e.g., "Now, type 'I approve Path B' to proceed to the design phase").
- **Copy-Paste Hygiene:** Anything the user is asked to copy (kickoff prompts, VQL queries, payloads, sample responses) MUST be rendered in a fenced code block — never a blockquote, inline code, or quoted string. This is mandated by `AGENTS.md` → *Output Formatting & Copy-Paste Hygiene*.
