# Pull Request

## What changed

<!-- One paragraph: what did you change and why? Link any issues. -->

## How to verify

<!--
  Numbered steps a reviewer can run to verify the change. Include:
  - exact commands to run
  - what to look for (UI, API response, log line)
  - any env vars to set
-->

```bash
# example
npm test -- --testPathPattern="orderService"
```

## Tests

- [ ] **Unit tests added/modified** covering new code (AAA pattern; Arrange/Act/Assert explicit)
- [ ] **Edge-case checklist walked** for any money/inventory/auth code (see `docs/TESTING.md` §2)
- [ ] **Playwright spec added** if the change is user-facing (new page, new visible state, new error)
- [ ] **Coverage thresholds hold** — `npm test -- --coverage --forceExit` passes locally; per-glob thresholds in `docs/TESTING.md` §3 not regressed
- [ ] **Page Object updated** if a page structure changed (one spec migrated as proof)
- [ ] **No silent-skip guards** — no `if (!cookie) return;` style anti-patterns in new test code

## Side effects

- [ ] **External dependencies mocked** (Stripe, Cloudinary, SMTP, third-party APIs)
- [ ] **No live DB writes** unless the test specifically needs them (use `page.route()` mocks from `e2e/helpers/mocks.js`)
- [ ] **No new console output** that wasn't there before

## Documentation

- [ ] `docs/TESTING.md` updated if a new pattern was introduced
- [ ] `CLAUDE.md` updated if the architecture / commands changed
- [ ] Inline JSDoc on non-obvious functions

## Rollout

- [ ] No DB migration
- [ ] No env var additions
- [ ] No feature flag needed
- [ ] Backward compatible (existing API shapes unchanged)

<!--
  Replace any unchecked item with a one-line justification, e.g.
  "- [ ] ~Playwright spec added~  N/A — internal utility, no UI surface"
  -->
