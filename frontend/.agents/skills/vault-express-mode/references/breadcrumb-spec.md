# Express Breadcrumb Tag Spec

Breadcrumbs are inline comment tags dropped *while building* in express mode.
They are cheap to write (you know the "why" at that moment) and serve four jobs
at once: they populate the **debt ledger**, specify the eventual **tests**, seed
the **design doc**, and act as the **merge gate**. `express_guard.js` greps for
them; their presence blocks finalization until resolved.

## Tag format
One tag per line, inside a normal comment:

```
@express-<type>: <payload>
```

Recognised types and what each feeds:

| Tag | Meaning | Feeds into |
|---|---|---|
| `@express-intent` | why this code exists | design-doc purpose + DoD |
| `@express-assumption` | an unverified claim | re-verified via MCP/CLI at graduation |
| `@express-fake` | hardcoded / stub / mock to be made real | hard punch-list (blocks finalize) |
| `@express-todo-test` | what the eventual test must cover | becomes a real Red-Green test |
| `@express-evidence` | fixture / CLI evidence reference | doc "Verified Against Vault" + fixture |

A tag with an **empty payload** is reported as `malformed` by the guard — fill it in.

## Test stubs
Scaffold the test surface without implementing it:

```js
it.todo('renders the empty state instead of crashing');
describe.skip('pagination across >1 page', () => {});
```

The guard counts these as open debt; `:promote` converts each into a real test.

## Example (express build)

```js
// @express-intent: live preview of doc lifecycle states without a round-trip
// @express-assumption: status__v returns the label, not the name (UNVERIFIED)
// @express-evidence: test/fixtures/lifecycle_states.json (CLI-verified)
export function useLifecycleStates() {
    console.log('[raw]', /* ... */); // mandatory raw-dump while in express
    // @express-fake: paginating client-side; real impl must use queryByPage
    return CLIENT_SIDE_SLICE;
}

// @express-todo-test: empty result set renders the skeleton, not a crash
```

## Running the guard

```bash
node .agents/scripts/express_guard.js .agents/features/<name> --ledger .agents/features/<name>/express-ledger.md
```

Exit code `0` = clean (safe to finalize); `1` = open debt remains (finalization blocked).
