# TODO: consolidate repeated frontend Jest mocks

Status: planned.

## Problem

Frontend tests repeat identical infrastructure mocks, increasing boilerplate and
making changes harder to apply consistently. The current Jest configuration has
no shared setup. Start with the following repeated translation mock, but audit
other frequently repeated mocks as well:

```ts
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
```

This mock returns translation keys rather than translated text.

## Scope

- Inspect `frontend/jest.config.js`, existing test helpers, and repeated mock
  implementations across frontend tests. Group candidates by equivalent behavior,
  not just by mocked module name. Remove obsolete mocks before consolidating them.
- Add a small shared Jest setup through `setupFilesAfterEnv` for stable defaults
  that are appropriate across the frontend suite. Use the translation mock above
  as the first candidate; keep its current key-returning behavior.
- Review other repeated mocks, including banner, storage/native, auth, API
  configuration, and React Query mocks. Assess each candidate individually:
  use a global default only for universally suitable behavior, a narrowly owned
  shared factory for genuinely shared setup, or keep the mock local.
- Keep scenario-specific auth state, requests, provider failures and callback
  ordering local to their tests. Do not globally replace feature modules or React
  Query merely to reduce repeated lines. Preserve real React Query lifecycle
  coverage and existing import-boundary tests.
- Keep shared mocks typed, easy to override and isolated between tests. Account
  for existing `clearAllMocks`, `resetAllMocks`, `restoreAllMocks`, and module-reset
  usage so cleanup does not erase required implementations or leak state.
- Remove local copies replaced by shared setup and unused helpers, imports and
  exports made obsolete by this change. Avoid a generic test framework or an
  unrelated test-organization migration.
- Document the shared setup location, override mechanism and limits in the
  frontend convention guide. Tests of actual translation or interpolation must
  be able to opt out of the key-returning mock.

## Acceptance and verification

- [ ] Audit repeated mocks beyond `react-i18next`; record the chosen placement
      and reason for candidates in the task document while work is in progress.
- [ ] Suitable infrastructure defaults are configured once and replaced local
      copies are removed. Scenario-specific mocks remain explicit.
- [ ] Verify an ordinary test receives the shared default without declaring it,
      a test can override or opt out, and resets do not leak or erase behavior.
- [ ] Preserve meaningful assertions and real React Query lifecycle coverage;
      do not weaken tests to accommodate global mocks.
- [ ] Remove helpers and exports made unused by consolidation, and update the
      convention guide with the final contract.
- [ ] Run affected tests and `npm run ci:frontend`. Check formatting of this task
      document explicitly because `docs:check` does not include `docs/tasks`.
- [ ] Inspect staged/unstaged differences and run `npm run check:staged` against
      the actual staged snapshot when present. Preserve the user's staging choices.

Delete this temporary task document when completed. Keep the lasting setup
documentation in the frontend convention guide.
