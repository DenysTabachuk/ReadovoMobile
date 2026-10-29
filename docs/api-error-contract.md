# API error contract

Status: shared backend boundaries, auth, streak, mascot, dictionary, achievements
and translations codes implemented. Article library, discovery/Wikipedia,
simplification, quiz and notifications non-2xx codes are implemented. The backend
completion audit, shared diagnostics and frontend presentation remain tracked in
[the implementation task](api-error-codes.md).

## Response and ownership

Application-owned non-2xx JSON responses have this shape:

```json
{
  "statusCode": 400,
  "code": "AUTH_VERIFICATION_CODE_EXPIRED",
  "message": "Verification code has expired."
}
```

`statusCode` equals the HTTP status. `code` is an explicit application identifier,
never derived from message text. `message` remains diagnostic; clients never show
it directly. No legacy-client compatibility is required. Do not return the Nest
`error` field. Messages are strings; retain HTTP statuses and applicable headers.
Success and partial-success bodies are unchanged. Optional `details` must follow
the schema for that code; auth codes below allow no details.

Backend definitions belong to their owners: shared errors in
`backend/src/common/errors/common-errors.ts`, auth errors in
`backend/src/auth/auth-errors.ts`, streak errors in
`backend/src/streak/streak-errors.ts`, mascot errors in
`backend/src/mascot/mascot-errors.ts`, dictionary errors in
`backend/src/dictionary/dictionary-errors.ts`, achievements errors in
`backend/src/achievements/achievements-errors.ts`, translations errors in
`backend/src/translations/translations-errors.ts`, article errors in
`backend/src/articles/articles-errors.ts`, notifications errors in
`backend/src/notifications/notifications-errors.ts`, and validation rules in
`backend/src/common/validation/create-validation-exception.ts`.
`backend/src/api-error-catalogue.ts` collects module definitions for contract
tooling; its test rejects duplicate public codes. `common` does not import auth
or the catalogue. Callers pass a definition to the shared exception class:
`new ApiException(AUTH_ERRORS.CREDENTIALS_INVALID)`.
`REQUEST_REJECTED` is a shared template with no fixed status; the filter supplies
the original exception's HTTP status. Validation definitions require field details.

Cross-project schema/type generation is deferred to
[OpenAPI contract generation](openapi-contract-generation.md), which covers the
entire HTTP API. Do not introduce a separate `contracts/api-errors.json` generator
as part of this task. Future OpenAPI error schemas must use these module-owned
definitions, validation details and allowed statuses. Generated files will remain
read-only, with freshness checks in CI.

For the current frontend migration, use small explicit decoding/presentation maps
for supported behaviors, verify code/status/details combinations with focused
contract tests, and avoid asserting that handwritten client types exhaust all
backend codes. Unknown codes still receive safe fallback behavior. Feature maps
own translation keys and actions. Replace duplicated transport metadata when the
OpenAPI task reaches the corresponding module.

Backend API owners maintain serialization and common codes; feature owners maintain
domain entries, endpoint tests and presentation maps together. Adding a code is
additive; changing its meaning is forbidden. Removing a code requires a separate
supported-client review.

## Shared boundaries

The following mappings are implemented and covered by HTTP tests in
`backend/src/common/configure-api-boundaries.spec.ts`. Details are absent except
for validation. Auth test IDs below are covered by
`backend/src/auth/auth-errors.spec.ts`, including direct service tests for
safeguards blocked by DTO validation. Repositories, mail and Google are mocked;
controllers, services, JWT verification, guards, DTO validation and filters are real.

| Test ID | Boundary / current behavior                                               | Status          | Proposed code       | Client behavior                                           |
| ------- | ------------------------------------------------------------------------- | --------------- | ------------------- | --------------------------------------------------------- |
| B01     | Global DTO pipe; Nest message array                                       | 400             | `VALIDATION_FAILED` | Known field/rule feedback; localized form fallback        |
| B02     | Express malformed JSON; parser diagnostic                                 | 400             | `REQUEST_MALFORMED` | Generic invalid-request feedback                          |
| B03     | Express body exceeds the existing 2 MB limit                              | 413             | `REQUEST_TOO_LARGE` | Localized size feedback                                   |
| B04     | Unknown route or unsupported method; Nest not-found message               | 404             | `ROUTE_NOT_FOUND`   | Feature fallback; distinct from a missing domain resource |
| B05     | Unclassified deliberate HTTP exception                                    | Existing status | `REQUEST_REJECTED`  | Feature fallback; never guess a domain cause from status  |
| B06     | Unhandled service, repository or provider exception; generic Nest failure | 500             | `INTERNAL_ERROR`    | Localized generic failure; no automatic write retry       |

There is no application rate limiter registered in `AppModule` or `main.ts`.
Infrastructure-generated responses may have no JSON contract; use the client
fallback. Do not introduce rate limits or change method routing in this task.
Inventory any explicit domain 429 responses with their owning module later.

Install serialization at the application boundary, including parser failures.
Recognized application exceptions retain their code and allowlisted details.
Unclassified HTTP exceptions retain status and use a generic safe message;
never forward arbitrary exception objects. Unexpected errors return the safe
500 response. Provider/configuration/database internals do not become details.
Preserve diagnostic context in protected logs with credential redaction.

`REQUEST_REJECTED` is a boundary safeguard, not completion of a domain migration:
every deliberate domain branch still needs an inventoried code and HTTP test.
Production and `app.e2e-spec.ts` use `configureApiBoundaries` with the same parser
limits, validation and serialization. Unexpected errors currently log a safe
generic event only; richer redacted diagnostic logging remains follow-up work.

## Validation details

Validation returns `message: "Request validation failed."` and these details:

```json
{
  "fields": [
    { "path": ["email"], "rule": "EMAIL_INVALID" },
    { "path": ["blocks", 0, "text"], "rule": "STRING_REQUIRED" },
    { "path": [], "rule": "PROPERTY_NOT_ALLOWED" }
  ]
}
```

This object is the `details` of `VALIDATION_FAILED`. Paths contain only declared
DTO property names and numeric array indices. An unknown property is reported at
its nearest declared parent, with `PROPERTY_NOT_ALLOWED`; do not echo an arbitrary
submitted property name. Root validation uses `[]`. Never serialize validation
targets, submitted values, constraint messages or arbitrary decorator arguments
into details. Preserve current transforms, whitelist policy and first-error policy;
do not promise a complete list or stable ordering of all violated rules.

Map validator metadata explicitly, independently of English constraint messages:

