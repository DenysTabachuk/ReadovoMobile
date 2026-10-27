# TODO: bind authenticated API operations to their initiating session

Status: unit 1a implemented and awaiting review. Do not start unit 1b yet.
Priority: **P1 (high)**.

Implement this before spreading manual `getAuthSessionSnapshot` / `assertCurrent`
checks across more features or expanding multi-step `/me` workflows. This is
planned infrastructure work, not a reported production incident. Existing session
guards must remain effective throughout the migration; `/me` itself is valid.

## Problem and existing protections

`authenticatedFetch` already captures a session version for an individual request
and prevents a delayed response or refresh from crossing a login/logout boundary.
`authSessionStore` also protects token writes and refresh commits. Preserve those
behaviors and their regression tests.

Multi-step operations can still start a subsequent request after the original
session ends. Since each new `authenticatedFetch` reads the current credentials,
that request could execute `/me` as another account. The current streak migration
addresses this with explicit session snapshots and assertions between awaits.
Those checks work only if every caller puts them in the correct places.

Additional lifecycle gaps to address:

- Logout invalidates token storage but does not centrally coordinate request
  cancellation, personal cache disposal, and late UI callbacks.
- Personal query functions do not consistently forward React Query cancellation
  signals into requests.
- The streak profile query submits offline events before reading the profile.
  Refetching a profile can therefore trigger writes and overlapping queue work.

## Recommended design

Create one authenticated API client/context for each login session. An operation
captures that context once and uses it for every nested request. The public shape
must be reviewed before implementation; names such as `runInAuthSession` are
illustrative, not an existing or mandated API.

- Maintain an immutable session identity and owner, an invalidation state, and a
  cancellation signal. A fresh login gets a new identity even for the same user;
  refresh token rotation keeps the current identity.
- The bound transport obtains credentials only for its captured session. It must
  never fall back to a later session's tokens. Refresh remains single-flight per
  session and may commit or clear tokens only for that session.
- Check validity inside request execution before sending, after asynchronous token
  access, during refresh/retry, and before exposing parsed results. Cancellation
  and identity checks complement each other; an ignored abort cannot make a stale
  result valid.
- Propagate the same context through service calls and offline replay. A helper
  that checks only the beginning/end of a callback is insufficient: an intermediate
  write may already have executed under the wrong account.
- Support caller and React Query cancellation as well as session cancellation.
  An aborted context must reject new requests without making network calls.
- Establish consistent session ownership during login and hydration. Avoid reading
  and decoding a JWT separately in every business operation. Local identity checks
  do not replace signature verification and authorization on the backend.
- Keep token/refresh/session mechanics inside auth infrastructure. Feature hooks
  own query keys and cache effects; UI owns navigation and presentation. Preserve
  repository dependency boundaries when wiring logout to cache cleanup.

## Reviewed client API and planned lifecycle

The client contract below is implemented in unit 1a after API review. Cache,
callback adapters, feature migration, and replay policies remain planned for their
review units below. The repository was clean when the initial audit started.

Auth infrastructure owns one immutable client per successful login/hydration.
Expose `session: AuthSessionClient | null` through `useAuth()` and the auth feature
root. Publish the owner and client together only after credential persistence and
owner validation succeed. Hydration stays unavailable until it establishes the
same invariant. Decode the token subject once in auth infrastructure and compare
it with a supplied/stored profile ID; never publish inconsistent identities.
Missing profiles must not make an otherwise valid token owner unknowable.

Public client types (exported through the auth feature root):

```ts
type SessionRequest<T> = {
  input: RequestInfo | URL;
  init?: RequestInit;
  parse: (response: Response) => Promise<T>;
};

type AuthSessionClient = {
  readonly id: symbol;
  readonly ownerId: string;
  readonly signal: AbortSignal;
  readonly isActive: boolean;
  request<T>(request: SessionRequest<T>): Promise<T>;
};
```

- `id` identifies a login, not an account or access token. Refresh keeps it;
  signing into the same account again replaces it. Session IDs are process-local.
- Feature request functions receive the captured client explicitly, for example
  `getStreakProfile(session, { signal })`. Nested services receive that same client;
  they never reacquire the active client. HTTP remains independent of React.
- `request` owns credential lookup, cancellation, refresh/retry, and the complete
  awaited `parse` boundary. Feature parsers retain status/error mapping and return
  domain data (or `undefined` for empty responses), never a raw `Response`, lazy
  stream, or deferred body reader. Check validity after parsing and on rejection,
  even when the transport ignores abort. Parsing does not perform feature effects.
