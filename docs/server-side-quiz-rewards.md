# TODO: make quiz rewards and achievement progress authoritative on the backend

Status: planned. This document tracks the implementation and required decisions;
none of the proposed contracts or product changes below are approved merely by
being listed here.

Scope: article reading quizzes, article vocabulary quizzes, dictionary tests,
and the achievement/streak effects caused by verified learning activity.
Implement small, independently reviewable PRs and wait for review before starting
the next step. Preserve existing reward amounts and thresholds unless a separate
product decision explicitly changes them.

## Current problems

- The frontend calculates quiz rewards, adds them to a previously fetched balance,
  and submits absolute `balance` and `testsCompleted` values through
  `PATCH /achievements/profile/:userId/progress`. The backend validates numeric
  limits but does not verify the completed quiz or calculate its reward.
- Parallel progress updates can overwrite rewards or restore coins already spent
  by another operation. A progress update also writes unchanged fields from a
  previously read server snapshot.
- Quiz rewards have no unique server completion record. Repeated submissions,
  concurrent requests, or retries after timeouts can award the same completion
  again or award the first-test bonus more than once.
- Quiz progress and streak activity are submitted separately. A later failure can
  leave a partially completed workflow. A direct streak activity request does not
  prove that a quiz was completed.
- General achievement rules and their coin rewards already live on the backend.
  Their inserts and rewards are transactional and protected against duplicate
  achievement grants. Preserve these protections, but stop trusting client-owned
  counters as the evidence used to unlock achievements.
- `AchievementsService.getProfile()` currently persists unlocks and grants coins.
  An ordinary profile read can therefore change the balance. Frontend comparisons
  of old/new profiles are not a reliable record of which operation unlocked an
  achievement, and currently display only the first new achievement.
- Learned-word progress uses the current count of dictionary entries marked
  `learned`; the coin achievement uses the current balance. An unlocked card can
  later show progress below its target after spending, deletion, or progress reset.

## Responsibility boundaries

The backend owns session identity, answer validation, score, reward eligibility,
reward calculation, counters, achievement unlocks, streak transitions, and balance
changes. The frontend submits user actions and displays authoritative results,
translations, badges, progress formatting, and notifications.

- Derive the user from verified authentication with `UserAuthGuard` and
  `@CurrentUser()`. A resource `sessionId` remains in the URL; an owner `userId`
  supplied by the client cannot select the rewarded account.
- Store each quiz session's owner, kind, question/option IDs, correct answers,
  trusted difficulty and length inputs, lifecycle state, and completion result.
  Snapshot the inputs that affect grading and rewards so later article or policy
  changes cannot change the outcome of an existing session.
- Do not accept client-reported correctness, percentage, reward, balance, or test
  counters as authoritative. Correct-answer data exposed for practice/feedback
  must not allow a second graded attempt or a fabricated session completion.
- Keep account IDs in frontend cache keys and local queue ownership. Bind
  multi-step submissions to their initiating account/session and abort stale work
  on logout/login. Cache results and notifications must not leak across accounts.

## Decisions required before the affected implementation

Record the chosen rule and its acceptance examples here before changing behavior.
Do not silently decide these rules during a structural refactor.

| Decision                          | Current behavior                                                      | Required clarification                                                                                                |
| --------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Coin achievement progress         | Current spendable balance                                             | Accumulate lifetime earned coins or require holding the target balance; define which rewards count.                   |
| Learned-word achievement progress | Current number of `learned` dictionary entries                        | Count current entries or distinct words learned over time; define deletion, relearning, and resets.                   |
| Progress after unlocking          | Unlock remains permanent; progress can decrease                       | Define the card counter and bar after spending, deleting a word, or resetting progress.                               |
| Successful completion             | Frontend completion triggers progress even for a low score            | Preserve or explicitly change qualifying scores, skipped answers, abandoned/expired sessions, and legitimate retakes. |
| Dictionary answer timing          | Each answer already changes word review progress                      | Define when review progress commits and how session completion reuses it without applying it twice.                   |
| Notifications                     | Client diffs profiles and shows the first unlock                      | Define how multiple unlocks are presented and how completion retries avoid repeating banners.                         |
| Offline completion                | Local activity events can contain only an activity type and timestamp | Require verifiable session/attempt ownership; define expiry and treatment of old events with no completion evidence.  |

