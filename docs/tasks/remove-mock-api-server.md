# TODO: remove the development mock API server

Status: planned.

## Problem

The development mock server adds a second API entry point and mock-specific
behavior to application UI. ProfileStreak contains an achievement preview button
with a fabricated reward, enabled by detecting port 3101. Ordinary feature
screens should reflect backend responses rather than the selected mock endpoint.

Some mock endpoints already proxy to the real backend, so the server also adds
configuration and maintenance without removing the backend dependency.

## Scope

- Audit `mock-api/server.js`, `routes.json`, `db.json`, and `server.test.js`.
  Identify which responses are fabricated and which requests proxy to the backend.
  Check actual backend support for flows currently using fabricated responses.
- Use the real local or configured remote backend for application development.
  Keep endpoint selection in API configuration and development scripts.
  Preserve the existing `local` and `render` modes and inspect API URL overrides
  without exposing credentials or private environment values.
- Remove `mock-api/`, the root `mock:api` script, and dependencies exclusive to
  that server, including `json-server` when no other consumer requires it.
  Update the owning package manifest and lockfile consistently.
- Remove `isMockApiEnabled`, its tests and export, and mock-endpoint detection.
  Remove the ProfileStreak achievement preview action, fabricated reward constant,
  and imports/styles made unused by that removal. Check both locales for debug
  translation keys that no longer have consumers.
- Audit remaining application branches, startup configuration, scripts, and
  documentation for mock-server assumptions, port 3101, `MOCK_PROXY_TARGET`, and
  obsolete startup instructions. Update `docs/api-error-contract.md` to describe
  direct backend access.
- Verify actual achievement/reward feedback through confirmed backend responses.
  Preserve per-call mutation callbacks, owner-specific cache behavior, session
  isolation, and rejection of stale-session effects.
- Keep deterministic unit-test mocks and boundary fakes used by automated tests.
  This task removes the separately running development server and its application
  branches; it does not replace tests with live network calls or delete unrelated
  development tools.

## Acceptance and verification

- [ ] Application development works against the local/backend deployment without
      starting a mock API server. Verify auth, articles, dictionary, quizzes,
      profile/streak, achievements, and mascot/wardrobe flows.
- [ ] No application UI detects mock endpoints or displays fabricated achievement
      rewards. Real unlock feedback still works after confirmed mutations.
- [ ] Mock server files, exclusive dependencies, commands, and obsolete references
      are removed. Any backend gaps discovered during the audit are explicit.
- [ ] Run affected suites and `npm run ci:frontend`; run backend checks when backend
      implementation changes are necessary. Preserve meaningful session-lifetime
      coverage and distinguish pre-existing failures.
- [ ] Check this document's formatting explicitly because `docs:check` excludes
      `docs/tasks`. Inspect staged/unstaged differences and run `npm run check:staged`
      against the actual staged snapshot when present. Preserve user changes and
      staging choices.

Delete this temporary task document once the removal is fully completed.