- Combine `init.signal` with the session signal without mutating caller options.
  An already aborted caller/session prevents storage and network work. Remove
  listeners on settlement; do not assume native support for `AbortSignal.any`.
- Before and after token access, before each network send, after each response,
  and after parsing, reject invalid work with `AbortError`. Missing credentials
  must never produce an unauthenticated personal request or use caller-supplied
  Authorization as a fallback. The captured session controls Authorization.
- Refresh stays single-flight per session. Its shared request uses the session
  signal; canceling one caller stops that caller's wait/retry without canceling
  refresh for other callers. Session invalidation cancels refresh for everyone.
  Conditional token commit/clear remains protected by the existing store version.
  Check the caller again before retrying with the rotated token.
- Keep the compatibility `authenticatedFetch` and snapshot exports until their
  callers migrate. They retain existing regression guarantees; migrated requests
  must use the bound client, not a wrapper that calls `authenticatedFetch` again.

Queries capture the client from their owning render, before a query executes, and
forward the query signal. Mutations capture it at invocation, before optimistic
work or an await, and carry it in operation state through every callback. A queued
mutation, old event handler, timer, or continuation cannot acquire a replacement
client, even if its account ID matches. Missing/inactive sessions reject rather
than silently returning successful empty results.

In step 2, introduce common session-aware query/mutation lifecycle adapters under
auth (exported through its root). They guard execution, optimistic updates,
success/error/settled callbacks, rollback, and caller callbacks against the
captured identity. Features retain their query keys and cache effects; components
retain banners/navigation. Guarded callbacks execute synchronous effects only;
after an await, schedule another guarded effect instead of relying on a check
made before that await. Scheduled effects and existing personal banners also
need lifecycle cleanup. The final adapter signatures belong to the step 2 review;
`isActive` is infrastructure input, not a new pattern of manual feature checks.

### Session transitions and cache policy

Use the store as the single transition authority. At the start of sign-out or
account replacement, synchronously invalidate and abort the old session and
publish its unavailability before any storage, preference, or provider await.
Serialize persistent changes as today. Only the still-current transition may
publish a completed login/hydration or clear provider state after sign-out.
Failed establishment leaves no usable client; storage failures remain observable.
A failed refresh for A cannot invalidate B. React effects alone are too late to
provide the synchronous invalidation guarantee.

Choose **cancel and remove personal queries from the existing QueryClient**.
Keep public queries and their reusable data. Classify personal queries through
explicit metadata (including owner/session identity); preserve existing
account-aware keys. During incremental rollout, cover legacy personal query keys
with a temporary explicit classifier until every personal query has metadata.
Never identify public data by a blanket `clear()` or by guessing from `/me` URLs.
Invalidate the session first, then cancel/remove its queries; callback guards
prevent late mutations from recreating removed entries. Clear personal mutation
records after guarding callbacks; clearing a record is not cancellation.

Wire transitions to cache/banner cleanup in app-level composition. Shared
`providers/queryProvider` accepts domain-neutral lifecycle inputs/callbacks and
must not import `features/auth`. Auth transport/store must not import query keys,
React Query, screens, or navigation. Account-owned preference state loaded in
`app/_layout.tsx` also needs reset and late-result protection.

### Repository inventory and material findings before unit 1a

