# Task: organize project tests and reusable mocks

Status: planned. This is separate from the API error-code implementation. Do not
start this migration as part of that task; current error-code changes stay intact.

## Problem and scope

`backend/src/auth/auth-errors.spec.ts` mixes HTTP contract scenarios, direct service
safeguard checks, fixture data, dependency mocks and application setup. This makes
individual flows difficult to review. Auth unit tests also repeat some dependency
mock definitions and fixtures.

Cover both `backend/**` and `frontend/**`. The auth suites above are a confirmed
starting point, not the full scope. Audit frontend tests before proposing changes;
do not assume all existing suites need reorganization. Frontend already has HTTP
test helpers in `frontend/api/testing`, including response and adapter factories;
reuse or extend these where appropriate instead of creating competing helpers.

Inspect both projects for actual duplication and propose focused batches; do not
rewrite all tests in one change. Preserve production behavior and meaningful test
coverage. Use existing Jest and NestJS test tooling; do not introduce a new test
framework or generic mocking DSL. Keep NestJS and Expo/React Native mocks within
their respective runtimes. Share runtime-independent fixtures across projects only
when demonstrated reuse justifies it.

## Review batches

1. Inventory tests and existing helpers in both projects and establish a baseline.
   Identify responsibilities, test levels and duplicated setup. Backend coverage
   includes services, HTTP contracts, guards and e2e tests; frontend coverage
   includes utilities, transport, session behavior and any existing hook/UI suites.
   Select concrete migrations based on findings and record project-specific rules
   in the appropriate instruction/convention files.
2. Pilot backend organization in auth. Extract narrowly owned typed mock factories,
   fixtures and explicit app setup. Split HTTP flows and move direct service
   assertions to unit suites. Suggested owners include login, registration/email
   verification, password reset, Google identity, refresh, authorization and DTO
   validation. Preserve the cases and assertions that protect each behavior.
3. Pilot frontend organization in an area selected from the audit. Reuse existing
   HTTP helpers; extract repeated storage, native-module or query-provider setup
   only where it occurs. Keep pure utility, request, session and UI responsibilities
   distinct. Preserve existing feature ownership, colocated `index.spec.ts` rules
   and Jest discovery; do not impose backend filenames or directory layouts.
4. Apply the demonstrated patterns to further backend/frontend areas in separate
   reviewable batches. Factories must return independent mocks/data with explicit
   defaults; keep scenario overrides and expected results beside tests. Promote
   helpers only after real reuse. Do not hide Jest hooks, mutate shared fixtures
   or introduce scenario-name branching tables.
5. Review both projects, update documentation references and verify preserved
   coverage and Jest discovery. Record any remaining work separately.

Pause after each batch for user review. Do not change production error definitions,
response bodies, status codes, permissions or auth behavior during this task.
Frontend presentation, navigation, localization, retries, offline handling and
session protections must also retain their behavior.

## Acceptance and verification

- [ ] Each test file has a clear responsibility and test level.
- [ ] Repeated dependency mocks and fixtures use narrowly owned factories with
      fresh state; expected HTTP responses remain explicit in each suite.
- [ ] HTTP tests use the production boundary configuration with real auth
      components and mocked persistence, mail and external providers.
- [ ] Frontend helpers respect feature/shared ownership and reuse existing HTTP
      factories; storage, native modules, network and query state are isolated
      where those boundaries are used. No live providers or device dependencies.
- [ ] Meaningful scenarios and assertions are preserved; explain any removed
      duplicate rather than measuring success by file size or test count.
- [ ] Clocks, environment variables, mocks, modules, apps, storage and query state
      are isolated and cleaned up without execution-order dependencies.
- [ ] Existing Jest configurations discover all moved files. Run affected suites,
      root `npm run ci:backend`, `npm run ci:frontend`, `npm run typecheck`, relevant
      backend e2e and documentation checks as each project is changed. Check the
      actual staged snapshot when present; distinguish existing failures from
      regressions.
- [ ] Update lasting conventions if needed and delete this temporary task document
      once the migration is fully complete.
