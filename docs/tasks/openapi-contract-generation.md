# Task: OpenAPI contract and frontend type generation

Status: translations, achievements, mascot, streak, quiz sessions, notifications
and auth reviewed; dictionary migration implemented for review,
following the implemented
[API error contract](../api-error-contract.md). The pilot includes Swagger UI,
offline schema export, generated transport types and CI/staged freshness checks.
Continue in small module batches after review. Do not introduce a separate
error-only generator. Contributor workflow: [OpenAPI contract](../openapi-contract.md).

## Pilot progress and remaining migration

- Auth batch: all nine credential endpoints now have explicit body/response
  schemas, existing HTTP 201 statuses, public access-token security declarations
  and module-owned error responses. Shared session, email/code and delivery
  shapes avoid duplicate transport fields. Frontend requests and session refresh
  consume generated types; existing runtime decoders and session behavior remain.
- Focused HTTP suites cover login, Google identity, refresh rotation, registration
  and password reset using real services/validation with mocked persistence,
  provider and mail boundaries. Actual success/error bodies are checked against
  exported schemas. Existing mixed auth test suites remain outside this batch.
- Remaining migration after dictionary: articles (twelve operations) and root
  `GET /` (one operation). Review this dictionary batch before continuing.
  Keep this task until complete API coverage is reviewed.
- Auth verification (2026-11-03): backend CI passed (92 suites / 784 tests),
  followed by the additional auth schema/security test and its lint/format checks
  (one suite / one test). Frontend CI passed (141 suites / 726 tests); root
  typecheck, backend build, contract freshness and documentation formatting
  passed. E2E passed four tests; 17 database-backed cases were skipped without
  `QUIZ_TEST_DATABASE_URL`. The local read-only Swagger preview serves all nine
  auth operations. `check:staged` failed on the actual partial snapshot: frontend
  consumers were staged while the updated generated `transport.d.ts` was not,
  so new exports were missing during typechecking and related tests. The contract
  freshness step was skipped after that failure. Backend related tests passed
  (55 suites / 614 tests). lint-staged restored the original index and working
  files; no additional files were staged by the agent. Include the generated
  artifact, documentation and additional auth schema test when selecting the
  complete batch for commit, then rerun `check:staged`.

- Selected translations after inspecting its single public POST endpoint, existing
  provider HTTP tests and real frontend request/query consumers.
- Artifacts: `backend/openapi/openapi.json` and
  `frontend/api/generated/transport.d.ts`; root commands are `contracts:generate`
  and `contracts:check`.
- Actual wire behavior includes HTTP 201, defaulted language strings, omitted
  undefined fields and preserved nullable context. Existing transport declarations
  incorrectly excluded null context; the pilot corrects that representation.
- Public schema names generate direct `TranslateWordRequest` and
  `TranslateWordResponse` exports. The frontend request imports them directly;
  feature API types only re-export them. No client or hooks are generated.
- Shared Swagger error documentation now uses `@ApiErrorResponses`: parser and
  internal errors are automatic, DTO validation is an explicit opt-in, and the
  controller lists each operation-specific provider error. Runtime exception
  handling and serialized responses remain unchanged.
- Offline export uses real modules with Nest preview mode. One documented-module
  list feeds both export and Swagger UI; manual controller lists and inert service
  bindings have been removed. Isolation tests include fresh-process import guards.
- Remaining after pilot: inventory and migrate the other modules in small batches;
  document real auth/security requirements and date serialization as each module
  enters coverage; cover path/query parameters, discriminated unions, partial
  successes and additional fixtures; assess runtime validators where required;
  complete public API coverage and remove superseded declarations and plans.
- Keep this task until the broader migration is complete. The user requested a
  dedicated branch and commit for the completed pilot.
- Follow-up: translation directions are now an explicit backend-owned pair policy,
  initially `en -> uk`. DTO validation and OpenAPI enums/oneOf use that policy;
  unsupported requests are rejected before provider usage. Frontend language types
  are generated and language defaults remain owned by the backend.

## Verification (2026-11-03)

