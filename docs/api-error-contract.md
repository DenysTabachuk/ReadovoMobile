# API error contract

Status: shared backend boundaries, auth, streak, mascot and dictionary codes
implemented. Other domains and frontend presentation remain tracked in
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
`backend/src/dictionary/dictionary-errors.ts`, and validation rules in
`backend/src/common/validation/create-validation-exception.ts`.
`backend/src/api-error-catalogue.ts` collects module definitions for contract
tooling; its test rejects duplicate public codes. `common` does not import auth
or the catalogue. Callers pass a definition to the shared exception class:
`new ApiException(AUTH_ERRORS.CREDENTIALS_INVALID)`.
`REQUEST_REJECTED` is a shared template with no fixed status; the filter supplies
the original exception's HTTP status. Validation definitions require field details.

Generate the planned cross-project `contracts/api-errors.json` artifact and
backend/frontend declarations and runtime validators from these owned definitions,
including per-code details schemas and allowed statuses. Add a CI freshness check;
do not maintain an independent code list in the frontend or edit generated data.
Feature presentation maps own translation keys and actions, not wire definitions.
This file explains the contract and UI intent; generated catalogue tables should
replace hand-maintained status/schema tables when generation is implemented.

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

## Frontend presentation and session actions

Normalize once in shared HTTP handling into a safe error with status, recognized
code and validated details. Track code presence separately from recognition.
The auth interceptor needs the same wire decoder before its refresh decision,
because it runs before final HTTP sanitization. Never retain raw Axios config.

Request functions return data and propagate errors. Feature presentation at the
screen/hook feedback boundary resolves code to a known translation key and action;
then translates once. Shared presentation handles transport failures and generic
fallbacks. Stop transporting translation keys inside `Error.message`. Native Google
SDK failures retain their separate SDK-owned handling.

Only A17-A19 on the authenticated client may initiate single-flight refresh and
one retry, retaining session-version guards. Credential, Google, refresh, ownership
and domain denials do not trigger refresh. An unknown/malformed/absent code also
does not trigger refresh. Only explicit `AUTH_REFRESH_REJECTED` clears a session
after a refresh response; other failures surface safely without deleting tokens.
This intentionally replaces today's clearing on every refresh HTTP failure;
network failures and stale-session cancellation retain their existing protection.
Cancellation remains silent. Transport timeout/network errors remain separate
from backend codes. Preserve query and offline replay retry policies.

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

- Complete the domain inventories before marking delivery step 1 complete.
- Complete redacted internal diagnostics and cross-project contract generation
  before marking the shared-boundary delivery step complete.
- Existing SMTP fallback logs verification codes with email addresses. Track a
  separate credential-logging fix; preserve successful response semantics here.
