# TODO: restore the full missed streak interval

Status: planned.

## Problem

`StreakService.restore` currently charges the fixed server price of 100 coins but
marks only `brokenStreakInfo.brokenAt` as restored. Earlier missed days remain in
history, so a multi-day gap still interrupts the streak after payment.
Missing-day reconciliation can also replace the break details repeatedly, losing
the original streak length used by the confirmation UI.

## Expected behavior

One restore action must repair the entire current missed interval for one fixed
server-defined payment, regardless of the interval's length. For example:

```text
Before: completed, completed, completed, missed, missed
After:  completed, completed, completed, restored, restored
Charge: 100 coins once
```

The frontend displays the server's top-level `restorePrice`; it never supplies
the price or decides the interval to restore.

## Scope

- Inspect reconciliation, stored break details, history rebuilding and the
  restore UI together. Define the current interval using the user's timezone and
  persisted history, rather than treating a single `brokenAt` date as the interval.
- Restore all missed days in that interval, including gaps discovered when the
  user returns after several days. Preserve completed, frozen and already restored
  days. Do not repair unrelated historical gaps or mark today's pending activity
  complete. Do not introduce a new maximum gap length as part of this fix.
- Preserve the original pre-break streak length for the confirmation UI and
  rebuild the resulting current/longest streak consistently with history.
- Make eligibility checks, one balance deduction, history repair, profile updates
  and any milestone awards atomic. Handle concurrent restore, freeze and quiz
  completion so retries or duplicate submissions cannot charge twice for the same
  interval or grant duplicate rewards. Reuse existing transaction and locking
  conventions where appropriate.
- Keep the price in backend policy and the API response only. Do not restore
  client price parameters or persisted prices. Update public break metadata only
  if needed to describe the interval clearly, then update its frontend consumers.
- Align the confirmation text, calendar, success feedback and cache invalidation
  with the full-interval behavior. Retain per-call mutation callbacks for screen
  effects and remove helpers or fields made obsolete by the fix.

## Acceptance and verification

- [ ] One missed day and multiple consecutive missed days are repaired by one
      action with one server-priced deduction.
- [ ] Returning after multiple days does not lose the pre-break streak length or
      leave a missed day inside the restored interval.
- [ ] Mixed completed/frozen/restored history, an older unrelated gap and a pending
      current day retain their intended states. Verify timezone/day boundaries.
- [ ] Insufficient balance, unavailable restoration and failures during repair
      leave the balance, history and awards unchanged.
- [ ] Concurrent/repeated requests cannot double-charge the same interval or
      duplicate milestone awards; restoration does not fabricate quiz completions.
- [ ] The returned profile and calendar agree, and the UI accurately previews and
      displays the restored streak using the server-provided price.
- [ ] Add focused service and HTTP contract tests. Verify atomicity and concurrency
      against a dedicated test database using the existing integration test setup.
- [ ] Run affected suites, `npm run ci:backend` and `npm run ci:frontend`. Check
      this task document's formatting explicitly; `docs:check` excludes task files.
- [ ] Inspect staged/unstaged differences and run `npm run check:staged` against
      the actual staged snapshot when present. Preserve the user's staging choices.

Delete this temporary task document when completed. Keep lasting behavior and API
documentation in the appropriate project documentation.
