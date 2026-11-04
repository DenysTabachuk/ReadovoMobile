# OpenAPI contract and frontend transport types

The canonical document covers all 51 application controller operations:
translations, achievements, mascot, streak, quiz sessions, notifications,
auth, dictionary and articles. It includes three development notification
diagnostics operations. Production registers 48 operations and omits those
three diagnostics from its runtime Swagger document. Swagger UI assets and the
raw document are served separately by `SwaggerModule`.
The transport-type migration is complete. Backend DTO metadata owns the contract;
frontend consumers use the checked-in generated types.

## Viewing the API

Start the backend normally, then open `http://localhost:3000/api/docs` (adjust the
port if configured). A deployed backend serves the same page at `/api/docs` on its
own origin. Swagger UI assets are served locally. The raw document is available at
`/api/docs-json`. Translations is currently public. Achievements requires the
existing access token: use **Authorize** and enter the JWT without a `Bearer`
prefix. Swagger sends `Authorization: Bearer <token>` for secured operations.
The security declaration documents the existing guard; it does not install one.
Swagger's **Try it out** sends real requests to the backend and may contact the
translation provider or persistence. Normal backend startup still requires its usual services.

## Ownership and artifacts

Auth operations issue or recover credentials and do not require an existing
Bearer access token (`security: []`). This does not bypass credential checks:
login accepts a password, Google login an ID token, refresh a refresh token, and
verification/reset operations their codes or reset credentials. All nine routes
retain their existing HTTP 201 success status. Session responses share
`AuthSessionResponse`; code-delivery acknowledgments share
`VerificationCodeDeliveryResponse`. Email-only and email/code bodies share
`AuthEmailRequest` and `VerifyAuthCodeRequest`. Feature aliases preserve familiar
operation names without duplicating their transport fields.

Session expiry and user creation dates are required ISO date-time strings, not
JavaScript `Date` objects or nullable values. Public user responses omit stored
password hashes and salts. Passwords are not trimmed; email input is trimmed and
lowercased. Password-confirmation equality remains a runtime class-validator
rule, described in OpenAPI rather than falsely represented as a static field
constraint. Password-reset requests preserve the same acknowledgment for missing
and existing accounts. Generated types do not validate received JSON; refresh
response checks, token storage/session guards and existing UI decoders remain.

Backend modules own request DTOs, path/query parameters, success schemas, error
definitions, statuses and authorization. Existing NestJS/class-validator validation
remains authoritative at runtime. Explicit Swagger decorators describe DTOs and
serialized responses; generation does not depend on the Swagger CLI plugin or
file suffix discovery.

- `backend/src/translations/dto/translate-word.dto.ts`: accepted request body and validation.
- `backend/src/translations/dto/translate-word-response.dto.ts`: serialized success body.
- `backend/src/translations/translations.controller.ts`: route, operation ID,
  public access, success status and reachable errors.
- `backend/src/translations/translations-errors.ts`: module-owned errors.
- `backend/src/common/errors/common-errors.ts` and the validation rule mapping:
  shared boundary errors and validation details. OpenAPI derives codes from these
  definitions; there is no second manually maintained code catalogue.
- `backend/src/openapi`: document composition and isolated offline export.
- `backend/openapi/openapi.json`: canonical generated OpenAPI 3 JSON, checked in.
- `frontend/api/generated/transport.d.ts`: generated transport types, checked in.
  Never edit generated artifacts manually.

Public OpenAPI schema names generate direct `TranslateWordRequest` and
`TranslateWordResponse` exports via openapi-typescript's root-type options. Requests
import these generated names; feature API barrels may re-export them. The generated
`operations` map remains available for endpoint/status-specific typing.
UI/domain models stay in their features. Frontend production
code must not import backend DTOs, NestJS or Prisma. The HTTP client, React Query
hooks and auth/session behavior remain independently maintained.

## Generation and freshness

From the repository root, after installing backend and frontend dependencies:

```sh
npm run contracts:generate
npm run contracts:check
```

The first command updates the JSON and TypeScript artifacts. The second compares
generated content in memory with checked-in files; it does not rewrite them. Missing
or stale files fail with the regeneration command. Object keys are sorted; arrays
retain order, output has no timestamp or environment-specific server URL, and
freshness checks normalize CRLF/LF line endings.

