# Task: project-wide API error contract

Status: in progress; shared backend boundaries, auth, streak, mascot and dictionary
codes implemented. Achievements, translations and articles are implemented.
Notifications non-2xx codes are implemented; Firebase delivery diagnostic
sanitization and HTTP tests are ready for review. Backend completion
audit, shared diagnostic redaction/contract generation and frontend migration remain open.
This is the single implementation task for API error codes across
Readovo. It incorporates the previous streak and mascot tasks. Updating this plan
does not implement the contract or expand the Axios migration into business changes.

## Review batches

Pause after each batch for user review before starting the next one.

1. Shared/auth contract design and branch inventory in
   [API error contract](api-error-contract.md); shared backend boundaries and HTTP
   tests implemented. Backend auth, streak and mascot codes and their HTTP tests
   are implemented. Dictionary word, generation and embedding paths are
   implemented. Achievements and translations are implemented. The article library
   and discovery/Wikipedia are implemented, as are article simplification and
   reading/vocabulary quizzes. Notifications non-2xx codes are implemented.
   Complete the backend audit and shared diagnostics/contract generation before
   migrating frontend handling. Notification delivery outcomes remain success
   payloads, now with controlled delivery feedback and redacted SDK error logs.
2. Complete domain inventories in reviewable groups: streak/mascot,
   dictionary/achievements, articles/translations, notifications/mock outcomes.
3. Implement and test backend boundaries, then migrate one domain per batch.
4. Implement frontend decoding/presentation and verify auth session behavior.
5. Migrate feature consumers/locales/mocks in matching domain batches.
6. Run compatibility/integration checks, finalize lasting documentation and
   remove completed temporary task documents.

The user confirmed there are no existing users and no compatibility requirement.
Deploy backend first. Do not add a legacy frontend text/status adapter or retain
the Nest `error` field. Validation messages use strings with typed field details.

## Goal and scope

Give every application-owned API failure a stable machine-readable code. Frontend
behavior and translations must not depend on backend message text, punctuation or
language. Cover backend responses, frontend normalization and presentation, tests,
mock API fixtures and deployment order.

Include domain exceptions, authentication/authorization, DTO validation, malformed
requests, missing routes/resources, provider failures and unexpected server errors.
Do not change success payloads, business rules, permissions or existing HTTP status
semantics as part of this task. SDK-internal errors and background-job failures are
not public API responses; map them at the API boundary when they affect a request.

## Current inventory to complete

This inventory identifies owners, not a complete list of exception branches. Before
implementation, enumerate every route and error branch, including guards, pipes,
filters, framework-generated responses and exceptions caught/rethrown by services.
Record endpoint, current status/message shape, proposed code, safe details, frontend
behavior and a contract-test reference. No module may be silently left on legacy text.

| Area              | Backend coverage                                                                                                                                 | Frontend coverage                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Auth              | Login, registration, Google identity, verification/resend, password reset, refresh, JWT verification, current-user decorator and ownership guard | Auth forms, auth interceptors, refresh/session invalidation; replace status-only inference where distinct domain causes share a status |
| Streak            | Calendar validation, activity completion, restore, freeze, token purchase and missing users                                                      | Streak/profile queries and mutations, balance/freeze messages, pending activity replay failure handling                                |
| Mascot            | Unknown items/slots, purchase, insufficient coins, ownership, equip/clear and missing users                                                      | Wardrobe and mascot operations; remove message-text comparisons                                                                        |
| Dictionary        | Input/duplicate validation, missing words, progress, answer submission, test generation and embeddings                                           | Dictionary requests, tests and UI; include the private duplicate-word message resolver                                                 |
| Articles          | Discovery/detail, Wikipedia JSON/HTML, adaptations/simplification, quizzes, saved/recent library and missing users                               | Article requests, generation flows and screens; no raw provider messages in user-facing text                                           |
| Achievements      | Profile/progress and missing users                                                                                                               | Profile/progress queries and mutations                                                                                                 |
| Notifications     | Preferences, push-token registration, test sends, dispatch/clear endpoints and restricted operations                                             | Learning-reminder requests, settings and operation feedback                                                                            |
| Translations      | Input validation, provider/configuration failures and missing translation data                                                                   | Translation request and reader feedback                                                                                                |
| Shared boundaries | Validation pipe, request parsing, authorization, unknown routes/methods, unexpected exceptions and applicable rate limits                        | Axios error normalization, cancellation, offline/network/timeout handling, localization and generic fallback                           |