| Validator metadata                                       | Public rule                                                                        |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `isDefined`, `isNotEmpty`                                | `VALUE_REQUIRED`                                                                   |
| `isString`, `isInt`, `isBoolean`, `isArray`              | `STRING_REQUIRED`, `INTEGER_REQUIRED`, `BOOLEAN_REQUIRED`, `ARRAY_REQUIRED`        |
| `isEmail`, `isUuid`, `isUrl`, `isTimeZone`, `isDateOnly` | `EMAIL_INVALID`, `UUID_INVALID`, `URL_INVALID`, `TIMEZONE_INVALID`, `DATE_INVALID` |
| `minLength`, `maxLength`, `min`, `max`                   | `STRING_TOO_SHORT`, `STRING_TOO_LONG`, `NUMBER_TOO_SMALL`, `NUMBER_TOO_LARGE`      |
| `arrayMaxSize`, `arrayNotEmpty`                          | `ARRAY_TOO_LARGE`, `ARRAY_EMPTY`                                                   |
| `isIn`, `matches`, `matchesProperty`                     | `VALUE_NOT_ALLOWED`, `FORMAT_INVALID`, `FIELDS_DO_NOT_MATCH`                       |
| `whitelistValidation`                                    | `PROPERTY_NOT_ALLOWED`                                                             |
| Unmapped constraint / invalid nested value               | `VALUE_INVALID`                                                                    |

Unknown rules, unknown form paths and invalid details use the form fallback.
Only known form fields receive inline messages. Add limits or related-field
metadata later only if a UI requires them and the schema explicitly allows them.
Test B01 with nested objects, arrays, unknown properties and secret sentinel values.

## Auth inventory

Source owners: `backend/src/auth/auth.controller.ts`, `auth.service.ts`,
`jwt.service.ts`, `user-auth.guard.ts`, `current-user.decorator.ts`, auth DTOs,
repositories and `email-verification.service.ts`. All routes below use POST under
`/auth`. Before migration, errors used Nest's `{statusCode, message, error}` shape.
DTO failures now use the shared string message and typed details and occur before
the service branches below.
The table records previous wording to identify branches, not a compatibility
requirement. Auth now emits the listed codes; other unmigrated domains still use
`REQUEST_REJECTED` with the original status and a generic message.

Test IDs identify the coverage in `auth-errors.spec.ts`. Reachable branches use HTTP tests;
service safeguards blocked by DTO validation use unit tests plus an HTTP test of
the corresponding DTO rejection. Rows with multiple branches require a case for
each branch, including equivalent public outcomes.

| Test ID | Route / branch                                                                                       | Current status and message                                                                               | Proposed code                    | UI intent                                                |
| ------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------- |
| A01     | Every auth route: DTO rejection                                                                      | 400 / validation array                                                                                   | `VALIDATION_FAILED`              | Field feedback, not a guessed domain error               |
| A02     | `login`: malformed email or empty password, service safeguard                                        | 400 / Email and password are required.                                                                   | `VALIDATION_FAILED`              | Form fallback                                            |
| A03     | `login`: unknown user or wrong password                                                              | 401 / Email or password is invalid.                                                                      | `AUTH_CREDENTIALS_INVALID`       | `auth.errors.invalidCredentials`; no refresh             |
| A04     | `register`, `resend-verification-code`, `request-password-reset`: invalid email safeguard            | 400 / Email is invalid.                                                                                  | `VALIDATION_FAILED`              | Email feedback                                           |
| A05     | `register`, `reset-password`: short password / confirmation mismatch safeguards                      | 400 / Password must be at least 8 characters. / Passwords do not match.                                  | `VALIDATION_FAILED`              | Password / confirmation feedback                         |
| A06     | `register`, `resend-verification-code`, `verify-email`: existing user                                | 409 / User with this email already exists.                                                               | `AUTH_EMAIL_ALREADY_EXISTS`      | `auth.errors.emailAlreadyExists`                         |
| A07     | `resend-verification-code`, `verify-email`: no pending registration                                  | 400 / No pending registration found.                                                                     | `AUTH_REGISTRATION_NOT_PENDING`  | `auth.errors.pendingRegistrationNotFound`                |
| A08     | `verify-email`: invalid email/code format safeguard or wrong code                                    | 400 / Verification code is invalid.                                                                      | `AUTH_VERIFICATION_CODE_INVALID` | `auth.errors.invalidOrExpiredVerificationCode`           |
| A09     | `verify-email`: expired code                                                                         | 400 / Verification code has expired.                                                                     | `AUTH_VERIFICATION_CODE_EXPIRED` | Same UI as A08                                           |
| A10     | `google`: missing token safeguard                                                                    | 400 / Google id token is required.                                                                       | `VALIDATION_FAILED`              | Form fallback                                            |
| A11     | `google`: provider HTTP rejection / wrong audience / unverified or absent email                      | 401 / Google id token is invalid. / Google id token audience is invalid. / Google email is not verified. | `AUTH_GOOGLE_IDENTITY_REJECTED`  | `auth.errors.googleSignInFailed`; no refresh             |
| A12     | `refresh`: missing token safeguard / malformed token user ID / no active match / missing user        | 401 / Refresh token is required. / Refresh token is invalid.                                             | `AUTH_REFRESH_REJECTED`          | Clear only initiating session; never refresh recursively |
| A13     | `verify-password-reset-code`: invalid format safeguard / absent request / wrong code                 | 400 / Verification code is invalid.                                                                      | `AUTH_RESET_CODE_INVALID`        | `auth.errors.invalidOrExpiredVerificationCode`           |
| A14     | `verify-password-reset-code`: expired code                                                           | 400 / Verification code has expired.                                                                     | `AUTH_RESET_CODE_EXPIRED`        | Same UI as A13                                           |
| A15     | `reset-password`: invalid input safeguard / incomplete or absent request / wrong token / absent user | 400 / Password reset request is invalid.                                                                 | `AUTH_RESET_REQUEST_INVALID`     | `auth.errors.resetPasswordInvalidOrExpired`              |
| A16     | `reset-password`: expired request                                                                    | 400 / Password reset request has expired.                                                                | `AUTH_RESET_REQUEST_EXPIRED`     | Same UI as A15                                           |
| A17     | Guard: missing or malformed Bearer header; CurrentUser: absent verified identity                     | 401 / Authorization bearer token is required. / Authenticated user is required.                          | `AUTH_AUTHENTICATION_REQUIRED`   | Session recovery once on authenticated client            |
| A18     | JWT: missing segments / bad signature / invalid payload                                              | 401 / Access token is invalid.                                                                           | `AUTH_ACCESS_TOKEN_INVALID`      | Session recovery once on authenticated client            |
| A19     | JWT: expired token                                                                                   | 401 / Access token has expired.                                                                          | `AUTH_ACCESS_TOKEN_EXPIRED`      | Session recovery once on authenticated client            |
| A20     | Guard: route user differs from authenticated user                                                    | 403 / Authenticated user does not match route user.                                                      | `AUTH_OWNERSHIP_DENIED`          | Feature denial fallback; no refresh                      |
| A21     | Any auth repository failure, SMTP failure, Google transport failure or unexpected provider data      | 500 / Internal server error                                                                              | `INTERNAL_ERROR`                 | Operation fallback; no public infrastructure reason      |