- The pilot is based on current main, commit `34830a1`, in the dedicated branch
  `feat/openapi-translations-pilot`. Existing changes were backed up and restored
  with staging intact before finalization.
- Backend CI passed: typecheck, lint, formatting, 75 suites / 617 tests and OpenAPI
  freshness. Backend production build passed.
- Frontend CI passed: typecheck, lint, formatting, documentation, 140 suites / 712
  tests and generated-type freshness.
- The earlier Windows documentation formatting failures were caused solely by
  CRLF/LF differences. `.gitattributes` now enforces LF for Markdown; no semantic
  frontend-convention changes were needed.
- Backend e2e: 4 passed; 17 PostgreSQL reward cases skipped because
  `QUIZ_TEST_DATABASE_URL` is not configured. No live database was started.
- Every translations HTTP response in the provider suite is checked against the
  exported response schema with test-only Ajv and independent expected statuses
  and bodies. Coverage includes null/omission, normalization, contextual success,
  validation details, parser limits, provider failures and variable-status errors.
- Shared Swagger errors have focused tests for defaults, validation opt-in and
  explicit operation errors. Error definitions remain owned by their modules.
- Preview export uses real modules from `DOCUMENTED_API_MODULES`, with no manual
  service bindings. Tests verify skipped constructors, equal UI/export documents,
  and fresh-process isolation with network, environment-file and relevant secret
  reads blocked before application imports.
- Repeated generation was byte-stable without production environment files or
  credentials. Backend and frontend freshness checks passed independently of the
  other project's dependency installation. Missing/stale files and source/schema
  drift were detected without rewriting artifacts.
- An isolated staged-snapshot regression rejected a deliberately stale staged JSON
  even when the working tree was correct. During review, partial user staging
  correctly failed on missing dependencies. The complete final snapshot passed
  `check:staged` before committing.
- A local read-only Swagger viewer was verified against the canonical JSON, with
  request execution disabled and no application endpoints registered. Deployment
  of the backend remains separate from this local review.

## Language-direction follow-up (2026-11-03)

- `SUPPORTED_TRANSLATION_PAIRS` is the only allowlist, currently `en -> uk`.
  The named default pair is included explicitly and does not depend on list order.
- Request field enums, cross-field DTO validation and OpenAPI request/response
  `oneOf` schemas derive from this policy. Unsupported directions fail before
  provider usage. Tests also cover multi-pair fixtures to reject cross-product
  combinations and verify omitted-field defaults in the schemas.
- Frontend hooks derive language types from generated transport types and leave
  defaults to the backend rather than duplicating the pair policy.
- Backend CI passed: 77 suites / 642 tests. Frontend CI passed: 140 suites / 712
  tests. Generation freshness, backend build and e2e checks passed; 17 database
  cases remain skipped without `QUIZ_TEST_DATABASE_URL`.

## Achievements migration (2026-11-03)

- The user approved continuing after the translations pilot. This batch covers
  only `GET /achievements/profile/me`; auth endpoints and other modules remain
  outside the published document.
- Explicit response DTOs own progress, achievement status and profile schemas.
  Backend services use those types; frontend requests and feature exports use
  generated `AchievementsProfileResponse`, `AchievementStatus` and
  `AchievementProgress` instead of duplicate transport declarations.
- Achievement IDs derive from one backend-owned literal list. Timestamp fields
  are required nullable `date-time` strings, matching service `toISOString()`
  serialization. They are not optional JavaScript dates.
- Swagger documents Bearer JWT authentication and existing missing/invalid/expired
  token errors, the missing-user 404 and shared boundary errors. Runtime guards,
  HTTP clients, cache/session behavior and UI models are unchanged.
- The offline root registers the real global Prisma module for DI metadata.
  Preview mode skips its constructor and hooks; fresh-process isolation tests
  continue to block database/network access, environment files and secret reads.
  ts-node's resolver maps Prisma's generated `.js` imports to TypeScript sources.
  Newer Node versions emit upstream `DEP0180` from this resolver; this warning
  does not affect export. The test permits only that known warning on stderr.
- HTTP tests validate actual success/error bodies against the exported schema,
  with explicit expectations for ISO dates, null grants and authentication errors.