| Area                    | Audited entry points and scope                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Auth                    | `features/auth/session/{authTokenStorage,authenticatedFetch,refreshAuthSession,getAuthSessionSnapshot}` and `features/auth/providers/authProvider`: versioned storage/refresh exist; no bound parsed-result client or abort lifecycle. Hydration reads storage directly; sign-in awaits preferences before invalidating the old session; late provider completion is not transition-bound. |
| Streak                  | All six `api/requests`, profile/calendar queries, four mutations, cache-update hook, `useStreak`, track/freeze/purchase/restore services, replay, and pending-event storage. Profile refetch currently performs replay writes.                                                                                                                                                             |
| Achievements and mascot | Two achievements requests and four mascot requests; profile/wardrobe consumers and quiz completion callers. Keep existing owner routes and reward/purchase behavior.                                                                                                                                                                                                                       |
| Articles                | Five saved/recent requests; library/toggle/simplify flows and quiz completion. Public discovery/detail/adaptation/quiz-generation transport stays public; bind personal writes nested in those flows.                                                                                                                                                                                      |
| Dictionary              | Six personal requests and their query/mutation hooks; test screen completion also calls achievements/streak and presents banners. Capture one session across each complete workflow.                                                                                                                                                                                                       |
| Notifications           | Six request modules, `learningReminders/service.ts`, development screen, and root-layout startup/AppState effects. Bind before permission/device-token/storage awaits; guard preference hydration and late UI. Global dispatch remains global with its existing permissions.                                                                                                               |
| Cache and UI            | `providers/queryProvider`, app provider composition, banner lifecycle, profile/wardrobe queries, personal article/dictionary/streak keys, optimistic rollback and mutation caller callbacks. Public Wikipedia, adaptations, quiz generation, and translations require separate classification from personal side effects.                                                                  |
| Backend and mock        | Existing guards/controllers and `mock-api/server.js` provide contract context. This task changes client session ownership, not backend routes, reward authority, purchase rules, or global dispatch authorization. Adjust fixtures only if client contract tests require it.                                                                                                               |

The existing replay reads a queue and later replaces it wholesale. Concurrent
appends/replays can lose events; records have only type/time, with no stable ID.
Step 3 must serialize owner storage updates, assign local event IDs (including to
valid existing owner-scoped records), and remove only confirmed snapshot IDs.
Never hold a storage lock while awaiting HTTP. Use one replay worker per owner;
a new session waits for an invalidated worker to settle before starting its own.
Session start and explicit retry trigger replay; reconnect is optional only if a
reliable connectivity source is already available. Successful replay invalidates
the owner's profile/calendar queries through the owning feature. Unsent events
remain owner-scoped; unowned legacy entries stay excluded. An accepted request
with a lost response can still replay: local IDs do not create server idempotency
or verifiable quiz completion. Coordinate that separately with the rewards task.

These are code findings, not evidence of a production incident. Existing guards
remain in place until each replacement passes regression tests.

## Required lifecycle behavior

- [ ] Login/hydration exposes a coherent owner and session client. Multi-step work
      captures it at initiation; a later continuation cannot capture a replacement.
- [ ] Logout or account replacement invalidates the old context synchronously,
      before waiting for storage or provider sign-out. Abort pending requests and
      prevent new work/retries in that context.
- [ ] Dispose of personal cache data centrally on session changes. Select and
      document one policy: clear/remove personal queries or replace a personal
      QueryClient for each session. Account-aware keys remain required wherever
      caches can coexist. Do not indiscriminately remove reusable public data.
- [ ] Late requests, mutation callbacks, scheduled continuations, and banners from
      the old session cannot update the new session's cache or UI. Cache removal
      alone does not cancel a mutation or make its callbacks harmless.
- [ ] Preserve `AbortError` handling and suppress automatic retries of stale work.
      A failed refresh for A must never clear tokens or log out B.
- [ ] An active-session refresh retries with that session's rotated token, without
      breaking cancellation or mutating caller-provided request options.

Client cancellation does not undo a request already accepted by the server. Backend
authorization, atomic writes, and idempotent completion are separate requirements;
see [server-side quiz rewards](server-side-quiz-rewards.md).

## Incremental implementation and acceptance

Each step is one review boundary. Do not start the next step before review;
split a step further if necessary to keep its PR cohesive.

The repository-wide rollout uses the following smaller review units. Complete
only one unit per approved continuation; report its diff, checks, and remaining
limitations, then wait for review. Do not stage or commit on the user's behalf.