Service validation safeguards may omit details when field attribution is ambiguous.
Keep their current HTTP status; validation uses a string message throughout.
For A11, provider HTTP failures currently map to 401 regardless of provider status;
retain that behavior. Google payloads and JWT claims are validated at runtime.
Null/absent Google data and truthy non-string email values retain a safe 500;
primitive/array identity responses retain 401. No raw provider details are returned.
Repository uniqueness races currently surface as generic 500 errors; translating
them to 409 would require a separate status/business decision.

`request-password-reset` for an unknown account remains a successful response with
the same shape as for a known account. Missing SMTP configuration currently logs
and returns successfully; do not invent a public failure for that branch. No new
codes distinguish missing accounts from invalid credentials/reset requests.

## Streak inventory

All routes are guarded and derive the owner from the JWT. Paths below are relative
to `/streak/profile/me`. Domain errors allow no details. Existing HTTP statuses
and safe diagnostic messages are retained; only the stable codes are added.
Frontend behavior in this table is the intended mapping for its later migration.

| Route / branch                                                                                                 | Status | Code                                | Intended UI                                   | Contract test                                                        |
| -------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| GET profile, GET calendar/month, POST activity-completed, restore, freeze, freeze-token/purchase: missing user | 404    | `STREAK_USER_NOT_FOUND`             | Feature fallback; no token refresh            | `streak-profile.http.spec.ts`, missing-user cases for all six routes |
| Profile balance lookup after the user disappears                                                               | 404    | `STREAK_USER_NOT_FOUND`             | Feature fallback                              | `streak-profile.http.spec.ts`, disappearing user                     |
| Calendar: future month                                                                                         | 400    | `STREAK_CALENDAR_MONTH_UNAVAILABLE` | Calendar fallback                             | `streak-profile.http.spec.ts`, future month                          |
| Calendar: invalid year/month; freeze: invalid date                                                             | 400    | `VALIDATION_FAILED`                 | Known field feedback or feature fallback      | DTO cases in profile/freeze HTTP suites                              |
| POST restore: price differs from 100                                                                           | 400    | `STREAK_RESTORE_PRICE_INVALID`      | `streak.errors.restoreFailed`                 | `streak-balance.http.spec.ts`, stale/manipulated restore price       |
| POST restore: no restorable break                                                                              | 400    | `STREAK_RESTORE_UNAVAILABLE`        | `streak.errors.restoreFailed`                 | `streak-balance.http.spec.ts`, no restorable break                   |
| POST restore or freeze-token/purchase: insufficient balance                                                    | 400    | `STREAK_NOT_ENOUGH_COINS`           | `streak.errors.notEnoughCoins`                | `streak-balance.http.spec.ts`, both operations; no charge            |
| POST freeze: no tokens                                                                                         | 400    | `STREAK_NO_FREEZE_TOKENS`           | `streak.errors.noFreezeTokens`                | `streak-freeze.http.spec.ts`, empty token balance                    |
| POST freeze: completed/frozen/restored date                                                                    | 400    | `STREAK_DAY_ALREADY_PROTECTED`      | `streak.errors.dayAlreadyProtected`           | `streak-freeze.http.spec.ts`, all three statuses                     |
| POST freeze: date has no missed history                                                                        | 400    | `STREAK_FREEZE_ONLY_MISSED_DAY`     | `streak.errors.freezeOnlyMissed`              | `streak-freeze.http.spec.ts`, no missed-day history                  |
| POST freeze: three freezes already used in the break                                                           | 400    | `STREAK_FREEZE_DAY_LIMIT_REACHED`   | `streak.errors.freezeDayLimitReached`         | `streak-freeze.http.spec.ts`, fourth frozen day                      |
| POST freeze-token/purchase: price differs from 100                                                             | 400    | `STREAK_FREEZE_TOKEN_PRICE_INVALID` | `streak.errors.purchaseFreezeFailed`          | `streak-balance.http.spec.ts`, stale/manipulated purchase price      |
| POST freeze-token/purchase: three tokens already owned                                                         | 400    | `STREAK_FREEZE_TOKEN_LIMIT_REACHED` | `streak.errors.freezeLimitReached`            | `streak-balance.http.spec.ts`, full inventory                        |
| Persistence failure or invalid stored broken-streak data                                                       | 500    | `INTERNAL_ERROR`                    | Feature fallback; no raw internal diagnostics | `streak-profile.http.spec.ts`, database and malformed-state cases    |

`streak.controller.spec.ts` retains existing endpoint authentication, ownership and
DTO coverage. New HTTP suites exercise real controllers, services, JWT guards and
the production boundary configuration, replacing only Prisma persistence. Their
small shared setup is local to streak; the broader test-infrastructure migration
remains a separate task.

Calendar year/month and freeze-date structure are validated once in the request
DTOs. The controller is their only production service caller; the service is not
exported from `StreakModule`. Business constraints such as future months, prices,
balance and freeze limits remain in the service. HTTP tests cover invalid ranges,
non-integer and missing calendar values and invalid dates before persistence.

Activity timezone is validated and trimmed in its DTO; the service does not
repeat the timezone check. Omitted or optional null timezone preserves the stored
zone, while profile creation defaults to UTC. `streak-timezone.http.spec.ts` covers
these cases and rejects malformed timezone values before persistence.
No provider calls or partial-success delivery payloads belong to this module.
`completeActivity` returns the existing `{ streak }` success shape.

The earlier `STREAK_FREEZE_WINDOW_EXPIRED` proposal has no corresponding branch
in the current service: freezing an old missed day is not explicitly rejected by
age. Do not publish this code or add a time-window business rule during this
migration. Resolve the intended policy separately before implementing that code.

## Mascot inventory

Routes below are relative to `/mascot/profile/:userId`. The JWT guard enforces
route ownership before DTO validation. Domain errors allow no details and retain
their existing HTTP statuses and safe messages. UI mappings are intended for the
later frontend migration; no frontend text comparison is migrated in this batch.

| Route / branch                                                | Status    | Code                                                     | Intended UI                                                     | Contract test                                                          |
| ------------------------------------------------------------- | --------- | -------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| POST items/:itemId/buy or equip: unknown catalog item         | 400       | `MASCOT_ITEM_UNKNOWN`                                    | Buy/equip fallback                                              | Purchase and equipment HTTP suites, unknown-item cases                 |
| POST items/:itemId/buy: insufficient coins                    | 400       | `MASCOT_NOT_ENOUGH_COINS`                                | `mascot.errors.notEnoughCoins`                                  | `mascot-purchase.http.spec.ts`, insufficient coins without mutations   |
| POST items/:itemId/equip: known item not owned                | 400       | `MASCOT_ITEM_NOT_OWNED`                                  | `mascot.errors.itemNotOwned`                                    | `mascot-equipment.http.spec.ts`, unowned item                          |
| GET profile, POST buy/equip, DELETE slots/:slot: missing user | 404       | `MASCOT_USER_NOT_FOUND`                                  | Feature fallback; no token refresh                              | `mascot-profile.http.spec.ts`, all four routes                         |
| DELETE slots/:slot: unknown slot                              | 400       | `VALIDATION_FAILED`                                      | `mascot.errors.clearFailed`                                     | `mascot-equipment.http.spec.ts`, slot DTO rejection before persistence |
| POST buy/equip: blank item ID                                 | 400       | `VALIDATION_FAILED`                                      | Known field feedback or operation fallback                      | `mascot-profile.http.spec.ts`, both routes                             |
| Missing JWT or another route owner                            | 401 / 403 | `AUTH_AUTHENTICATION_REQUIRED` / `AUTH_OWNERSHIP_DENIED` | Shared auth handling; ownership denial must not trigger refresh | `mascot-profile.http.spec.ts`, guard cases                             |
| Unexpected persistence exception                              | 500       | `INTERNAL_ERROR`                                         | Feature fallback; no raw database diagnostics                   | `mascot-profile.http.spec.ts`, persistence failure                     |

