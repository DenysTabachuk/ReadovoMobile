# TODO: centralize authenticated navigation

Status: planned.

## Problem

The root stack currently registers public and private routes together without
`Stack.Protected`. The tabs layout handles auth hydration and redirects locally,
while private routes outside tabs have no shared navigation guard.

`ProfileScreen` duplicates those checks and delegates its content to
`AuthenticatedProfile` solely to provide a required `userId` before calling hooks.
This boundary belongs to authenticated navigation, rather than each screen.

## Scope

- Handle auth hydration and its loading UI once at the root navigation boundary.
  Coordinate existing preference hydration and onboarding without rendering
  private screens before auth is resolved.
- Inventory every route, including automatically registered routes such as
  `wardrobe`. Separate pre-login and private routes using `Stack.Protected`.
  Decide which routes remain public, preserving onboarding, password-reset links
  and intended access to informational screens.
- Provide the private route tree with a validated, typed authenticated user whose
  ID is required. Resolve inconsistent auth state at that shared boundary; avoid
  assertions, fabricated IDs, optional owner contracts and repeated redirects in
  private screens.
- Remove duplicate auth loaders and redirects from the tabs layout and profile
  screen after the shared boundary provides their guarantees. Merge
  `AuthenticatedProfile` back into `ProfileScreen`, move its styles back and
  remove the obsolete wrapper and tests. Preserve the mutation callback migration
  and required streak owner IDs.
- Reevaluate `key={sessionVersion}` on the root stack. Remove it only if the final
  navigation behavior guarantees disposal of old screen mutation observers on
  auth transitions, including another login to the same account. Token refresh
  must preserve the current screen. Keep unrelated providers and their state
  outside any required session remount boundary.
- Update the navigation and session-lifetime conventions to describe the final
  behavior and where private screens obtain their authenticated user. Remove
  helpers, props and exports made unused by this change.

## Acceptance and verification

- [ ] Auth hydration never mounts private screen content or flashes login during
      restoration of a valid session.
- [ ] Signed-out users cannot open private routes through navigation or deep
      links, including routes outside tabs.
- [ ] Login, logout, session expiry and a subsequent login to the same or another
      account select the correct route tree. Back navigation cannot reopen
      inaccessible screens.
- [ ] Onboarding, password-reset deep links and intentional public routes retain
      their behavior. Verify and document how private deep links behave after
      login.
- [ ] Private screens receive a user with a required ID without repeating auth
      redirect checks. `AuthenticatedProfile` and its local auth boundary are
      removed without restoring optional streak owner IDs.
- [ ] Verify routing with the installed Expo Router and React Navigation rather
      than relying solely on mocked guard props. Preserve real React Query
      coverage proving that screen effects from a previous session are dropped.
- [ ] Token refresh preserves navigation state. If the stack key is removed,
      demonstrate that the replacement still disposes old observers.
- [ ] Run affected tests and `npm run ci:frontend`. Check this task document's
      formatting explicitly because `docs:check` excludes `docs/tasks`.
- [ ] Inspect staged/unstaged differences and run `npm run check:staged` against
      the actual staged snapshot when present. Preserve the user's staging choices.

Delete this temporary task document when completed. Keep lasting documentation
in the frontend convention guide.
