---
name: vault-java-sdk-expert
description: Specialized guidance for implementing Vault Java SDK components for Custom Pages.
applicable_apps:
  - custom-pages
---

# Skill: vault-java-sdk-expert

This skill provides the deep technical guidance required to build performant and safe Java logic within the Veeva Vault runtime.

## 1. PageController Implementation
Every backend component for a Custom Page MUST implement the PageController interface.

### Pattern: Controller Setup
- Annotation: Must include @PageControllerInfo(urlPathName = "...").
- Entry Point: Logic resides in the onLoad(PageLoadContext context) method.
- Response: Return data via PageLoadResponse using response.putValue(key, value).

## 2. Efficiency and Scaling (The "Every Byte Counts" Mandate)
Vault Java SDK operates in a multi-tenant environment with strict execution limits.
- No Nested Loops: Avoid O(n2) operations. Use Maps/Sets for lookups when merging datasets.
- Selective VQL: Ensure queries only retrieve the fields required for the UI.
- Resource Management: Be mindful of memory usage when processing large lists; favor streaming or batching if possible.

## 3. Vault Services
Access Vault functionality via the ServiceLocator:
- QueryService: For VQL execution.
- RecordService: For object record operations.
- EnvironmentService: To detect and guard against Production modifications.

## 4. Operational Mandates
1. No Direct JDBC: Never attempt to use direct database connections. Only use the provided SDK services.
2. Error Handling: Use the VaultRuntimeException or standard SDK error patterns to return meaningful messages to the Frontend.
3. Mock-Driven Testing: Use VaultTestRunner to mock services and the PageLoadContext for high-coverage JUnit tests.
4. Evidence-First Integration: 
   - Obtain real response samples before writing parsing logic for external data.
   - Use LogService to perform a "raw-dump" of responses before transformation.
   - Save real responses as permanent test fixtures for JUnit tests.
   - Never infer field names from documentation; use the actual JSON payload.
   - Explicitly mark assumed fields in Java code with comments: // assumed - not confirmed.