`MascotItemParamsDto` and `ClearMascotSlotParamsDto` are defined in
`mascot/dto.ts`, sharing only the domain-independent `UserIdParamsDto` base.
Slot membership is validated once by `ClearMascotSlotParamsDto`; `clearSlot` has
only a controller caller and `MascotModule` does not export the service. The
redundant service slot assertion is removed. Catalog existence and ownership are
business checks and remain in the service. A malformed route owner normally
fails the guard's ownership comparison before the UUID DTO check; this ordering
is unchanged.

Purchasing an already-owned item stays a successful response without another
charge. Equip and clear keep their response bodies and existing stored-profile
field fallbacks. The HTTP suites cover purchase success, both equipment slots,
both clear operations and profile reads with real controllers/services/guards and
production boundaries. Only Prisma persistence is mocked through a small local
test-app factory.

If the user disappears after the initial existence check, the current purchase
flow treats the missing balance row as zero and returns 400 insufficient coins.
The contract test preserves this outcome; changing it to 404 requires a separate
behavior decision. Existing purchase writes are not transactional, so concurrency
and partial-write guarantees are also outside this error-code migration.

## Dictionary word-operation inventory

This batch covers word creation/listing/deletion, manual progress and answer
submission under `/api/dictionary/me`. JWT identity supplies the owner; another
user's word is indistinguishable from an absent word. Domain codes allow no details.
Existing statuses, safe diagnostic messages and success payloads are preserved.

| Route / branch                                                                       | Status | Code                             | Intended UI                                     | Contract test                                                  |
| ------------------------------------------------------------------------------------ | ------ | -------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| POST words: phrase exceeds five words                                                | 400    | `DICTIONARY_WORD_TOO_LONG`       | Known phrase-length feedback                    | `dictionary-words.http.spec.ts`, phrase limit                  |
| POST words: atomic insert reports a duplicate                                        | 400    | `DICTIONARY_WORD_ALREADY_EXISTS` | Duplicate-word feedback without message parsing | `dictionary-words.http.spec.ts`, duplicate insert              |
| DELETE words/:wordId: no owned word found                                            | 404    | `DICTIONARY_WORD_NOT_FOUND`      | Feature fallback / refresh list                 | `dictionary-words.http.spec.ts`, missing word                  |
| PATCH words/:wordId/progress: missing word at lookup or update                       | 404    | `DICTIONARY_WORD_NOT_FOUND`      | Feature fallback / refresh list                 | `dictionary-progress.http.spec.ts`, both missing-word branches |
| POST test/answer: missing word at lookup or review update                            | 404    | `DICTIONARY_WORD_NOT_FOUND`      | Answer fallback / refresh dictionary            | `dictionary-answers.http.spec.ts`, both missing-word branches  |
| Invalid create payload, word UUID, progress or answer fields                         | 400    | `VALIDATION_FAILED`              | Known field feedback or operation fallback      | DTO cases in the three HTTP suites                             |
| Unexpected persistence failure, including insert failures not reported as duplicates | 500    | `INTERNAL_ERROR`                 | Feature fallback; no raw database diagnostics   | `dictionary-words.http.spec.ts`, persistence failure           |

The five-word phrase policy remains a service business rule. Its constant is
shared by the service and error definition within dictionary. Progress membership
is validated once by `UpdateDictionaryWordProgressDto`; the service method's only
production caller is the controller, so its duplicate check is removed.

Word-operation HTTP suites use real controllers, services, guards and production error boundaries
with a typed repository mock and unused embedding dependency stub. Existing unit
checks retain atomic duplicate detection and phrase-policy coverage. An empty list
remains HTTP 200; correct and incorrect answers remain HTTP 201 with `isCorrect`.
Manual progress reset retains the existing learned-word counter limit.

Dictionary does not currently perform a separate user-existence check: list reads
can return an empty array, and database exceptions remain generic 500 failures.
Do not add a missing-user domain code or change those outcomes in this migration.

### Dictionary generation and embeddings

These paths are implemented with the following codes. Domain errors allow no
details. Existing statuses are preserved, including the 400 embedding-dimension
failure; the migration does not reclassify it as a provider 5xx failure.

| Route / branch                                                                   | Status | Code                                          | Contract test                                                |
| -------------------------------------------------------------------------------- | ------ | --------------------------------------------- | ------------------------------------------------------------ |
| GET me/test: dictionary has no words                                             | 400    | `DICTIONARY_TEST_NO_WORDS`                    | Generation HTTP suite, no words                              |
| GET me/test: no review candidates                                                | 400    | `DICTIONARY_TEST_NO_REVIEW_CANDIDATES`        | Generation HTTP suite, no candidates/default limit           |
| GET me/test: invalid limit                                                       | 400    | `VALIDATION_FAILED`                           | Generation HTTP suite, invalid query limits                  |
| GET me/test: missing provider key or repository failure                          | 500    | `INTERNAL_ERROR`                              | Generation HTTP suite, configuration and repository cases    |
| GET me/test: SDK request failure                                                 | 502    | `DICTIONARY_TEST_GENERATION_FAILED`           | Generation HTTP suite, SDK rejection                         |
| GET me/test: empty provider content                                              | 502    | `DICTIONARY_TEST_GENERATION_EMPTY`            | Generation HTTP suite, empty/whitespace output               |
| GET me/test: invalid JSON or invalid questions container                         | 502    | `DICTIONARY_TEST_GENERATION_INVALID_RESPONSE` | Generation HTTP suite, invalid JSON/null/primitive/container |
| GET me/test: missing questions or unusable distractors                           | 502    | `DICTIONARY_TEST_GENERATION_INCOMPLETE`       | Generation HTTP suite, missing/malformed/duplicate cases     |
| POST embedding, similar-words, quiz-options: invalid request text/candidate list | 400    | `VALIDATION_FAILED`                           | Embedding HTTP suite, target and candidate DTO cases         |
| POST similar-words or quiz-options: invalid vector dimensions                    | 400    | `DICTIONARY_EMBEDDINGS_INVALID`               | Embedding HTTP suite, empty and mismatched vectors           |
| POST quiz-options: fewer than three distinct distractors                         | 400    | `DICTIONARY_QUIZ_DISTRACTORS_INSUFFICIENT`    | Embedding HTTP suite, absent/insufficient candidates         |
| Model request failure                                                            | 500    | `INTERNAL_ERROR`                              | Embedding HTTP suite, failed model request                   |