The backend-only `npm --prefix backend run openapi:check` requires no frontend
installation. The frontend-only `npm --prefix frontend run api-types:check` consumes
the checked-in JSON without backend dependencies. CI runs these separately.
The root staged workflow runs both through `contracts:check` after typechecking.
It uses lint-staged's hidden working-tree changes to verify the selected commit
snapshot. Stage source changes and regenerated artifacts together; unstaged fixes
do not repair a stale staged contract.

`backend/src/openapi/documented-modules.ts` owns the canonical coverage list,
including development diagnostic contracts needed by the frontend debug tools.
Runtime Swagger scans only modules actually registered in that application;
production omits the notification diagnostics module and its three operations.
Export imports all listed real modules explicitly, independent of `NODE_ENV`,
and creates a Nest application with `preview: true`; it does not duplicate controller
lists or substitute service bindings. Preview skips DI constructors and factories
by default. Export does not import `AppModule`, call `app.init()` or listen on a port.
No database, provider credentials, mail, push or jobs are needed.

The unused NestJS root greeting (`GET /`) was removed. Requests to `/` receive
HTTP **404** with the shared `ROUTE_NOT_FOUND` JSON error. The frontend has no
caller, and no replacement health endpoint is registered.

`openapi/api-coverage.spec.ts` scans the real development/production application
in preview mode without the coverage allowlist and compares every registered
controller path/method with the canonical export. It checks unique operation IDs,
explicit security and documented success content. The separate fresh-process
export isolation test still prohibits importing `AppModule`, environment-file or
secret reads, network/listening and background intervals.

The export root also registers the real global `PrismaModule` to satisfy feature
module dependencies. Preview skips its database adapter constructor and lifecycle
hooks. The offline ts-node loader maps generated Prisma `.js` imports back to their
`.ts` sources; it does not build or start the backend.

Preview is not a sandbox: JavaScript at import time still runs, including static
dynamic-module registration, and modules can opt into initialization during preview.
Before adding a real module to the coverage list, review these behaviors and run
the isolation tests. A fresh-process test guards against network/listening, `.env`
reads and relevant secret reads before importing application code. Tests also verify
that production service/controller initialization is skipped and that normal
development Swagger UI and offline export produce the same document. Production
registration tests verify its smaller runtime document and absent diagnostic URLs.

## Adding or changing an endpoint

1. Define inputs in the accepting module's class-validator DTOs. Document defaults,
   transforms, limits and nullable/optional semantics with Swagger decorators.
   Add explicit path/query metadata when relevant.
   Keep DTOs in the owning module's `dto/` directory, with operation-specific
   filenames such as `translate-word.dto.ts` for input and
   `translate-word-response.dto.ts` for the serialized success response.
2. Define a module-owned serialized response schema. Interfaces, inferred return
   types and unions do not supply sufficient runtime metadata. Describe dates as
   ISO strings and specify `date`/`date-time` where appropriate. Describe unions and
   enum values explicitly from their owning definitions.
   Give public request/response schemas intentional names with `@ApiSchema`, such
   as `TranslateWordRequest` and `TranslateWordResponse`; these become direct
   generated type exports rather than exposing backend class naming conventions.
   When embedding another module's response, reuse its intentional public schema
   exports (for example `achievements/contracts.ts` and `streak/contracts.ts`). Do
   not copy the shape, move it to `common`, or import another module's private DTOs.
   These backend composition exports must never be imported by frontend code.
