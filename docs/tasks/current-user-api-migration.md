# TODO: standardize APIs for the authenticated user

Status: in progress. Dictionary and streak personal endpoints use `/me`.
The remaining modules are tracked below; the current streak changes await review.

## Problem

Most personal endpoints accept `userId` in the URL. The frontend passes the
current user's ID, `UserAuthGuard` compares it with the Bearer token owner, and
the controller reads the ID again through `@Param()`.

This check already restricts access to the owner. The problem is the duplicated
source of identity and unnecessary parameters for operations on the user's own
data. An ID in a URL does not, by itself, indicate an authorization vulnerability.

## Target contract

- For the user's own data, the backend derives identity exclusively from the
  verified token. Controllers receive `@CurrentUser() user: AuthenticatedUser`
  together with `UserAuthGuard`. The decorator does not verify tokens itself.
- Use the `me` segment instead of `:userId` for these endpoints, preserving other
  route segments, HTTP methods, and response formats where possible.
- Frontend HTTP functions do not accept an owner ID. Hooks for the user's own
  data obtain it through `useAuth()` for `enabled`, cache keys, and invalidation.
- Keep the ID in React Query keys to isolate accounts. Do not replace these keys
  with a shared `me` key that lacks an account identifier.
- Services and repositories continue to accept an explicit ID obtained at the
  trusted controller boundary. They do not depend on an HTTP request or frontend
  session.
- Resource identifiers (`wordId`, `articleId`, `itemId`, `deviceId`) remain in the
  contract. Authorize resource access against the authenticated owner.
- Audit administrative, public, and cross-user operations separately. An explicit
  target user ID may be appropriate there, together with separate permissions.
  Do not mechanically convert these operations to `me`.

## Current inventory

The target paths below are proposed contracts, except for the implemented
dictionary and streak migrations. Before each step, inspect the current controllers, all
consumers, and the mock API.

| Module        | Current route group                                     | Target route group                      | Status                                         |
| ------------- | ------------------------------------------------------- | --------------------------------------- | ---------------------------------------------- |
| Dictionary    | `/api/dictionary/me/{words,test}`                       | Existing new routes                     | Implemented; awaiting review                   |
| Achievements  | `/achievements/profile/:userId`                         | `/achievements/profile/me`              | Planned                                        |
| Mascot        | `/mascot/profile/:userId`                               | `/mascot/profile/me`                    | Planned                                        |
| Articles      | `/api/users/:userId/articles/{saved,recent}`            | `/api/users/me/articles/{saved,recent}` | Planned                                        |
| Streak        | `/streak/profile/me`                                    | Existing new routes                     | Implemented; awaiting review                   |
| Notifications | `/notifications/preferences/:userId` and related routes | `me` segment in personal routes         | Planned; review development actions separately |

Controller locations:
`backend/src/{dictionary,achievements,mascot,articles,streak,notifications}`.
Shared authentication: `backend/src/auth/user-auth.guard.ts` and
`backend/src/auth/current-user.decorator.ts`.

## Incremental steps

Each step is a separate PR, reviewed before proceeding. A step includes the
backend, corresponding frontend HTTP functions/hooks, consumers, mock API, and
meaningful tests. Updating a call or import does not justify refactoring an entire
screen.

- [ ] Complete the dictionary review: six endpoints, no owner `userId` in
      requests, cache isolation, authentication, resource validation, and release
      compatibility.
- [ ] Migrate achievements profile reads. Arbitrary progress writes were removed
      by verified quiz completion; preserve the server-owned reward rules.
- [ ] Migrate mascot profile, purchases, equipment changes, and slot clearing.
      Remove duplicate profile queries only within the affected consumers.
- [ ] Migrate personal saved/recent articles. Leave public search, reading,
      adaptations, and quiz generation outside this migration.
