# API error contract

Status: shared backend boundaries and backend auth codes implemented; remaining
domains and frontend presentation are planned. The initial inventory covers shared boundaries and
auth only; other domains remain tracked in [the implementation task](api-error-codes.md).

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
`backend/src/auth/auth-errors.ts`, and validation rules in
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