`dictionary-test-generation.http.spec.ts` exercises real HTTP/service parsing with
the Groq SDK boundary mocked. `dictionary-embeddings.http.spec.ts` uses the real
embedding service, lifecycle, cache and similarity algorithms with TensorFlow and
the model loader mocked. No tests download a model or call a live provider.

Limit type/range/default (10) are owned by `DictionaryTestQueryDto`; the service
does not repeat query clamping. Each candidate must contain non-whitespace text
in the request DTO. Blank candidates still return 400, now before model access;
the redundant internal text-required check is removed.

Similar-word requests with an omitted, empty or optional null list still succeed
with `[]`. Insufficient quiz options remain a 400 business failure. Embedding
responses remain arrays; generation still supports plain/fenced/prose-wrapped
JSON and translation/reverse-translation/cloze formats. HTTP tests preserve these
success contracts without depending on shuffled option order.

AI catch handlers retain deliberate application codes. The parser treats decoded
JSON as unknown and narrows its shape without assertions. Provider error payloads,
raw AI output and configuration details are excluded from responses and newly
touched log paths; missing configuration gets a generic 500 public message.

The embedding/related-option routes remain public; authenticated test generation
retains its existing JWT guard. Model initialization failures that prevent server
startup are not public API responses. Existing tensor cleanup after a failed
`array()` call is a separate resource-management concern; this migration does not
change its lifecycle or add recovery/retry policy.

## Achievements inventory

Both routes are guarded and check the JWT against the route owner. Domain errors
allow no details. The only deliberate service error is a missing user; no reward,
balance, permission or success-payload behavior is changed by this migration.

| Route / branch                                                       | Status    | Code                                                     | Intended UI                                           | Contract test                                              |
| -------------------------------------------------------------------- | --------- | -------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| GET profile/:userId: user absent while reading progress              | 404       | `ACHIEVEMENTS_USER_NOT_FOUND`                            | Feature fallback; no token refresh                    | `achievements-profile.http.spec.ts`, missing user          |
| PATCH profile/:userId/progress: user absent before the update        | 404       | `ACHIEVEMENTS_USER_NOT_FOUND`                            | Feature fallback; no token refresh                    | `achievements-profile.http.spec.ts`, missing user on PATCH |
| PATCH progress: user disappears before the refreshed profile is read | 404       | `ACHIEVEMENTS_USER_NOT_FOUND`                            | Feature fallback                                      | `achievements-progress.http.spec.ts`, disappearing user    |
| Invalid/empty progress update                                        | 400       | `VALIDATION_FAILED`                                      | Known field feedback or form fallback                 | Progress HTTP suite, field constraints and empty body      |
| Missing JWT / different route owner                                  | 401 / 403 | `AUTH_AUTHENTICATION_REQUIRED` / `AUTH_OWNERSHIP_DENIED` | Shared auth behavior; no refresh for ownership denial | Profile HTTP suite, guard cases                            |
| Unexpected persistence/transaction error                             | 500       | `INTERNAL_ERROR`                                         | Feature fallback; no raw database diagnostics         | Profile HTTP suite, failed progress query                  |

`UpdateProgressDto` owns integer/range checks. Its only production service caller
is the controller; the service no longer repeats truncation/clamping. Omitted or
optional null fields retain current values, while a supplied zero remains zero.
The HTTP tests cover both cases through real DTO/controller/service/filter paths.
Profile reads still calculate learned words from dictionary persistence, and the
existing reward unit tests retain automatic-claim and no-double-award coverage.

The existing endpoint still accepts client-supplied balance and quiz counters.
That known issue is tracked in [Server-side quiz rewards](server-side-quiz-rewards.md)
and remains separate from API error codes; do not silently change permissions or
reward rules in this migration.

## Translations inventory

`POST /api/translations/word` remains public. Module-owned definitions live in
`translations/translations-errors.ts`; domain errors allow no details. Request
formats and limits remain in `TranslateWordDto`.

| Branch                                                                                                | Status | Code                          | Intended UI                                |
| ----------------------------------------------------------------------------------------------------- | ------ | ----------------------------- | ------------------------------------------ |
| Provider rejects with an HTTP response                                                                | 502    | `TRANSLATIONS_REQUEST_FAILED` | Translation fallback; no auth recovery     |
| Missing, blank or malformed translation data in a decoded response                                    | 502    | `TRANSLATIONS_UNAVAILABLE`    | Translation fallback                       |
| Missing API key                                                                                       | 500    | `INTERNAL_ERROR`              | Generic translation fallback               |
| Network/timeout failure without a provider HTTP response, invalid provider JSON or unexpected failure | 500    | `INTERNAL_ERROR`              | Generic translation fallback               |
| Invalid request fields                                                                                | 400    | `VALIDATION_FAILED`           | Known field feedback or operation fallback |

`translations-provider.http.spec.ts` covers these branches using the real module,
DTOs, service, outbound Axios parsing/interceptors and production API boundaries.
Only the Axios network adapter is mocked; no requests reach Google. Exact public
bodies exclude provider payloads, request URLs, credentials and the Nest `error`
field. Provider status codes do not become auth errors for this public endpoint.

Decoded provider data is validated with the module-owned
`GoogleTranslateResponseSchema` before accessing the first translation. Additional
provider metadata and unused translation entries are ignored. Wrong field types
consistently follow the unavailable-translation
502 branch rather than causing accidental type errors. Malformed JSON rejected by
the transport and network failures retain their existing generic 500 status.
Missing configuration also uses a generic public message.

Success remains HTTP 201 with the existing payload, trimming, default languages,
entity decoding and cache behavior. Existing service unit tests retain contextual
marker extraction and fallback coverage; error serialization cases move to the
HTTP suite. This migration does not change context matching or retry policies.

## Article library inventory

This inventory covers saved/recent library routes only. Discovery/Wikipedia is
covered below, along with AI adaptations/summaries and quizzes.
Article-owned definitions live in `articles/articles-errors.ts`; the library's
missing-user error allows no details.