- Remaining: migrate the other modules in reviewed batches, including path/query
  DTOs, unions and partial responses; retain the broader task until full coverage.
- Verification: backend CI passed (77 suites / 647 tests), frontend CI passed
  (140 suites / 712 tests), and backend production build passed. Both CI commands
  include typechecking, lint, formatting and artifact freshness. Root
  `contracts:check`, instruction formatting and changed-document formatting passed.
  The local read-only Swagger viewer serves both documented endpoints. No changes
  were staged in this batch, so no commit snapshot was available for `check:staged`.

## Shared authenticated-operation decorator

- `auth/api-user-auth.decorator.ts` now owns `ApiUserAuth`, a method decorator
  combining the real user guard, Bearer documentation, token errors and shared
  HTTP errors. Achievements supplies only its domain error through the options.
- Operation errors and validation opt-in are passed into this decorator rather
  than stacking `ApiErrorResponses`; errors sharing HTTP 401 are grouped together.
  No endpoint contracts or generated artifacts changed in this refactor.
- `AGENTS.md` and the contributor guide explain when to use the decorator, the
  `AuthModule` dependency, and its ownership/role-check limitations.
- Backend CI passed: 78 suites / 649 tests, including the existing real-guard
  achievements HTTP tests and new documentation composition tests. Contract
  freshness and instruction/documentation formatting passed.
- The actual user-selected staged snapshot failed `check:staged`: its JSON already
  includes achievements but the controller/documented-module changes are unstaged,
  so offline export reports a stale artifact. The full working tree passes.
  lint-staged restored the original state; the staged diff hash was unchanged.
  No additional files were staged automatically.

## Mascot migration

- This batch covers all five routes under `/mascot/profile/me`: profile read,
  purchase, equip, clear one slot and clear all slots. Each uses `ApiUserAuth`.
- Module-owned response DTOs describe `MascotProfileResponse` and
  `MascotEquippedItems`; frontend requests import generated response types and
  feature exports preserve the existing `MascotProfile` name as a type alias.
  The catalog's image assets, placement and localization models stay frontend-owned.
- Path DTOs now live in the module's `dto/` directory. The backend-owned
  `MASCOT_ACCESSORY_SLOTS` list supplies runtime validation and the named generated
  `MascotAccessorySlot` enum. Nonempty item IDs remain strings; catalog membership
  is an existing service rule rather than an independently copied transport list.
- Preserved HTTP 200/201 statuses, required profile fields and optional non-null
  equipped-item strings. Empty slots serialize as omitted properties; database
  timestamps and legacy columns are not leaked into transport types.
- HTTP contract tests compare all five operations' actual success, auth and
  missing-user responses with their exported schemas. Additional cases verify
  required path metadata, slot enums, validation and specific service errors.
  Existing purchase/equipment behavior tests remain intact.
- Remaining modules include auth, streak, dictionary, notifications, articles and
  quiz, plus the application root endpoint. Continue in reviewed batches and keep
  this task until full public API coverage is complete.
- Verification: backend CI passed (79 suites / 669 tests), frontend CI passed
  (140 suites / 712 tests) and backend production build passed. Both project
  freshness checks and documentation/instruction formatting passed. Staged files
  were selected by the user during this batch; snapshot verification is separate
  from these working-tree checks.
- `check:staged` passed against the actual selected implementation snapshot,
  including related tests, both TypeScript checks and contract freshness. No
  additional implementation files were staged by the agent. The refreshed local
  read-only Swagger viewer was verified to serve all five mascot paths.
- Existing behavior found during review: mascot debit and ownership writes are
  non-atomic. Recorded separately in [the follow-up task](mascot-purchase-atomicity.md);
  no purchase business logic was changed in this transport migration.

## Streak migration

- This batch covers the five existing routes under `/streak/profile/me`: profile,
  monthly calendar, restore, freeze and freeze-token purchase. They use `ApiUserAuth`
  with operation-specific errors; routes and business behavior are preserved.
