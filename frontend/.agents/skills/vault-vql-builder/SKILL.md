---
name: vault-vql-builder
description: Guarantees 100% correct, verified VQL queries. Use whenever creating, modifying, or troubleshooting any Vault Query Language (VQL) statement.
triggers:
  - vql
  - query
  - find
  - select
applicable_apps:
  - toolbox-browser
---

# Skill: vault-vql-builder

This skill enforces absolute correctness of Vault Query Language (VQL) statements by eliminating SQL-like assumptions and requiring live, empirical verification against a Veeva Vault.

## 1. Core Mandates

### Dynamic Verification Protocol (Hard Gate)
Before implementing, changing, or committing any VQL query in the codebase, you MUST verify its syntax and structure:
1. **Search MCP**: Query `vault-developer-mcp` tools (`mcp_search_api_reference` or `mcp_search_developer_docs`) to confirm the object, fields, and options are valid.
2. **Execute Live Verification**: Run the query through the local Vault API Utility. If the query is dynamically generated, verify the final output string before execution with the user. Use the following command:
   ```bash
   node .agents/scripts/vault_api.js vql "SELECT id, name__v FROM document__v LIMIT 1"
   ```
3. **Analyze Response**: Verify the query status is not `FAILURE`. Ensure the field list matches exactly.

### Disconnected Fallback Protocol
If the Vault API Utility is `NOT_CONFIGURED` or fails to connect, you MUST NOT proceed with the implementation on assumed syntax. Instead:
1. Halt the process.
2. Print the exact VQL query you intend to use.
3. Provide the user with the exact utility command to run:
   ```bash
   node .agents/scripts/vault_api.js vql "YOUR_QUERY"
   ```
4. Explicitly ask the user to run the command on their connected system and provide the JSON output or error message back to you.
5. Only proceed once the user provides the verification results.