| Route / branch                                                  | Status    | Code                                                     | Contract test                                 |
| --------------------------------------------------------------- | --------- | -------------------------------------------------------- | --------------------------------------------- |
| GET api/users/:userId/articles/saved: user absent               | 404       | `ARTICLES_USER_NOT_FOUND`                                | Library errors suite, missing user            |
| POST api/users/:userId/articles/saved: user absent              | 404       | `ARTICLES_USER_NOT_FOUND`                                | Library errors suite, missing user            |
| DELETE api/users/:userId/articles/saved/:articleId: user absent | 404       | `ARTICLES_USER_NOT_FOUND`                                | Library errors suite, missing user            |
| GET api/users/:userId/articles/recent: user absent              | 404       | `ARTICLES_USER_NOT_FOUND`                                | Library errors suite, missing user            |
| POST api/users/:userId/articles/recent: user absent             | 404       | `ARTICLES_USER_NOT_FOUND`                                | Library errors suite, missing user            |
| User disappears before a mutation's refreshed list is read      | 404       | `ARTICLES_USER_NOT_FOUND`                                | Library errors suite, refreshed response      |
| Missing JWT / different route owner, on every library route     | 401 / 403 | `AUTH_AUTHENTICATION_REQUIRED` / `AUTH_OWNERSHIP_DENIED` | Library errors suite, access cases            |
| Invalid article payload or numeric article route parameter      | 400       | `VALIDATION_FAILED`                                      | Library requests suite, DTO cases             |
| Unexpected persistence failure                                  | 500       | `INTERNAL_ERROR`                                         | Library errors suite, failed saved-list query |

Missing users receive a feature fallback, without auth refresh. Ownership denials
use shared auth presentation; validation uses known field feedback or an operation
fallback. Unexpected errors never expose persistence diagnostics.

`library/article-library-errors.http.spec.ts` owns failure and access contracts;
`library/article-library-requests.http.spec.ts` owns request validation and success
regressions. Both use a narrowly owned app factory with real controller, facade,
library service, JWT guard and production API boundaries. Persistence is mocked;
unused discovery/AI dependencies are stubs and never contact external services.

DTOs already own the article body and numeric parameter checks, so no validation
is moved or duplicated. Empty lists and deletion of an absent saved article remain
HTTP 200; save/recent writes remain HTTP 201. Saved fields/timestamps, upsert
identity and the recent-list retention limit of 50 are preserved. Mutations retain
their existing post-write list read and missing-user outcome; this migration does
not introduce transaction or concurrency changes.

## Article discovery and Wikipedia inventory

Public discovery/detail routes retain their existing statuses and success bodies.
Definitions live in `articles/articles-errors.ts` and allow no details. Request
formats/ranges remain owned by the existing article DTOs.

| Route / branch                                                                     | Status | Code                                     | Contract test                                  |
| ---------------------------------------------------------------------------------- | ------ | ---------------------------------------- | ---------------------------------------------- |
| GET articles, articles/random or articles/:id: Wikipedia JSON HTTP rejection       | 502    | `ARTICLES_WIKIPEDIA_REQUEST_FAILED`      | Wikipedia errors suite, JSON HTTP failures     |
| Recommended/category-search fallback HTTP rejection                                | 502    | `ARTICLES_WIKIPEDIA_REQUEST_FAILED`      | Wikipedia errors suite, fallback cases         |
| GET articles/:id: Wikipedia HTML HTTP rejection                                    | 502    | `ARTICLES_WIKIPEDIA_HTML_REQUEST_FAILED` | Wikipedia errors suite, HTML failure           |
| Detail metadata absent, blank title, missing URL, or requested page absent         | 502    | `ARTICLES_WIKIPEDIA_ARTICLE_UNAVAILABLE` | Wikipedia errors suite, absent metadata        |
| Detail HTML has no usable content or is not a string                               | 502    | `ARTICLES_WIKIPEDIA_CONTENT_UNAVAILABLE` | Wikipedia errors suite, unusable HTML          |
| Decoded Wikipedia JSON fails its runtime schema                                    | 502    | `ARTICLES_WIKIPEDIA_INVALID_RESPONSE`    | Wikipedia errors suite, malformed decoded JSON |
| Transport failure without an HTTP response or malformed JSON rejected by transport | 500    | `INTERNAL_ERROR`                         | Wikipedia errors suite, transport cases        |
| Persistence failure while attaching available adaptations                          | 500    | `INTERNAL_ERROR`                         | Wikipedia requests suite, persistence failure  |
| Invalid list/detail query or article ID                                            | 400    | `VALIDATION_FAILED`                      | Wikipedia requests suite, DTO cases            |

Provider failures use an article-operation fallback without auth recovery, even
when Wikipedia itself responds 401/403/404. Validation uses known field feedback
or an operation fallback. No raw provider payload or URL is exposed.

`discovery/wikipedia-errors.http.spec.ts` owns failure serialization;
`discovery/wikipedia-requests.http.spec.ts` owns DTO and success contracts. The
shared test app keeps the facade, discovery service, library adaptation attachment,
HTML parser, formula renderer and production Axios parsing/interceptors real.
Network I/O and adaptation persistence are mocked; fixtures contain no formulas
and do not start MathJax or AI providers.

`WikipediaResponseSchema` validates decoded provider data and supplies inferred
provider types within discovery. It permits unrelated metadata and missing/null
query/pages, preserving empty discovery results. Detail requests still fail with
502 when no matching usable page exists. Wrong field types are rejected with a
deliberate 502 instead of accidental runtime errors. Missing/blank HTML retains
the existing content-unavailable status. The schema adds no coercion or new input
restrictions to request DTOs.

Preview payloads, tokenized detail blocks and plain content remain unchanged.
Existing article unit tests retain discovery filtering, recommendations, formula
rendering and fallback behavior. AI operations have separate inventories below.

## Article simplification inventory

`POST /api/articles/simplify` remains public. Adaptation and summary use the same
orchestrator; domain definitions live in `articles/articles-errors.ts` and allow
no details. Existing input formats and limits remain in `SimplifyArticleDto`.

| Branch                                                         | Status | Code                              | Contract coverage                                                                                            |
| -------------------------------------------------------------- | ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Cache miss and missing provider key                            | 500    | `INTERNAL_ERROR`                  | Simplify errors HTTP suite, configuration                                                                    |
| Initial simplification cache read fails                        | 500    | `INTERNAL_ERROR`                  | Simplify errors HTTP suite, cache read                                                                       |
| Provider-client failure, including rejected JSON/schema output | 502    | `ARTICLES_SIMPLIFICATION_FAILED`  | Simplify errors HTTP suite, client failures; existing service/client unit tests retain real parsing coverage |
| Semantic validation still fails after one retry                | 502    | `ARTICLES_SIMPLIFICATION_FAILED`  | Simplify errors HTTP suite, retry exhaustion                                                                 |
| Cache write fails inside generation                            | 502    | `ARTICLES_SIMPLIFICATION_FAILED`  | Simplify errors HTTP suite, cache write                                                                      |
| Defensive empty adaptation result after generation             | 502    | `ARTICLES_ADAPTATION_UNAVAILABLE` | Existing orchestrator guard; normal empty model output is rejected earlier by semantic validation            |
| Defensive empty summary result after generation                | 502    | `ARTICLES_SUMMARY_UNAVAILABLE`    | Existing orchestrator guard; normal empty model output is rejected earlier by semantic validation            |
| Invalid text, level, transformation type or article ID         | 400    | `VALIDATION_FAILED`               | Simplify requests HTTP suite, DTO cases                                                                      |