- Explicit response DTOs own streak state, history, break details, achievement
  metadata and calendar transport shapes. Backend persistence records remain
  internal. Frontend requests and feature exports use generated types; the UI-only
  reminder union remains in the feature.
- Request DTOs now live under `streak/dto/`. The freeze body exposes a named
  `ApplyStreakFreezeRequest`; calendar parameters expose `StreakCalendarMonthQuery`
  and required numeric query fields with the existing month/year bounds. Numeric
  query text is converted by the existing DTO transform, not by generated types.
- The existing milestone/reward table now has one backend owner shared by service
  behavior and Swagger enum metadata. Named status/milestone schemas generate
  direct frontend exports without handwritten unions.
- Verified date-only strings versus ISO timestamps, required nullable last-activity
  and claim dates, and the explicit object-or-null break union. No persistence
  decoder, request validation or session/cache safety check was removed.
- New focused HTTP suites compare real profile/calendar and mutation responses
  against the exported document, mocking only persistence. They cover all three
  successful HTTP 201 mutations, query conversion/rejection, date normalization,
  null/date serialization, auth, missing users and representative business errors.
- Existing restore behavior and atomicity limitations remain tracked in
  [restore the full missed interval](restore-full-streak-gap.md). This migration
  does not claim to fix the paid restore workflow.
- Remaining coverage: auth, dictionary, notifications, articles, quiz and the
  application root endpoint. Continue in small reviewed batches.
- Existing UI policy duplication remains outside this transport batch: the freeze
  card owns a copied token-cap constant and the feature exports an unused copied
  milestone/reward table. A later policy cleanup can expose required limits from
  the backend and remove unused UI values; no new frontend policy copies were added.
- Verification: backend CI passed (81 suites / 697 tests), frontend CI passed
  (140 suites / 712 tests), and backend production build passed. Both CI commands
  include typechecking, lint, formatting and contract freshness. New wire suites
  cover 28 cases; instruction and changed-document formatting passed.
- The actual partial staged snapshot failed `check:staged`: deletion of the old
  `streak/dto.ts` was selected while the controller's updated imports were still
  unstaged. The complete working tree passes. lint-staged restored the original
  state; no implementation files were added to staging by the agent.
- Refreshed the local read-only Swagger viewer and verified all five streak paths.

## Quiz-session migration

- This batch covers answer, completion and retake under
  `/quiz-sessions/{sessionId}`. Each uses `ApiUserAuth`, the existing UUID validator
  and explicit success/error schemas. Routes, grading, reward transactions and
  ownership decisions are preserved.
- Request DTOs now live under `quiz/dto/`; named generated types describe answer
  bodies, the optional completion body and path parameters. The frontend combines
  generated path/body types for its answer function and removes handwritten
  completion/retake transport declarations. Its richer UI feedback model derives
  the relevant fields from the response type while retaining local display text.
- `achievements/contracts.ts` and `streak/contracts.ts` intentionally expose their
  serialized schemas for real composition in quiz completion. Nested profiles
  reuse those schemas without duplicate DTOs or importing feature-private classes.
- Verified HTTP 201 success/retry statuses, required answer feedback fields,
  omitted optional vocabulary/explanation fields, nested ISO/date-only/null values,
  completion replay and historical integer milestone values. Existing Zod decoders
  still validate persisted questions/completions. No generated runtime validator,
  HTTP client or React Query hook was introduced.
- Completion accepts an omitted body or null timezone. The DTO now represents
  that accepted null honestly; the controller normalizes it to undefined at the
  service boundary, preserving the effective stored/default timezone behavior.
- Focused real-module HTTP suites validate actual answer/completion/retake bodies
  against exported schemas with mocked persistence. The fixture does not simulate
  transaction isolation or rollback: database-backed reward tests retain those
  responsibilities and still require the dedicated test database.
- Remaining coverage: auth, dictionary, notifications, articles and the application
  root endpoint. Continue in reviewed batches and retain this broader task.