Inspect controllers and successful batch/result payloads too: notification delivery
failure counts and other per-item outcomes must retain their success semantics.
If clients act on an individual failure reason, give that reason a stable code
without converting partial success into an unrelated HTTP error.

## Proposed public contract

```json
{
  "statusCode": 400,
  "code": "STREAK_NO_FREEZE_TOKENS",
  "message": "No freeze tokens available."
}
```

- `statusCode` matches the actual HTTP status.
- `code` is a stable, namespaced identifier owned by the application. Never derive
  it from exception text. Do not reuse a code for a different meaning.
- `message` is a safe diagnostic string, not a translation key or UI contract.
  Validation uses a generic string with typed field errors in `details`.
- `details` is optional, typed and allowlisted per code. Include only data the
  client needs, such as a limit or field identifier. Do not expose credentials,
  submitted passwords, raw provider payloads, SQL errors or stack traces.
- Use common codes for genuinely common failures and domain codes where the user
  action differs. A missing word and an unknown route must remain distinguishable.
- Preserve existing security disclosure behavior: do not introduce account
  enumeration through new auth codes or expose internal provider/configuration
  reasons that previously produced a generic public failure.
- Document each code's status, meaning, allowed details and intended UI behavior in
  a canonical catalogue. Define ownership and synchronization/typechecking between
  backend and frontend; avoid maintaining several independent code lists.

Validation uses a stable top-level code such as `VALIDATION_FAILED`. Define typed
field errors with field paths and stable rule codes, including nested fields,
arrays and rejected unknown properties. Never return submitted values as details.
Unexpected exceptions produce a safe `INTERNAL_ERROR`; preserve diagnostic detail
in protected server logs, not the response.

## Existing proposals to retain and extend

These are starting proposals, not an exhaustive catalogue. Resolve naming during
contract design and add the missing cases found in the inventory.

| Proposed code                       | Existing frontend translation key     |
| ----------------------------------- | ------------------------------------- |
| `STREAK_NOT_ENOUGH_COINS`           | `streak.errors.notEnoughCoins`        |
| `STREAK_FREEZE_TOKEN_LIMIT_REACHED` | `streak.errors.freezeLimitReached`    |
| `STREAK_FREEZE_DAY_LIMIT_REACHED`   | `streak.errors.freezeDayLimitReached` |
| `STREAK_NO_FREEZE_TOKENS`           | `streak.errors.noFreezeTokens`        |
| `STREAK_FREEZE_WINDOW_EXPIRED`      | `streak.errors.freezeWindowExpired`   |
| `STREAK_FREEZE_ONLY_MISSED_DAY`     | `streak.errors.freezeOnlyMissed`      |
| `STREAK_DAY_ALREADY_PROTECTED`      | `streak.errors.dayAlreadyProtected`   |
| `MASCOT_NOT_ENOUGH_COINS`           | `mascot.errors.notEnoughCoins`        |
| `MASCOT_ITEM_NOT_OWNED`             | `mascot.errors.itemNotOwned`          |

Both historical messages for an expired freeze window map to the same code.
Include restore availability/prices, invalid calendar/date inputs, unknown mascot
items/slots and all other uncovered branches rather than stopping at this table.

## Frontend design

- Axios continues rejecting non-2xx responses. Shared normalization extracts a
  validated code and safe details once, without exposing raw Axios configuration.
- Auth interceptors retain JWT injection, single-flight refresh, one retry and
  session guards. Separate invalid credentials, expired access tokens, rejected
  refresh and ownership failures; a business denial must not trigger a refresh loop.