Moving reward calculation to the backend must initially preserve the current
`calculateQuizReward` formula, including accuracy tiers, difficulty/length
multipliers, rounding, perfect-score bonus, and first-test bonus. A retake is a
new allowed session; a retry of the same completed session is not a new reward.

## Proposed completion contract

The following is a proposal, not an implemented endpoint. Agree the final route,
DTOs, error codes, session creation response, and supported question types before
implementation. Existing article and dictionary generation APIs must return the
server session identifier used for completion.

```http
POST /quiz-sessions/:sessionId/complete
```

```json
{
  "answers": [{ "questionId": "question-1", "selectedOptionIds": ["option-2"] }]
}
```

An illustrative response separates the immutable completion result from current
account state. These partial shapes are not replacements for existing full
profile/streak response types:

```json
{
  "completion": {
    "sessionId": "session-123",
    "correctAnswers": 8,
    "totalQuestions": 10,
    "percentage": 80,
    "rewards": {
      "quizCoins": 26,
      "achievementCoins": 100,
      "streakCoins": 0,
      "totalCoins": 126
    },
    "newlyUnlockedAchievements": [
      { "id": "ten_tests_completed", "coinsReward": 100 }
    ],
    "newlyUnlockedStreakAchievements": []
  },
  "progress": { "balance": 226, "testsCompleted": 10 },
  "streak": { "currentStreak": 2, "todayStatus": "completed" }
}
```

- Persist the completion score, reward breakdown, and unlocked achievement IDs.
  An identical retry returns that result without rerunning reward or streak writes.
- Define handling of a different answer payload after completion: reject it or
  return the existing immutable result; never regrade it into a second award.
- Return account state after all associated bonuses. On replay, clearly separate
  the historical completion result from a freshly read account snapshot; do not
  write an old completion balance back into the current frontend cache.
- Give the frontend stable completion/achievement identifiers for notification
  deduplication. Replaying a result must not replay the banners automatically.
- Keep quiz, general-achievement, and streak rewards distinct. Displaying a quiz
  reward must not accidentally omit other awarded coins or count them twice.

## Backend acceptance requirements

- [ ] Create and authorize persisted server quiz sessions for every supported quiz
      kind. Define ownership, expiry, retakes, and deletion of referenced content.
- [ ] Validate question and option membership, duplicates, missing answers, and
      the cardinality/constraints of every supported question type, including
      multiple choice. Do not trust grading or reward inputs from the request.
- [ ] Calculate quiz rewards on the server using the agreed existing formula.
      Determine first-test eligibility from server state and grant it once even
      when two different sessions complete concurrently for the same user.
- [ ] Commit session completion, reward amounts, atomic balance/counter increments,
      achievement grants, and associated streak changes as one consistent unit.
      Use a transaction with appropriate concurrency control. Do not rely on
      separate successful HTTP requests for consistency. If transaction boundaries
      cannot encompass an effect, agree and test a durable retry mechanism before
      implementation; do not replace this with an untracked best-effort call.
- [ ] Protect completion with a database constraint or conditional state change.
      Parallel requests for one session produce one grant; parallel different
      sessions preserve both increments and do not overwrite spending.
- [ ] Preserve unique general/streak achievement grants and reward transactions.
      Handle cascades where an achievement reward itself reaches a coin threshold
      without awarding any achievement twice.
- [ ] Stop granting achievements from profile GET requests. Evaluate them in the
      authoritative operations that change their inputs: quiz completion, relevant
      word review changes, and other agreed balance/progress transitions. Include
      returned unlocks in those operation results, not just quiz completion.
- [ ] Define treatment of existing eligible-but-ungranted achievements when GET
      becomes read-only. Any backfill must be explicit and duplicate-safe.
