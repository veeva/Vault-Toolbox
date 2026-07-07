# Vault Unit Tester: Boilerplate Templates

## Testing a Utility Function ([Util].test.ts)

```typescript
import { describe, it, expect } from 'vitest';
import { handleErrors } from '../ApiService';

describe('ApiService Error Handling', () => {
  it('should convert a Javascript Error into the Vault FAILURE format', () => {
    const error = new Error('Test error message');
    const result = handleErrors(error);

    expect(result.responseStatus).toBe('FAILURE');
    expect(result.errors[0].message).toBe('Test error message');
  });
});
```

## Testing a Custom Hook ([Hook].test.tsx)

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useVqlQuery from '../useVqlQuery';

// Mock global dependencies
global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
} as any;

describe('useVqlQuery', () => {
  it('should initialize with an empty code string', () => {
    const { result } = renderHook(() => useVqlQuery({ updateQueryHistory: vi.fn() }));
    expect(result.current.code).toBe('');
  });

  // Example of testing an async action
  it('should set executing state during query submission', async () => {
    const { result } = renderHook(() => useVqlQuery({ updateQueryHistory: vi.fn() }));
    
    // Trigger submission (mocking the API would be next)
    // await result.current.submitVqlQuery();
    // expect(result.current.isExecutingQuery).toBe(true);
  });
});
```
