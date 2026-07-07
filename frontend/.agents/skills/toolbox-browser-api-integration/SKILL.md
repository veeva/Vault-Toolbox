---
name: toolbox-browser-api-integration
description: Implementation patterns for the Vault Toolbox Browser Extension (Manifest V3).
applicable_apps:
  - toolbox-browser
---

# Skill: toolbox-browser-api-integration

This skill provides the procedural knowledge for integrating Vault APIs within a Manifest V3 Chrome Extension.

## 1. Authentication Flow (Manifest V3)
1. **Storage:** Session ID is stored in an **HTTP-only Chrome cookie** (`vaultToolboxSessionId`) scoped to the `vaultDNS`.
2. **Authorization:** The `request` wrapper intercepts calls to query the cookie API (`chrome.cookies.get`) and inject the `Authorization` header.
3. **Keep-Alive:** Use `useVaultSessionKeepAlive.ts` to periodically ping the `/keep-alive` endpoint.

## 2. API Architecture
- **Facade Pattern:** Centralized in `src/app/services/ApiService.js`.
- **VAPIL Entry (Default):** Reusable APIs (Metadata, Query) MUST be added to `src/app/services/vapil/`.
- **Direct Fetch Forbidden:** Never use `window.fetch` directly; use the `request` wrapper in `VaultRequest.js`.
- **Credentials:** Always set `credentials: 'omit'` in the `request` wrapper.

## 3. Telemetry & Normalization
`ApiService.js` MUST normalize all errors and include telemetry:
```javascript
{ 
  responseStatus: 'FAILURE', 
  errors: [{ type: 'ErrorType', message: 'Readable message' }],
  responseTelemetry: { responseSizeInKB, executionTimeInMS }
}
```