- [ ] Close public progress writes for `balance` and `testsCompleted`; audit
      `lessonsCompleted` and `wordsLearned` too. Do not retain arbitrary counter or
      balance setters merely to keep an old caller compiling.
- [ ] Close the direct `POST /streak/profile/me/activity-completed` bypass. A bare
      activity type, timestamp, owner ID, or caller-provided session ID is not
      evidence of completion. Internal streak updates must consume a verified
      completion and must not run again when that completion is replayed.
- [ ] Keep existing authenticated owner checks for all resources. Use stable error
      codes for the new completion workflow; coordinate the wider error-code
      migration separately.

## Frontend and mock acceptance requirements

- [ ] Migrate article reading, vocabulary, and dictionary flows to server session
      completion. Remove their absolute balance/counter writes and separate public
      streak-completion calls.
- [ ] For dictionary tests, reconcile per-answer submissions with final completion.
      Retrying an answer or completing the session cannot apply word review
      progress twice. Retrying a different answer to the same graded question must
      follow the agreed attempt rule.
- [ ] Display server scores, reward breakdowns, and unlocks. Update/invalidate
      achievements, streak, calendar, and other affected balance caches within
      their owning data hooks. Prevent older responses from replacing newer state.
- [ ] Use returned unlock identifiers for notifications instead of inferring awards
      by comparing profile snapshots. Present multiple unlocks according to the
      agreed UX and deduplicate retries.
- [ ] Handle pending completion, failure, timeout, retry, and account changes.
      Show a result as awarded only when completion is confirmed; an optimistic
      reward estimate must never update the authoritative balance.
- [ ] Preserve account ownership in offline work. Reuse a verifiable session when
      retrying; never convert old unowned/unverifiable events into rewards for the
      currently signed-in account. Keep broader queue redesign in a separate step.
- [ ] Remove the local authoritative reward calculation and related TODOs after
      all callers migrate. Any remaining estimate must be labeled and independent
      of persisted progress.
- [ ] Update the mock contract within each migrated flow. Check session ownership,
      one-time completion, and server-supplied rewards; do not invent a second
      independent mock reward policy. Proxying to the local backend is acceptable
      if explicitly documented as the chosen development setup.

## Incremental PR plan

Each row is a review boundary, not permission to implement all rows at once.
Split a row further if it cannot remain one cohesive, reviewable PR.

| Step | Scope                                                                                                                          | Acceptance result                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 1    | Agree the required product rules, session lifecycle, completion DTOs, reward breakdown, and transaction/replay boundaries.     | Recorded decisions and concrete success/retry/failure examples; no implicit product changes.                                  |
| 2    | Article reading quiz sessions and completion, including server rewards and the corresponding frontend caller.                  | One reading session grants rewards once, concurrent completions retain increments, and the client displays the server result. |
| 3    | Article vocabulary sessions using the reviewed completion mechanism.                                                           | Trusted vocabulary inputs and answer types are validated; no local reward/progress writes remain in this flow.                |
| 4    | Dictionary sessions, per-answer attempt handling, and final completion.                                                        | Answer retries and completion do not double-apply learned-word progress or session rewards.                                   |
| 5    | Achievement grants from authoritative progress-changing operations, including non-quiz word changes; remove grants from GET.   | Reads do not change state; cascades/backfill follow agreed rules; mutation responses identify unlocks.                        |
| 6    | Remove arbitrary progress writes and the public streak activity bypass; reconcile remaining callers and legacy offline events. | No alternate endpoint or queue path can manufacture balance, counters, or learning completion.                                |
| 7    | Remove obsolete client calculations, temporary migration code, and stale documentation.                                        | All quiz kinds use the new contract, verification passes, and lasting API documentation is updated.                           |

Each quiz migration must already integrate its required achievement/streak effects
consistently; step 5 handles the remaining lazy-read paths and non-quiz sources.
Temporary mixed workflows remain incomplete while the old writable endpoints
exist. Close a bypass as soon as its callers have migrated, rather than leaving
it available after cleanup.