| Unit         | Reviewable result                                                                                                                                                                                         | Required evidence before handoff                                                                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 (reviewed) | API proposal, cache decision, audited feature inventory, and rollout in this document.                                                                                                                    | Docs checks and direct task-document formatting; no runtime changes. API review approved before unit 1a.                                                                                                   |
| 1a           | Session owner/client, parsed transport, refresh/cancellation, coherent login/hydration, and synchronous invalidation; compatibility exports retained.                                                     | Controlled token-read, response/body, refresh/retry, same-owner login, hydration, missing-token, storage-failure, and ignored-abort tests. Existing auth regressions pass.                                 |
| 1b           | Complete streak pilot: requests, both queries, mutations/services, and replay all receive the captured client; retain query keys, routes, offline behavior, and `useStreak` consumer API where practical. | A cannot continue as B between requests or queue awaits; normal refresh and caller/query cancellation work. No pilot manual snapshot plumbing. Replay still precedes profile reads until step 3.           |
| 2a           | Common lifecycle adapters, central personal-query classification/cancellation/removal, provider/app bridge, and personal state/banner cleanup.                                                            | Public data survives; A/B and fresh A login isolate cache/UI; stale optimistic rollback and all callback phases are harmless. Apply adapters to the pilot and audit callback coverage in legacy consumers. |
| 2b           | Adopt lifecycle adapters across remaining personal query/mutation/UI entry points, including direct screen operations.                                                                                    | Late callbacks, timers, navigation, preference loads, and banners cannot affect the replacement session. Bound transport migration for these features remains in units 4a-4d.                              |
| 3a           | Owner-serialized queue updates, stable local IDs, snapshot-based acknowledgement, and single replay worker per owner.                                                                                     | Overlapping append/replay, failure, cancellation, and session replacement retain unsent/new events without duplicate workers.                                                                              |
| 3b           | Dedicated session-owned replay trigger and read-only profile queries.                                                                                                                                     | Session start/manual retry trigger replay; profile refetch submits no events; successful replay refreshes owning queries without loops.                                                                    |
| 4a           | Achievements and mascot transport plus profile/wardrobe consumers.                                                                                                                                        | Multi-step operations and callbacks keep original identity; preserve owner routes, purchases, and cache behavior.                                                                                          |
| 4b           | Saved/recent article workflows, nested personal simplify/library effects, and article quiz completion.                                                                                                    | One captured client reaches achievements/streak and personal article writes; public APIs remain usable.                                                                                                    |
| 4c           | Dictionary requests, tests, completion/reward/streak orchestration.                                                                                                                                       | One context spans generation/answer/completion as applicable to the initiating workflow; delayed results cannot update another session.                                                                    |
| 4d           | Notification requests, device registration/service workflows, development actions, and root-layout callers.                                                                                               | Switch accounts during permission/token/storage waits; no later request or preference/UI update uses the new session. Preserve global action semantics.                                                    |
| 5            | Final repository audit, remove unused snapshot/compatibility APIs, publish lasting usage/lifecycle docs, and delete this temporary document.                                                              | No business token reads/manual assertions or personal unbound transport remain; full frontend CI/typecheck and relevant backend/mock checks pass. Review any residual exclusions explicitly.               |

Units 1a/1b together fulfill step 1; 2a/2b fulfill step 2; 3a/3b fulfill step 3;
4a-4d and 5 fulfill step 4. Each implementation unit runs `npm run ci:frontend`
and `npm run typecheck`, plus affected backend checks if backend code changes.
Staged verification follows the rules below. Passing an early unit does not claim
the lifecycle guarantees of a later unit are already implemented.

### Unit 1a review notes

- `useAuth().session` now exposes the immutable client and validated owner.
  Missing profiles receive an identity-only profile; inconsistent profiles reject
  establishment. Login/hydration publish the client and profile together.
- The session store aborts the old version synchronously and supports guarded
  token reads inside its storage queue. Refresh keeps its existing single-flight
  and conditional commit/clear behavior, adding session cancellation.
- The client checks every asynchronous boundary, including parsing, and combines
  session/caller cancellation. Request bodies remain reusable for the one retry.
  Compatibility fetch/snapshot APIs and their regressions remain available.
- A controller serializes profile/preferences writes and prevents stale provider
  completions from publishing state. Hydration refresh does not hold the metadata
  queue, so an ignored old network abort cannot block a replacement login.
- This unit does not migrate feature requests or guard their cache/UI callbacks.
  Personal cache removal and replay separation are still pending. Next is unit 1b,
  only after review; retain this task document until the whole rollout completes.

### 1. Session client and streak pilot

- [x] Implement session ownership, bound transport, refresh, and invalidation while
      retaining the existing guards for callers not yet migrated.
- [ ] Migrate the streak profile query and its mutation/service workflows to one
      captured context. Retain current `/me` routes, cache keys, business behavior,
      and the public `useStreak` consumer API where practical.
- [ ] Remove the pilot's repetitive manual assertions only after the bound client
      passes the same account-switch tests. A cosmetic wrapper around existing
      assertions is not sufficient.
- [ ] Acceptance: a delayed A operation cannot send its next request as B, refresh
      with B's credentials, or return B's data. Normal A refresh still succeeds.