- Use a consistent error-to-presentation boundary: a shared fallback for transport
  failures and feature-owned code maps for domain messages/actions. Specify the
  boundary before migrating call sites so errors are not translated repeatedly.
- Ordinary request functions return data and propagate normalized errors. Remove
  repeated status checks and nested wrappers such as
  `mapHttpError(..., { resolveMessage: ... })` where they only select UI text.
  Keep local handling only for meaningful recovery or domain actions.
- Audit all uses of `error.message` as a translation key or displayed text,
  including screens, hooks and mutations, not only API utilities.
- Never display an unrecognized backend code or arbitrary `message` directly.
  Unknown/malformed codes, non-JSON responses and missing details use a known
  localized fallback. Add required keys in every supported locale.
- Cancellation and stale-session `AbortError` stay distinguishable and silent;
  offline/network/timeout errors are not invented backend business codes. Preserve
  current query retry and offline replay behavior unless explicitly changed in a
  separate task. A stable code alone does not justify retrying a write.

## Delivery steps

1. [ ] Complete the route/error inventory and approve the catalogue, validation
       detail shape, compatibility matrix and frontend presentation boundary.
2. [ ] Implement backend error construction/serialization and framework-boundary
       normalization. Preserve status codes and applicable headers. Ensure
       catch-all handlers do not replace deliberate domain codes.
3. [ ] Migrate every backend area in the inventory, with endpoint contract tests.
       Include provider failures and infrastructure-to-domain translations; do not
       let raw database/SDK/provider exceptions escape as public codes or messages.
4. [ ] Add frontend normalization and a consistent localized presentation path.
       Verify auth behavior before migrating domain consumers.
5. [ ] Migrate all feature consumers, screens/hooks, locale keys and mock fixtures.
       Remove text comparisons and redundant nested error-mapping wrappers.
6. [ ] Validate deployment order and safe fallbacks, and document the final catalogue.

Each step must leave a runnable, reviewable state. Keep this task open until every
area and acceptance criterion is covered; moving one feature is not completion.

## Deployment and compatibility

Deploy backend codes first, preserving HTTP status semantics. Release clients that
understand codes next. Legacy client/server combinations are unsupported; missing
codes must still produce a safe localized fallback.

Do not add a legacy text/status adapter. An absent, unknown, empty, malformed or
unsupported code must use the safe fallback, never a legacy message match. Record
released client/server versions and verify backend readiness before client release.

## Acceptance and verification

- [ ] Every inventoried backend error has a code and a tested public response;
      successful and partial-success contracts retain their intended meaning.
- [ ] Endpoint tests verify actual HTTP status, code, details and safe response
      shape for domain, guard, validation, malformed-request and unexpected errors.
- [ ] Changing diagnostic message wording with the same code does not change the
      frontend translation or action. Test known, unknown, absent and malformed
      codes, invalid details, non-JSON bodies and unmapped statuses.
- [ ] Tests cover nested validation, locale completeness, generic fallback,
      cancellation, network/timeout failures, auth refresh/retry and stale sessions.
- [ ] No unauthorized information, secrets or raw internal errors appear in
      responses, UI notifications or newly added client logs.
- [ ] No frontend branches depend on backend message text; no legacy compatibility
      adapter is introduced.
- [ ] Requests do not regain manual HTTP-success checks or repeated nested message
      resolvers. Existing session, retry and business protections still pass.
- [ ] Update `mock-api` error fixtures and affected integration tests; unit tests
      must not call live external providers.
- [ ] Run root `npm run ci:frontend`, `npm run ci:backend`, `npm run typecheck`,
      backend e2e and relevant mock/integration checks. Check documentation and the
      actual staged snapshot when present; report pre-existing/environment failures.
- [ ] Exercise representative auth, validation, balance/ownership, provider-failure
      and fallback flows on supported platforms; record unavailable runtime checks.
- [ ] Publish lasting contract/catalogue documentation in the project docs. Delete
      this temporary task and the mascot redirect after completion, updating links
      and TODOs to the lasting documentation.