3. Document status, operation ID, security and reachable errors on the controller.
   For operations protected by `UserAuthGuard`, use the auth-owned method decorator
   `@ApiUserAuth({ validation: true, errors: [...] })` and import `AuthModule` in the
   feature module. It installs the real guard, documents Bearer security and adds
   missing/invalid/expired token errors alongside shared HTTP errors. Supply only
   operation-specific errors; omit `validation` when there is no DTO validation.
   Do not stack `ApiErrorResponses` on the same method: pass all operation errors
   through `ApiUserAuth` so responses sharing a status (including 401) are grouped
   once. This decorator does not enforce ownership or roles.
   For public operations or a different authentication boundary, use
   `@ApiErrorResponses({ validation: true, errors: [...] })` with existing,
   explicitly selected operation error definitions. The decorator adds shared
   malformed-body, oversized-body and internal errors automatically. Set
   `validation: true` only when DTO validation can reject the request; it defaults
   to false. Guards and service error branches are not inferred. This decorator
   describes the installed global HTTP boundaries and does not handle exceptions.
   Its `apiErrorResponses` helper derives schemas from the definitions.
   `VALIDATION_FAILED` requires
   field details; `REQUEST_REJECTED` retains a variable status and is documented as
   the fallback rather than assigned a new fixed status. The fallback is also
   included in explicit error-status schemas because OpenAPI's `default` response
   does not apply to a status that already has an explicit response.
4. Add HTTP contract tests with production validation/serialization and mocked
   external boundaries. Compare wire responses and metadata, including errors and
   missing/null values. Extend offline/UI tests for newly included modules.
5. Run generation, migrate actual frontend consumers to generated transport types,
   remove superseded transport declarations, and retain domain/UI adaptations.
6. Run freshness checks, both project checks and documentation formatting. Include
   source, generated files and related fixtures in the same staged snapshot.

## Wire semantics and runtime validation

Translations currently returns HTTP **201**. Omitted languages default to `en` and
`uk`; explicit null languages fail validation. The supported directions are owned
by `SUPPORTED_TRANSLATION_PAIRS` in the translations module, currently only
`en -> uk`. Source/target enums are derived from that policy, and a DTO validator
checks the complete pair before any provider call. Reverse, same-language and
unknown directions return `400 VALIDATION_FAILED`. OpenAPI `oneOf` branches describe
the same pair restrictions, including effective defaults for omitted request fields.
To add a direction, update that policy, regenerate contracts and extend the tests;
do not independently widen two language lists. Frontend hooks use generated language
types and leave defaults to the backend. Strings are trimmed and languages lowercased
before validation. Unknown request properties are rejected. Swagger constraints
describe the normalized input; they do not implement those transformations.

Context may be omitted, null, empty or a string. The response preserves null;
undefined context and unavailable contextual translation fields are omitted during
JSON serialization. Required response fields remain strings.

Achievements returns HTTP **200** and reads the owner from the verified token,
not a client-supplied user ID. Its `claimedAt` and `unlockedAt` fields are always
present: ISO date-time strings for stored dates, or null when absent. Achievement
IDs are an enum derived from the backend's `ACHIEVEMENT_IDS` list. Missing,
invalid and expired tokens return documented **401** errors; a deleted/missing
user returns **404**. Credential endpoint contracts are documented separately without Bearer security.

Mascot operations require Bearer authentication. Profile reads and slot clearing
return HTTP **200**; purchases and equipping return **201**, including purchasing
an already owned item. All return `MascotProfileResponse`. `equippedItems` is
always present; its `eyes` and `head` properties are optional strings, never null.
Empty slots are omitted from JSON. `ownedItemIds` contains strings and may be
empty. Database timestamps and legacy equipped-item columns are not exposed.
Path parameters are required: `itemId` is trimmed and must be nonempty; `slot`
is trimmed and must match the backend-owned `eyes`/`head` enum. Catalog membership,
ownership and balance are checked by the service and documented as distinct 400
errors alongside DTO validation. Catalog IDs remain strings rather than a fixed
transport enum, preserving the existing service boundary and stored legacy IDs.

Streak operations require Bearer authentication. Profile/calendar reads return
HTTP **200**; restore, freeze and token purchase return **201** with `StreakState`.
The monthly calendar requires integer `month` (1–12) and `year` (1970–2100) query
parameters. The DTO converts query text to numbers; the service rejects future
months separately. Freeze accepts a required `date` body field, trims it and
validates an actual `YYYY-MM-DD` date. Unknown query/freeze-body properties are
rejected. Restore and token purchase have no request DTO: prices come from backend
policy, and existing unused JSON body fields do not override them.

Activity/calendar dates, `brokenAt` and `lastActivityDate` are date-only strings.
`serverNow` and non-null achievement `claimedAt` values are ISO date-time strings.
Break details, last activity and claim timestamps are required fields that may be
null. The break object-or-null schema is explicit rather than inferred from the
TypeScript union. Status enums and numeric milestones are backend-owned and
generated for frontend consumers. Existing persisted-data decoders are retained.