- Verification: backend CI passed (84 suites / 726 tests), frontend CI passed
  (140 suites / 712 tests), and backend production build passed. New real-module
  wire suites cover 29 cases. Typechecking, lint, formatting and both artifact
  freshness checks passed. Backend e2e: 4 passed; 17 dedicated PostgreSQL cases
  remain skipped without `QUIZ_TEST_DATABASE_URL`, so no new database-backed
  concurrency/rollback verification is claimed.
- The refreshed local read-only Swagger viewer serves all three quiz-session
  routes. No files were staged at final verification, so `check:staged` could not
  validate a selected commit snapshot; all results above cover the working tree.

## Notifications migration

- This batch covers all seven notification operations: GET/PUT preferences,
  POST/DELETE push token, test push, manual dispatch and clearing today's dispatch.
  Routes, delivery behavior, counters and production restrictions are preserved.
- Request/response DTOs now live in `notifications/dto/`. Shared device limits,
  Android/FCM allowlists and reminder-time metadata derive from backend-owned
  constants. Optional null time/title/body input is represented explicitly.
  All operations use `ApiUserAuth`, with the two production-only restriction errors
  taken from their existing definitions.
- Frontend requests import generated transport types, including acknowledgments
  and dispatch results; feature API aliases only re-export generated declarations.
  Removed the incorrect iOS option from transport typing; the existing Android
  runtime guard stays in place. Local UI preferences retain their own HH:mm type.
- Generated JSON strings are not runtime-validated. A feature-owned decoder now
  checks returned time/boolean settings before local preference hydration, without
  assertions, silent defaults or changing the shared preferences/storage contract.
- Real HTTP tests compare responses with the exported document, including
  nullable/defaulted inputs, query validation, literal acknowledgment, auth,
  production 403s, sanitized complete/partial delivery failure and normal success.
  Firebase delivery is mocked at the SDK boundary; no live push is sent.
- Offline export includes the real module but skips Firebase constructors and
  dispatch hooks. The fresh-process test blocks interval creation and Firebase/
  Google credential reads and detects attempted reads even if exceptions are
  caught. The normal Swagger HTTP test stubs the unrelated notification worker
  provider so documentation serving cannot start Firebase or background dispatch.
- Remaining coverage: auth, dictionary, articles and the application root route.
  The wider migration task remains open.
- Verification: backend CI passed (86 suites / 757 tests), frontend CI passed
  (141 suites / 725 tests), and backend production build passed. The new HTTP
  suites cover 30 cases plus one new mixed-delivery case in the SDK-boundary suite;
  the UI decoder has 13 cases. Typechecking, lint, formatting and both artifact
  freshness checks passed. Existing audit targets are recorded in
  [the application abuse audit](application-abuse-risk-audit.md).
- The refreshed local read-only Swagger viewer serves all notification routes.
  No files were staged at final verification, so `check:staged` had no selected
  commit snapshot to validate; the checks above cover the working tree.

## Development-only notification diagnostics

- The user requested keeping test push, manual dispatch and clearing today's
  dispatch record in development while omitting their routes from production.
- Moved those operations into `NotificationsDiagnosticsController` and a separate
  `NotificationsDiagnosticsModule`. Ordinary preferences/token operations and the
  background worker stay in `NotificationsModule`; the worker is not duplicated.
- Startup calls `AppModule.forEnvironment` after loading `.env`. Only development
  or an unset local environment registers diagnostics; production, test and unknown
  values omit the module. The safe bare `AppModule` also has no diagnostics.
- Runtime Swagger omits absent operations and groups installed diagnostics under
  `Notification diagnostics`. The canonical offline export explicitly includes
  diagnostic contracts for frontend debug tooling and is byte-stable across
  environment values. No second generated artifact or environment-specific schema
  list was introduced.
- Real app-composition HTTP tests verify all three production URLs return 404
  both with and without a valid token, ordinary notifications still work, and
  Swagger omits the diagnostic operations. Development tests verify the group,
  registration and required authentication. Existing direct-controller 403 safety
  checks are retained; they are separate from actual production route absence.
- Frontend debug screens remain gated by `__DEV__`; request paths, transport
  types, provider delivery behavior and normal app/session logic remain intact.
