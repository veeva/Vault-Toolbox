# Vault API Integration: Error Handling & Status Codes

The Vault Toolbox ensures all API errors (network, application, or service level) are presented in a unified format that mirrors the official Vault API response structure.

## Error Normalization (`handleErrors`)

The `handleErrors` function in `ApiService.js` converts standard JavaScript `Error` objects into the Vault-compatible `FAILURE` response:

```json
{
  "responseStatus": "FAILURE",
  "errors": [
    {
      "type": "ErrorName (e.g., TypeError)",
      "message": "Detailed error message"
    }
  ]
}
```

### When to Use `handleErrors`
- **Catch Blocks:** Every facade method in `ApiService.js` must use `handleErrors(error)` in its `catch` block.
- **Service Level:** If a VAPIL service detects a logical error before the `fetch` call, it should throw an `Error` to be caught by the facade.

## HTTP Status Codes

While Vault API often returns `200 OK` for application-level errors (with `responseStatus: 'FAILURE'`), certain status codes require special handling:

| Status Code | Description | Strategy |
| --- | --- | --- |
| **200 OK** | Success or Application-level Error | Inspect `responseStatus` in the JSON body. |
| **401 Unauthorized** | Session expired or invalid. | Trigger re-authentication in `AuthContext`. |
| **429 Too Many Requests** | Rate limit exceeded. | Report to user; suggest a pause. Future: Implement backoff/retry. |
| **500+ Server Error** | Vault internal error. | Use `handleErrors` to report the failure. |

## Network Failures

Network timeouts or DNS failures are automatically caught by the `try...catch` block in `ApiService.js` and converted to a `FAILURE` response via `handleErrors`.