## Verification

- [ ] Server formula tests cover every accuracy threshold, supported difficulty and
      length, defaults, rounding, perfect result, and first-test eligibility.
- [ ] HTTP tests with real authentication cover missing/invalid/expired tokens,
      foreign or unknown sessions, invalid answers, client-supplied owners/scores/
      rewards, session expiry, and answer changes after completion.
- [ ] Database integration tests cover simultaneous completion of the same session,
      different sessions by one owner, first-test bonus contention, achievement
      uniqueness/cascades, and concurrent coin spending. Mock-only transaction
      tests do not establish real database concurrency guarantees.
- [ ] Failure tests cover transaction rollback, failures between effects, timeout
      after server commit, and retry after the client missed a successful response.
- [ ] Regression tests show profile reads are read-only, eligible existing accounts
      are handled by the agreed backfill, and word changes return unlocks without
      requiring a later profile GET.
- [ ] Tests enforce the agreed current/lifetime progress rules and the display of
      unlocked achievements after spending, deletion, relearning, and reset.
- [ ] Frontend tests cover every quiz kind, server-reported rewards and multiple
      unlocks, pending/error/retry UI, cache updates, repeated results, and logout/
      login while completion is in flight. No local balance grant is performed.
- [ ] Verify the mock/local-backend development path for the migrated contracts.
- [ ] Run relevant repository checks after each implementation/fix:
      `npm run ci:backend`, `npm run ci:frontend`, and `npm run typecheck`.
      If staged changes exist, run `npm run check:staged` on the actual staged
      snapshot and distinguish it from working-tree verification. Check this task
      document directly with Prettier as well as running the required docs check.

## Compatibility and related work

There are no production deployments or released mobile clients to support.
Update development frontend/backend together; legacy aliases and a forced mobile
rollout are not required. Do not keep an insecure setter as a compatibility layer.

Related work to track separately from quiz implementation:

- General coin-spending consistency: purchases, restore, and freeze operations need
  their own review of conditional debits, resource limits, rollback, and duplicate
  requests. Completion must coexist safely with spending, but this task does not
  authorize a broad rewrite of all purchase workflows.
- Product changes to lifetime counters, earning rules, retake eligibility, or
  notification UX require explicit decisions above and separately scoped changes.
- Personal `/me` route migration and shared error-code migration remain separate
  tasks. See [current-user API migration](current-user-api-migration.md) and
  [API error codes](api-error-codes.md).

## Main implementation locations

- `frontend/features/quiz/utils/calculateQuizReward/`
- `frontend/features/articles/api/mutations/useCompleteArticleQuizMutation/`
- `frontend/features/articles/screens/ArticleQuizScreen/components/articleQuizSession/`
- `frontend/features/dictionary/screens/DictionaryTestScreen/`
- `frontend/features/dictionary/api/mutations/useSubmitDictionaryTestAnswerMutation/`
- `frontend/features/achievements/api/updateAchievementsProgress/`
- `frontend/features/streak/api/mutations/`, `utils/`, `pendingActivityEventsStorage/`, and `hooks/useStreak/`
- `backend/src/achievements/{achievements.service.ts,achievements.controller.ts,dto.ts,definitions.ts}`
- `backend/src/articles/quiz/` and `backend/src/dictionary/`
- `backend/src/streak/{streak.controller.ts,streak.service.ts}`
- `backend/prisma/schema.prisma`, new migrations, and `mock-api/`

## Completion criteria

Complete when every supported quiz kind is verified and rewarded by the backend,
retries/concurrency cannot duplicate grants or lose increments, achievements and
streak consume verified events, profile GETs do not grant rewards, old bypasses
are closed, account caches/queues remain isolated, and the agreed checks pass.
Record any unresolved product decision or separate follow-up explicitly.

This is a temporary task document. Delete it only after all agreed task work is
completed; retain the final API contract and business rules in lasting project
documentation. Do not delete it after completing only one PR step.