Quiz answer, completion and retake operations require Bearer authentication and
a UUID `sessionId` path parameter. All return HTTP **201**, including successful
answer/completion retries. The answer body requires `questionId` and 1–20 unique
`selectedOptionIds`, with existing 200-character identifier limits. IDs are not
trimmed. Membership and single/multiple-choice rules remain service checks rather
than DTO constraints. Feedback always includes `isCorrect`, `correctOptionIds`
and `newlyUnlockedAchievementIds`; missing explanation/vocabulary fields are
omitted rather than null. Unknown body properties are rejected by DTO validation.

Quiz completion accepts an optional body with an optional nullable IANA `timezone`.
The existing validator trims and checks the timezone; null and omission retain
the stored timezone. This semantic IANA validation is not provided by generated
TypeScript or fully encoded in an OpenAPI string schema. Completion returns saved
score/reward totals, a `replayed` flag and fresh achievement/streak profiles using
their existing public schemas. Persisted completion decoding is preserved;
historical unlocked milestones remain integer arrays rather than being narrowed
to today's milestone enum. Retake returns only a new `sessionId`. Foreign and
missing sessions both return `QUIZ_SESSION_NOT_FOUND`; answer conflicts and
incomplete/completed sessions retain their existing operation-specific 409 errors.

Notification operations require Bearer authentication. Preferences use GET/PUT
with HTTP **200**; PUT requires `learningRemindersEnabled` and optionally accepts
nullable `learningReminderTime`. HH:mm strings are trimmed and validated; omitted
or null time resets to the backend default `19:00`, including existing settings.
The generated response time remains a string. Before hydrating local preferences,
the feature validates the response and narrows it to its local HH:mm UI type;
malformed successful responses reject instead of being asserted into that type.

Push registration accepts only Android FCM tokens, with the existing device/token
length limits. It returns HTTP **201** with `{ "ok": true }`. Token deactivation
requires a trimmed `deviceId` query and returns **200** with the same acknowledgment.
Test push accepts an optional body; nullable/omitted/empty title and body use the
existing server defaults. It returns **201** with all delivery counters and safe
`failureReasons`, including zero tokens, complete delivery failure and partial
delivery. Those reasons are diagnostics rather than an API error-code catalogue.

Test push, manual reminder dispatch and clearing today's dispatch record belong
to `NotificationsDiagnosticsModule` under `notifications/diagnostics/`, grouped as **Notification diagnostics** in
Swagger. Manual dispatch returns **201** counters, and clearing returns **200**
with `deletedCount`. These operations require an ordinary user token; manual
dispatch processes all eligible users.

`main.ts` loads backend environment files before selecting
`AppModule.forEnvironment(process.env.NODE_ENV)`. Only `development` or an unset
environment (local development) installs diagnostics. Production, test and unknown
environment values do not register those three routes: they return **404**, with
or without a token, and are absent from runtime Swagger. Regular notification
preferences/token routes and the normal background reminder worker are retained.
The two older in-controller production **403** safety checks remain for direct
diagnostics mounting or environment changes; they are not the production boundary.
Frontend diagnostic types remain in the single canonical artifact, and the existing
debug screen remains gated by `__DEV__`.

Offline notification export skips Firebase initialization and dispatch intervals.
Isolation tests block relevant Firebase/Google credential reads and background
intervals before importing application code, and record attempted secret reads
even if a constructor's catch block would suppress the thrown guard error.

Dictionary word list/create/delete/progress and test generation require Bearer
security through `ApiUserAuth`. List, delete, progress and test return HTTP **200**;
word creation returns **201**. Embedding, similar-word and quiz-option POST routes
remain public and return **201** arrays, including an empty similar-word result.
The migration preserves these existing access boundaries.

Dictionary word dates are ISO date-time strings. `createdAt` is required;
`lastReviewedAt` is omitted when absent, never null. Progress and test question
format enums are backend-owned. Manual progress updates accept only
`in_progress`; learning remains controlled by quiz answers. Word IDs are trimmed
UUID path parameters. Test `limit` is an optional integer query from 1 to 10,
defaulting to 10; generation may create a session despite using GET, preserving
the existing route. Word/context/translation strings are trimmed and validated;
the five-word phrase limit and duplicate/missing-word errors remain service rules.

