# TODO: bind authenticated API operations to their initiating session

Status: planned. Priority: **P1 (high)**.

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

### 1. Session client and streak pilot

- [ ] Implement session ownership, bound transport, refresh, and invalidation while
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