- [ ] Migrate streak profile, calendar, and personal mutations. Before changing
      the offline queue, establish ownership of stored events and behavior when
      switching accounts. Never send one account's events using another account's
      token.
      All five endpoints now use `/streak/profile/me` and derive the owner from
      `@CurrentUser()`. HTTP functions take no owner ID. Local IDs remain in cache
      keys and service calls to validate the expected session. Quiz completion now
      records streak activity transactionally; the public activity endpoint and
      unverified offline replay were removed. Legacy stored events remain unread.
      Session snapshots stop stale mutation effects after login/logout.
      Implementation and regression tests are complete; review remains pending.
- [ ] Migrate personal notifications: preferences, push tokens, test pushes, and
      clearing today's dispatch. Preserve production restrictions on development
      actions. Do not turn the global manual dispatch into a personal operation;
      agree on any changes to its access controls separately.
- [ ] Audit remaining routes and consumers. Remove the guard's
      `request.params.userId` comparison and unused DTOs only after migrating all
      dependent routes and completing any compatibility period. Preserve token
      verification and assignment to `request.authUser`. Explicit routes accessing
      other users must have their own permission checks.

## Verification for each step

- Use HTTP tests with the real guard and controlled services. Successful
  operations receive the owner from the token; switching accounts changes the
  operation's owner.
- Missing, invalid, or expired tokens prevent service execution.
- A client-supplied `userId` cannot change the owner. Unknown DTO fields are
  rejected according to existing validation rules.
- Another user's resource ID cannot grant access to their data. Preserve owner
  checks in services/repositories and route parameter validation.
- The frontend uses the new URLs without owner IDs, preserves errors and
  responses, disables personal queries when signed out, and isolates account
  caches.
- Verify logout/login and requests still in flight during account changes:
  results must not appear in another user's UI or cache.
- The mock API supports the corresponding contract. Decoding a token in the mock
  does not provide production backend authentication.
- Run `npm run ci:backend`, `npm run ci:frontend`, and `npm run typecheck`. When
  changes are staged, also run `npm run check:staged` against the actual snapshot.
  For documentation, run `npm --prefix frontend run docs:check` and separately
  check this document's formatting. Rerun affected checks after fixes.
- Report pre-existing check failures, unverified scenarios, and material logical
  problems. Do not change staging or create a commit.

## Compatibility and scope

There are no production deployments or released clients to support in this
migration. Legacy dictionary aliases are not required. Update development backend
and frontend together; do not add a compatibility layer for nonexistent clients.

### Follow-up review steps

Review each step before continuing to the next:

- [x] Isolate authenticated requests and refresh operations across session changes.
      Old operations must not retry with new credentials, clear or overwrite a new
      session's tokens, or trigger automatic query retries under another account.
      Implemented with regression tests; reviewed before proceeding.
- [x] Extract dictionary test generation and answer submission into separate API
      mutation hooks, retaining screen state callbacks in the screen.
      Implemented with mutation lifecycle and cache regression tests; awaiting review.
- [x] Mock dictionary requests now proxy to the authenticated local backend,
      preserving deletion, ownership and not-found behavior without duplicate state.

Changing how ownership is determined does not change business rules for rewards,
prices, streaks, quizzes, or administrator permissions. The completed reward
migration is documented in [verified quiz sessions](../api-error-contract.md#verified-quiz-sessions-and-rewards).

Session changes centrally cancel pending queries and scheduled retries; existing
request, token, and multi-step workflow guards remain necessary. A repository-wide
session-parameter or client-hook migration is not required by the verified retry fix.

Centralizing mutation callback guards is tracked separately in
[session-safe mutation callbacks](session-safe-mutation-callbacks.md).

Offline follow-up, separate from endpoint migration: a durable completion queue
must retain verifiable server session IDs and account ownership. The old bare
streak-event queue and replay from profile reads were removed. Client cancellation
cannot undo accepted server writes; persisted quiz completion provides server-side
idempotency for retries. Never convert legacy unverified events into new rewards.

Done when all agreed personal endpoints use verified identity, their consumers
are updated, account caches remain isolated, resource authorization is preserved,
release compatibility is defined, and checks have been run.