- Verification: backend CI passed (87 suites / 763 tests), frontend CI passed
  (141 suites / 725 tests), and production build passed. Five real-composition HTTP
  cases and a cross-environment export regression passed. Contract freshness and
  changed-document formatting passed. E2e: 4 passed; 17 dedicated database cases
  remain skipped without `QUIZ_TEST_DATABASE_URL`.
- The actual partial staged snapshot failed `check:staged`: only the original
  controller's operation removal was selected, without the new diagnostics module,
  updated app/catalogue/test composition or regenerated artifacts. Related tests
  and freshness checks correctly rejected that incomplete snapshot. lint-staged
  restored the original state and the staged diff hash was unchanged; no files
  were added to staging by the agent. The full working tree passes its checks.
- Refreshed and verified the local read-only Swagger viewer: all three diagnostic
  operations share `Notification diagnostics`; ordinary preferences retain their
  `notifications` tag.

## Notification folder organization

- Moved the optional diagnostics controller/module into `notifications/diagnostics/`
  along with their production-registration, direct-operation and delivery HTTP
  suites, diagnostic error definitions and exclusive dispatch-clearing response DTO.
- Shared request/response DTOs used by the production notification service remain
  in `notifications/dto/`. The single service, worker and shared HTTP test factories
  retain their existing owners; no SDK clients or background workers are duplicated.
- Updated application composition, OpenAPI coverage, error catalogue, test imports
  and documentation references. Canonical contracts and operation behavior remain
  unchanged; freshness checks pass without rewriting generated artifacts.
- Verification: backend CI passed (87 suites / 763 tests), including discovery of
  the three relocated suites and production/development route registration tests.
  Backend build, both contract freshness checks, instruction/documentation
  formatting and diff whitespace checks passed. No frontend implementation changed.
- `check:staged` still rejects the user's partial selection: the diagnostics
  controller/module, composition and test updates are not all selected together.
  The staged contract and related tests therefore see removed operations without
  their replacement controller. lint-staged restored the original working state;
  no additional files or deletions were staged by the agent.

## Dictionary migration (2026-11-03)

- Initial working tree and index were clean; the earlier auth partial-staging
  failure is historical. No files are staged automatically and no commit is made.
- All eight dictionary operations have explicit request/response metadata,
  existing statuses and operation-specific errors. Five owner operations use
  `ApiUserAuth`; embedding/similarity/quiz-option endpoints retain public access.
- Moved the aggregate request DTOs into operation-specific files under `dto/`.
  Module-owned response DTOs replace backend duplicate transport shapes;
  frontend requests import direct named generated exports and API types re-export
  them. The progress mutation's input type now matches the backend's existing
  `in_progress` restriction. Runtime hooks, caches and session logic are preserved.
- Preserved ISO dates, omitted review dates, nullable optional candidate lists,
  normalized inputs, UUID paths, optional/defaulted integer test limits, arrays,
  question format/progress enums and generation error distinctions.
- Existing word/progress/generation/embedding HTTP suites validate real success
  and error responses against exported schemas. Additional HTTP checks cover all
  protected routes' token failures, date omission and metadata. External AI/model
  and persistence boundaries stay mocked; production validation and services run.
- Added the real dictionary module to canonical coverage. Offline isolation checks
  cover its skipped embedding initialization; the Swagger UI HTTP harness replaces
  the embedding provider before app initialization to avoid model downloads.
- Review observations: the existing test-generation GET creates a quiz session;
  three embedding operations are public. These behaviors are documented and
  preserved. The repository mapper also repeats the five-answer threshold; policy
  consolidation is outside this transport migration.
- Verification: backend CI passed (94 suites / 802 tests); frontend CI passed
  (141 suites / 726 tests). Both include typecheck, lint, formatting and artifact
  freshness. Backend build, root contract freshness, instruction formatting and
  changed-document formatting passed. E2E passed four tests; 17 database-backed
  cases remain skipped without `QUIZ_TEST_DATABASE_URL`. Backend CI, build and contract freshness also passed after the final DTO
  constant-owner cleanup.
- The final index is empty, so `check:staged` has no commit snapshot to validate;
  an empty run is not recorded as a pass. Keep this task until articles, root
  coverage and the complete migration are reviewed.