Public candidate lists accept omission, null or empty arrays. Entries must contain
non-whitespace text, and arrays contain at most 1000 entries. No candidates means
an empty similar-word result or the existing insufficient-distractors error for
quiz options. The schema documents validation and model/provider failure bodies
without adding new runtime validation. Existing embedding algorithms, AI response
checks, HTTP client, hooks and session handling remain independently maintained.
Offline preview skips the embedding service constructor and lifecycle hooks;
export never loads the TensorFlow model. The Swagger HTTP test replaces that
provider to avoid downloads when it initializes the documentation-only app.

Articles discovery, detail, adaptation availability and simplification remain
public. Saved/recent library operations and both quiz-generation routes require
`ApiUserAuth`. GET/DELETE responses are HTTP **200**; all article POST successes
retain **201**. Saved/recent writes return the updated list, not a single article.
`savedAt`/`openedAt` are required ISO date-time strings. Unavailable thumbnails,
page lengths, adaptation lists and quiz explanations are omitted rather than null.

Article content is a discriminated union of heading, paragraph, list, table,
formula and image blocks. Explicit discriminator mappings preserve wire literals
such as `heading`, rather than DTO/schema class names. Nested inline `text`/`word`
nodes, table cells, formula SVG/MathML/LaTeX and optional styling retain their
existing shapes. AI output contracts and parser domain models remain independently
owned; generated transport types do not replace their runtime validation.

Article list query enums and numeric limits are backend-owned. ID lists use
comma-separated query values (`style: form`, `explode: false`), with deduplication
before validation. Repeated string query values fail the existing integer-array
validation. Detail accepts only `languageCode=en`, defaulting to English. Discovery
limits are 1?50; omission retains the service default of 20. Adaptation lookups
accept 1?100 positive IDs and return a map of article ID strings to availability
arrays. Global DTO validation rejects unknown query/body fields where a DTO exists.

Simplification accepts nullable optional article ID, blocks, level, title and
transformation type. Null/omitted level and transformation type retain the existing
A2/summary defaults. Blank/null/omitted titles use the existing fallback. Source
`blocks` currently validates only the array container, so its generated request
items remain `unknown`; this batch does not claim nested runtime validation.
Response blocks are fully described by the content union. Nullable request enums
include null explicitly without weakening the shared non-null response enums.

Reading quiz input requires level and target length; vocabulary quiz level is
optional/nullable. Both accept A1?C1 on the backend. The current frontend picker
remains A1?B2 through a local `Exclude` type, while returned C1 data stays typed.
Quiz-generation responses expose session IDs and public questions, with no answer
keys, explanations or vocabulary words. Attempt feedback continues to supply those
through the existing quiz contract. Simplification may include answer-bearing
summary questions, described separately as `ArticleQuizAnswerKeyQuestion`.
HTTP clients, hooks, auth/session behavior and the existing quiz-response decoder
remain unchanged apart from generated type consumption. Offline preview skips
Groq client construction, tokenizer allocation and formula renderer initialization;
no article requests or AI jobs run during export.

Generated TypeScript is compile-time information, **not runtime validation**.
Axios generics do not validate JSON. The existing API error decoder and its safe
unknown/malformed-response fallback remain in place, as does validation of external
translation provider responses. Existing transport tests may intentionally return
malformed bodies to exercise this boundary. UI must not display diagnostic server
messages directly. Infrastructure failures can have a different body and need the
same defensive fallback. Generating runtime validators, clients or hooks is outside
this migration.

## Separate runtime follow-ups

Transport migration is complete at the controller boundary. Existing runtime
improvements remain separate changes:

- Validate nested source `blocks` and stored simplification blocks, levels and
  questions rather than relying on the current container checks/assertions.
- Resolve whether `fetchRandomWikipediaArticles` should call the random route or
  intentionally retain normal discovery/recommendation behavior.
- Consolidate the dictionary repository's repeated learning-answer threshold with
  its existing service policy.

These follow-ups do not require changing generated transport declarations by hand.
