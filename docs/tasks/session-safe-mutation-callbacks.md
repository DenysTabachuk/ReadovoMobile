# TODO: centralize mutation callback isolation across auth sessions

Status: planned.

## Problem

Authenticated Axios requests already reject stale-session responses, and session
changes cancel pending queries. Mutations can still run success/error callbacks
after a request has settled and the account has changed. Owner-specific query
keys isolate cached data but do not protect screen state, navigation, global
banners or optimistic rollback.

Hooks currently handle this with repeated session snapshots and
`session.assertCurrent()` calls. Centralize this responsibility so ordinary
feature hooks do not have to implement the same guards manually.

## Scope

- Audit current mutation hooks, per-call `mutate`/`mutateAsync` callbacks and the
  installed React Query callback ordering before selecting a shared mechanism.
  A global `MutationCache` callback alone must not be assumed to suppress later
  hook or per-call callbacks.
- Bind authenticated mutations to their initiating login session automatically.
  Reuse the auth store's session version; user ID alone does not distinguish
  logout followed by login to the same account. Token refresh keeps the session.
- Suppress stale success/error/settled effects, including results, navigation,
  banners and rollback that could affect a replacement session. Define stale
  promise outcomes so `mutateAsync` callers cannot bypass the protection.
- Keep feature hooks readable. Prefer the smallest shared integration supported
  by the existing infrastructure; do not require session arguments in every HTTP
  request or introduce a general workflow framework.
- Migrate affected consumers and remove manual guards only where the shared
  mechanism demonstrably replaces them. Keep owner-specific query keys.
- Preserve Axios request/refresh protection. Multi-request workflows and local
  storage writes need a separate audit: callback isolation alone cannot stop a
  later request from starting under replacement credentials.

This task concerns client-side effects. Cancellation cannot undo a server write
that was already accepted; backend ownership, transactions and idempotency remain
necessary. Public/auth-transition mutations need explicit treatment so login and
logout continue to work. Do not redesign offline synchronization or reward rules.

## Acceptance and verification

- [ ] Existing feature hooks use the shared mechanism without repeated manual
      session assertions for callback isolation.
- [ ] Delayed callbacks from account A cannot affect account B, including when
      the response settled before the switch, or when A logs out and back in.
- [ ] Success, failure, per-call callbacks, `mutateAsync` continuations and
      optimistic rollback have explicit regression coverage using real React Query
      lifecycle behavior. Current-session behavior and token refresh still work.
- [ ] Existing request/refresh and multi-step isolation regressions still pass;
      retain guards whose responsibilities are not replaced.
- [ ] Run frontend CI and relevant auth/mutation tests. Run staged checks against
      the actual staged snapshot when present; preserve user staging choices.

Start with `features/quiz/api/mutations/useCompleteQuizMutation`, its existing
late-callback tests, `features/auth/session/getAuthSessionSnapshot`, and
`features/auth/providers/authProvider/utils/cancelQueriesOnSessionChange` under
`frontend/`.

Delete this temporary task document when completed. Keep any lasting contract
documentation in the existing frontend convention guide.