### 2. Logout, cache, and UI lifecycle

- [ ] Integrate central cancellation and the chosen personal cache disposal policy
      with login/logout and account replacement.
- [ ] Guard late mutation/cache/UI effects through the common session lifecycle,
      rather than introducing another set of per-screen assertions.
- [ ] Acceptance: A's pending operations cannot repopulate B's active cache, show
      banners, navigate, or clear B's session after logout/login. Signing back into
      A still creates a new session and invalidates old A work.

### 3. Separate offline replay from profile reads

- [ ] Move replay into a dedicated session-owned synchronization process, with an
      explicit trigger policy such as session start, reconnect, or manual retry.
      Define how profile refresh follows successful replay.
- [ ] Serialize replay for an owner and coordinate queue appends/removals so
      overlapping operations cannot lose events. Abort replay with its session;
      retain unsent events only for their proven owner.
- [ ] Preserve current retry/business rules unless separately approved. Never
      replay legacy unowned events as the current user. Coordinate verifiable
      completion evidence with the server-side quiz rewards task.
- [ ] Acceptance: profile refetches perform reads without submitting queued events;
      concurrent replay triggers do not run duplicate workers or erase new entries.

### 4. Migrate remaining authenticated workflows and remove temporary helpers

- [ ] Inventory direct requests and multi-step workflows, including article quiz
      completion, dictionary tests, and notification development actions. Migrate
      one cohesive feature group at a time; keep public/unauthenticated APIs intact.
- [ ] Preserve caller/query cancellation and owning feature cache behavior. An
      import update does not justify refactoring unrelated implementation.
- [ ] Remove `getAuthSessionSnapshot` and compatibility paths only after all their
      consumers have migrated. Retain low-level checks privately where necessary.
- [ ] Acceptance: business hooks do not manually coordinate token reads or scatter
      session assertions between awaits; all personal workflows preserve the
      cross-session guarantees established by the pilot.

## Verification

- [ ] Retain/adapt existing session store, refresh, authenticated fetch, snapshot,
      streak query/mutation, and queue regression tests; do not weaken expectations
      merely to remove the old APIs.
- [ ] Test account replacement during token reads, original response, response-body
      parsing, 401 refresh, retry, queue reads/writes, and between two requests.
- [ ] Test logout, login as another owner, a fresh login as the same owner, ordinary
      token rotation, hydration, missing credentials, and storage/refresh failures.
- [ ] Prove old contexts reject requests before network access even when cancellation
      is ignored by a transport mock. Test late mutation callbacks and UI effects.
- [ ] Test session/caller/query cancellation together and confirm the selected
      cache disposal policy isolates accounts without breaking public queries.
- [ ] Test replay concurrency, event retention, and profile reads without writes.
      Use controlled promises/storage/network boundaries; avoid timing-based tests.
- [ ] Run `npm run ci:frontend` for implementation and `npm run typecheck` when
      applicable. Run `npm run check:staged` against actual staged changes whenever
      present. Report working-tree and staged results separately and preserve the
      user's staging selection.
- [ ] For this task document, run the repository docs check and directly check its
      formatting with Prettier; the existing docs command does not include all tasks.

## Scope and related priorities

The first PR covers the streak pilot, not a rewrite of all auth consumers. No
backend route migration, new reward formula, purchase overhaul, or general offline
framework is authorized by this task. Coordinate with
[current-user API migration](current-user-api-migration.md).

P1 is justified by account isolation and the risk of missing manual guards as the
application grows. Existing protections remain necessary until replaced and tested.
The [server-side quiz rewards task](server-side-quiz-rewards.md) addresses the more
direct integrity issue of client-controlled rewards; completing this client task
does not close that issue or make reward authorization safe by itself.

## Main implementation locations

- `frontend/features/auth/session/` and `providers/authProvider/`
- `frontend/providers/queryProvider/` and the app's provider composition
- `frontend/features/streak/api/`, `utils/`, `pendingActivityEventsStorage/`, and `hooks/useStreak/`
- The audited article, dictionary, and notification callers in later feature PRs

Complete when the agreed workflows are bound to their initiating session, logout
centrally ends personal work and disposes of its state, offline replay is separate
from profile reads, and regression checks pass without per-feature session plumbing.

This is a temporary task document. Delete it only after the agreed work is fully
complete and retain the final lifecycle/usage contract in lasting documentation.