## Goal

Describe the complete public HTTP API with OpenAPI and generate frontend transport
types from that document. Requests, successful responses and error responses must
share one documented wire contract instead of maintaining duplicate handwritten
backend/frontend transport models. Keep internal database/domain types private.

Use the existing NestJS/class-validator architecture as the starting point.
Introduce `@nestjs/swagger` and select a maintained TypeScript generator, with
`openapi-typescript` as the initial candidate. Do not migrate DTO validation to
Zod or introduce a shared runtime-schema package as part of this task.

## Scope and constraints

- Generate a deterministic OpenAPI JSON or YAML artifact locally from backend
  sources. JSON versus YAML is a storage-format choice; select one canonical file.
- Cover path/query parameters, bodies, authentication requirements, response
  statuses, success/partial-success payloads and application-owned error bodies.
- Define response schemas explicitly where TypeScript interfaces, unions,
  generics or inferred return types do not provide runtime Swagger metadata.
  Account for the repository's `dto.ts` filenames when configuring the CLI plugin.
- Describe serialized wire values: dates are strings, optional and nullable are
  distinct, and transformed query/body input may differ from service input.
  Preserve constraints, defaults, enum values and discriminated block unions.
- Assemble error schemas/enums from module-owned error definitions and shared
  validation rules. Retain the distinction between fixed statuses and the
  `REQUEST_REJECTED` fallback. Do not maintain another independent code list.
- Keep generated frontend files read-only. Feature-owned aliases, `Pick`/`Omit`
  types and transformations may adapt transport data for UI needs; they must not
  conceal an incorrect backend schema through assertions or manual patches.
- Retain the current HTTP client, session logic and feature ownership. Generating
  request functions or React Query hooks is optional future work, not a reason to
  replace the data layer during the type migration.
- Generated TypeScript does not provide runtime validation. Decide explicitly
  which boundaries need generated validators or separate safe decoders. Preserve
  the API error decoder's handling of unknown/malformed responses and safe fallback.
- Export the schema without listening on a port, connecting to persistence,
  reading secrets, downloading models, sending mail/push or running background
  dispatch. Provide an offline export path and verify these constraints.
- One repository enables atomic updates and CI checks; frontend production code
  must still not import backend DTO classes, Prisma models or Nest dependencies.

## Review batches

1. Inventory existing backend/frontend transport types, DTOs, response models and
   test/mock fixtures. Identify actual duplication and serialization differences.
   Propose artifact ownership and commands without migrating consumers yet.
2. Pilot one small module, for example translations. Add schema export and generate
   its frontend types. Review the document, generated output, nullable/optional
   behavior and developer workflow before expanding coverage.
3. Add deterministic generation and freshness checks to CI and the staged-snapshot
   workflow. Fail on stale/missing artifacts with an actionable regeneration command.
   Check both projects and independent backend/frontend dependency installations.
4. Describe shared errors/auth, then expand module by module in reviewable batches.
   Migrate frontend transport types and mock fixtures while preserving feature UI
   models, business behavior, permissions, retries and successful payloads.
5. Complete coverage, remove superseded transport declarations and obsolete
   generation plans, and publish lasting contributor documentation.

## Acceptance and verification

- Every supported endpoint has accurate input, success and error schemas with
  existing statuses and security requirements. Compare representative real HTTP
  responses with the generated document, including unions and partial successes.
- Frontend consumers use generated transport types, without changing generated
  files or importing backend implementation. Genuine UI/domain types stay local.
- Adding/removing a field, enum member or API error code updates the contract;
  CI rejects outdated artifacts. Repeated generation is byte-stable apart from
  normalized line endings and never embeds credentials or environment-specific URLs.
- Schema export works offline with no production credentials or external services.
- Relevant backend/frontend CI, typecheck, e2e, mock checks, documentation formatting
  and actual staged-snapshot checks pass, or pre-existing/environment failures are
  reported separately.
- Document commands, ownership, generated-file rules and runtime-validation limits
  in lasting project documentation. Delete this temporary task when complete.
