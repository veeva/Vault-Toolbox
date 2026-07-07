---
name: toolbox-browser-tutor
description: Specialized tutorial cheat sheet for the Vault Toolbox Browser Extension.
applicable_apps:
  - toolbox-browser
---

# Skill: toolbox-browser-tutor

This skill provides the specialized example data and narrative notes for the Toolbox Browser Extension tutorial.

## 1. Example: Workflow Cancellation Tool
Explain why this tool is chosen: it demonstrates UI orchestration, sequential API calls, and local VQL prototyping.

## 2. Kickoff Prompt
Render the following prompt in a fenced block:

```
:feature Workflow Cancellation Tool. As an admin, I need to select an object and retrieve all its records with active workflows. I want to see a table with workflow details and record metadata. I should be able to select multiple workflows and cancel them in bulk. The tool should handle the cancellation asynchronously and show me the progress.
```

## 3. Tutor's Cheat Sheet (Phase-Specific Data)

### Phase 1 (Brainstorming)
Workflow Query:
```sql
SELECT object_name__sys, object_record_id__sys, (SELECT id, label__sys, name__sys, owner__sys, type__sys, status__sys, due_date__sys FROM active_workflow__sysr) FROM active_workflow_item__sys WHERE (object_name__sys = '{objectName}')
```

### Phase 2 (Design Approval)
Cancellation Endpoint:
```http
POST /api/{version}/object/workflow/actions/cancelworkflows
```

Payload (form-urlencoded):
```
workflow_ids=id1,id2,id3
```