Generation/planning/chunk-processing failures within the existing catch boundary
use `ARTICLES_SIMPLIFICATION_FAILED`. Deliberate `ApiException` codes are preserved.
Provider/configuration failures use an operation fallback without auth refresh;
validation uses known field feedback or a form fallback. Error handlers no longer
serialize arbitrary error messages or stacks into logs. Internal configuration
messages are also excluded from public responses.

`transformation/article-simplify-errors.http.spec.ts` owns error serialization;
`transformation/article-simplify-requests.http.spec.ts` owns DTO/success behavior.
Their test app uses real HTTP boundaries, facade, adaptation orchestrator, token
planning, semantic retry runner, validators and cache services. A fresh typed
`GroqTextClient` mock supplies validated output/client failures, and persistence
is mocked. SDK JSON/schema parsing stays covered by existing Groq client and
article service unit tests; these HTTP suites do not claim to exercise the SDK.
No live AI requests are made.

Existing success status (201), default A2 level, default summary operation, titles,
block/question payloads, source hashing, chunking and cache policy are preserved.
A cache hit still succeeds without a provider key. Existing chunk/formula tests
remain intact. No retry, token-budget, transaction or persistence-recovery policy
is added. Standalone quiz endpoints have their own inventory below.

Known input-validation follow-up: `SimplifyArticleDto.blocks` currently validates
only that the value is an array; nested block structure is not checked there.
This batch does not tighten that existing request contract. Address it separately
with a supported block schema and explicit malformed-block HTTP tests.

## Article quiz inventory

Both `POST /api/articles/quiz` and `POST /api/articles/vocabulary-quiz` remain
public. Domain definitions live in `articles/articles-errors.ts` and allow no
details. DTO constraints, prompts, question policies and semantic retry counts
are unchanged.

| Route / branch                                                                        | Status | Code                                         | Contract coverage                                           |
| ------------------------------------------------------------------------------------- | ------ | -------------------------------------------- | ----------------------------------------------------------- |
| Either quiz: missing provider key                                                     | 500    | `INTERNAL_ERROR`                             | Both quiz HTTP suites, configuration cases                  |
| Reading quiz: provider/client/schema, planning or exhausted semantic retry failure    | 502    | `ARTICLES_QUIZ_GENERATION_FAILED`            | Reading HTTP suite, client failures and retry exhaustion    |
| Vocabulary quiz: provider/client/schema, planning or exhausted semantic retry failure | 502    | `ARTICLES_VOCABULARY_QUIZ_GENERATION_FAILED` | Vocabulary HTTP suite, client failures and retry exhaustion |
| Invalid text, level or reading target length                                          | 400    | `VALIDATION_FAILED`                          | Both quiz HTTP suites, DTO cases                            |

Generation failures use an operation fallback without auth refresh. Missing
configuration uses the generic server fallback; validation uses known field
feedback or a form fallback. Catch handlers preserve deliberate `ApiException`
codes and log only a fixed diagnostic category, without original provider error
messages, raw output or stack traces. Upstream AI telemetry also records only
fixed `contract_error`/`provider_error` categories and a safe exception event.
`infrastructure/ai.telemetry.spec.ts` verifies that original rejections propagate,
spans close and raw messages/stacks are omitted, including non-Error rejections.

`quiz/article-reading-quiz.http.spec.ts` and
`quiz/article-vocabulary-quiz.http.spec.ts` keep the flows separate. Their shared,
typed quiz app factory uses real controllers/facade, quiz service, token planning,
prompt generation, semantic retry runner and validators. Each app has a fresh
`GroqTextClient` mock supplying validated outputs or client errors; SDK JSON/schema
parsing remains covered by existing client/service unit tests. Tests neither
connect to persistence nor call live providers.

Success stays HTTP 201: reading returns `{ questions }`, vocabulary returns
`{ questions, resolvedLevel }` with the existing term, translation and option-ID
normalization. Requested vocabulary level still takes precedence over the model
level. Reading defaults remain A2/short. Both flows still retry once for semantic
violations and may succeed with the corrected result. No SDK retry, token-budget,
representative-excerpt or question-count policy is changed.

## Notifications inventory

All seven `/notifications` routes retain `UserAuthGuard`. Six user-ID routes also
check route ownership. Manual dispatch has no route user ID; in non-production it
remains available to any authenticated user. This migration adds no permissions.
Definitions live in `notifications/notifications-errors.ts` and allow no details.

| Route / branch                                                            | Status | Code                                     | Contract coverage                                  |
| ------------------------------------------------------------------------- | ------ | ---------------------------------------- | -------------------------------------------------- |
| POST learning-reminders/dispatch: production restriction                  | 403    | `NOTIFICATIONS_MANUAL_DISPATCH_DISABLED` | Operations HTTP suite, production dispatch         |
| DELETE learning-reminders/dispatch/today/:userId: production restriction  | 403    | `NOTIFICATIONS_DISPATCH_CLEAR_DISABLED`  | Operations HTTP suite, production clearing         |
| Missing JWT on any route                                                  | 401    | `AUTH_AUTHENTICATION_REQUIRED`           | Access HTTP suite, all seven routes                |
| Different owner on any user-ID route                                      | 403    | `AUTH_OWNERSHIP_DENIED`                  | Access HTTP suite, all six owner routes            |
| Invalid preferences, push-token fields, device-ID query or test-push body | 400    | `VALIDATION_FAILED`                      | Preferences, push-token and operations HTTP suites |
| Unexpected persistence failure                                            | 500    | `INTERNAL_ERROR`                         | Preferences, push-token and operations HTTP suites |

Production-operation restrictions use operation feedback without token refresh.
Validation uses known field feedback or a form fallback; persistence failures use
a generic operation fallback. There is no explicit user-existence check in these
services, so database failures remain generic 500 errors rather than acquiring an
invented missing-user code.

HTTP coverage is split into `notifications-access.http.spec.ts`,
`notifications-preferences.http.spec.ts`, `notifications-push-token.http.spec.ts`
and `notifications-operations.http.spec.ts`. Their shared factory creates real
controllers/services, JWT guards, DTO validation and production error boundaries
with fresh narrow persistence mocks. Firebase discovery defaults to unavailable
before credentials are read. The separate delivery suite uses a caller-owned local
Firebase app and mocks its `send()` method; no provider requests or credential
lookups are allowed.
App closure clears the real service's dispatch interval. Production/test environment
changes and logger spies are restored by their owning suites.

Success bodies and statuses are unchanged: preferences return HTTP 200 with the
existing default reminder time; token registration returns 201 `{ ok: true }`,
deactivation remains idempotent HTTP 200, development clearing returns 200 with
`deletedCount`, and development dispatch/test pushes return 201 with counters.
No-token and unavailable-Firebase test pushes remain delivery outcomes, including
the existing `failureReasons` field, rather than becoming non-2xx API failures.
DTOs already own request constraints; no validation is moved or duplicated.

Controller catch logs no longer include payloads, partial push tokens or original
error stacks. Delivery counters are logged without repeating `failureReasons`.
Delivery and initialization catch handlers now log fixed categories without tokens,
SDK messages/stacks, unknown codes or credential-file paths. The module-owned
`resolveFcmFailure` utility returns only controlled delivery messages:

- Exact `messaging/invalid-registration-token` and
  `messaging/registration-token-not-registered` codes produce
  `Push token is invalid or no longer registered.` and still deactivate the token.
- Every other SDK rejection produces `Push delivery failed.` without deactivation.
- Unavailable Firebase retains the existing controlled
  `Firebase Admin SDK is not configured.` message without deactivation.

`failureReasons` remains a string array and counters/statuses are unchanged, but
raw Firebase codes/messages are no longer copied into it. Unknown codes are neither
logged nor stringified. The frontend currently displays these strings without
matching their contents; localized structured delivery feedback remains separate
from the non-2xx error decoder.

`notifications-delivery.http.spec.ts` verifies safe HTTP feedback and logs,
deactivation for both known invalid-token codes, fallback for unknown/non-string
codes, startup warning redaction, successful delivery and token deduplication.
Each case owns its local Firebase app, SDK send spy and Nest app; all are cleaned
up afterward. Background-job failure handling, SDK retries and dispatch scheduling
remain unchanged.

## Backend migration audit

The completion audit covers auth, streak, mascot, dictionary, articles,
achievements, translations, notifications and the root controller, along with
shared HTTP parsing, filters and guards. Explicit domain HTTP failures use owned
`ApiException` definitions collected by `API_ERROR_CATALOGUE`. No remaining legacy
Nest domain exceptions were found in production controllers/services.

The remaining `HttpException` construction belongs to the body-parser fallback;
the global filter supplies `REQUEST_REJECTED` while retaining its status. Internal
SDK, AI budget/schema/semantic, persistence and date/JSON utility errors remain
internal: owning request handlers map them to domain failures or the global filter
returns `INTERNAL_ERROR`. Bootstrap failures and scheduled dispatch failures do not
become HTTP error responses. There is no configured HTTP rate limiter to migrate.

Notification partial successes retain their documented counters and safe delivery
feedback. AI trace status/exception events and notification diagnostics are
redacted. Existing SMTP fallback credential logging is a separate known issue,
not permission to add raw diagnostics elsewhere. Richer safe server diagnostics
can be improved separately; their absence does not block client decoding.

This is a source/automated-contract audit, not a claim of live-provider or mobile
release verification. Frontend decoding, session actions, feature presentation,
mock API fixtures and final cross-project checks remain in the current task.
OpenAPI/type generation remains explicitly deferred to its own task.

## Frontend presentation and session actions

The user chose a minimal shared HTTP boundary rather than a full wire decoder.
`HttpError` exposes the actual HTTP `status` and optional `code` extracted only
when the response is a non-array object with a string code. Unknown strings are
preserved without interpretation; missing or non-string codes remain undefined.
Backend messages never become `Error.message`, and Axios config is not retained.
The existing private response-body access remains available to current consumers.

There is no client-wide code/status registry or universal details validator in
this batch. Screens/hooks select meaningful known codes and use localized
fallbacks otherwise. A consumer validates the details it actually uses. Auth
interceptors must inspect the relevant code/status pairs before refresh/session
decisions, because those interceptors run before final error normalization.

`api/httpError/index.spec.ts` covers string and unknown codes, malformed/missing
codes, non-object bodies, immutable input and safe error messages.
`api/utils/createHttpClient/index.spec.ts` verifies code propagation through Axios
rejection normalization. Legacy feature wrappers that replace `HttpError` remain
for later migration; auth/session handling is implemented as described below.

Request functions return data and propagate errors. Feature presentation at the
screen/hook feedback boundary resolves code to a known translation key and action;
then translates once. Shared presentation handles transport failures and generic
fallbacks. Stop transporting translation keys inside `Error.message`. Native Google
SDK failures retain their separate SDK-owned handling.

Only HTTP 401 with A17-A19 (`AUTH_AUTHENTICATION_REQUIRED`,
`AUTH_ACCESS_TOKEN_INVALID`, `AUTH_ACCESS_TOKEN_EXPIRED`) on the authenticated
client initiates single-flight refresh and one retry, retaining session-version
guards. Before shared error normalization, the interceptor reuses `HttpError` to
read the optional string code. Credential, Google, refresh, ownership
and domain denials do not trigger refresh. An unknown/malformed/absent code also
does not trigger refresh. Only HTTP 401 with `AUTH_REFRESH_REJECTED` clears the
initiating session after a refresh response; other failures surface without
deleting tokens. Missing local refresh tokens retain the existing local session
cleanup behavior. This replaces clearing on every refresh HTTP failure;
network failures and stale-session cancellation retain their existing protection.
Cancellation remains silent. Transport timeout/network errors remain separate
from backend codes. Preserve query and offline replay retry policies.

Successful refresh bodies must contain two non-empty string tokens before they
can be committed; malformed success responses reject without replacing tokens.
This local check replaces an unchecked `as AuthTokens` assertion, without adding
a general decoder or token-format validation. Pending refresh entries are still
released after every outcome so a later request can recover from temporary errors.

`features/auth/session/api/errorCodes.spec.ts` covers eligible codes, credential/
Google/refresh/unknown/missing/non-string codes, wrong HTTP statuses and integrated
refresh failures. `refreshAuthSession/errorCodes.spec.ts` covers token retention,
temporary-error recovery and malformed successful bodies. The existing colocated
`index.spec.ts` suites retain concurrency, one-retry, logout and cross-account
isolation checks, now with explicit backend codes in their failure fixtures.
Delayed HTTP 500 refresh failures from an obsolete account also remain AbortError
on authenticated requests. No feature UI, locale, query retry or offline replay
behavior is migrated in this batch.

## Deployment compatibility

Decision confirmed by the user: there are no existing users, so no legacy client
or server compatibility is needed. Deploy backend first. Do not implement a legacy
text/status adapter or preserve obsolete response fields.

| Combination                                                          | Required behavior / test                                                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Updated client + updated backend                                     | Codes drive presentation/actions; changing message wording has no effect                                |
| Updated client + legacy backend                                      | Unsupported deployment combination; missing code gives localized fallback and no inferred auth recovery |
| Updated client + unknown, empty, malformed code or non-JSON response | Localized fallback; no message matching, code display or guessed action                                 |
| Updated client + known code with invalid details/status combination  | Safe fallback; never act on unvalidated metadata                                                        |

Deployment owners must verify backend contract readiness before client release.
Published client versions and the backend deployment identifier still need to be
recorded at release; repository package versions do not establish rollout state.

## Follow-up outside this batch

- Complete frontend migration, mock fixtures and release verification before
  marking the API error-code task complete.
- OpenAPI/type generation is tracked separately in
  [OpenAPI contract generation](openapi-contract-generation.md) and is not a
  prerequisite for current client decoding. Do not add an error-only generator.
- Existing SMTP fallback logs verification codes with email addresses. Track a
  separate credential-logging fix; preserve successful response semantics here.
