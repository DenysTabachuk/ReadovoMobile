# TODO: Organize learning reminder workflows

Status: TODO. Identified during the notification OpenAPI migration review.

## Problem

`frontend/features/learningReminders/service.ts` groups native push registration,
device-ID persistence, backend preference synchronization and preference loading.
These independently testable workflows need named owners under the frontend
utility conventions. `frontend/app/_layout.tsx` also imports the feature's internal
service directly instead of using a public feature entry point.

## Scope

- Move `registerCurrentDevicePushToken`, `syncLearningReminder` and
  `loadLearningReminderPreferences` into their own
  `learningReminders/utils/<utilityName>/index.ts` directories. Keep the existing
  `parseLearningReminderPreferences` utility separate.
- Keep helpers used only by registration (device ID, permissions and Android
  channel setup) private in its implementation. Extract another helper only for
  a meaningful independent responsibility or demonstrated reuse.
- Add `learningReminders/index.ts` as an intentional public export surface.
  Update app-level imports and mocks to use it. Keep internal feature imports
  local and API request functions in their existing `api/requests` directories.
- Keep private parameter types beside their utility, before constants and code.
  Place shared types/constants at the narrowest actual owner. Document each moved
  utility with inputs, results, side effects, failure handling and an example.
- Review session safety across preference updates, native permission/token awaits,
  device-ID storage and token registration. An in-flight workflow from an old
  session must not continue requests or session-specific effects for a new account.
  Preserve the existing authenticated HTTP client and add appropriate checks
  between steps; do not add redundant guards around isolated HTTP operations.
- Preserve valid-request behavior, Android-only registration, generated transport
  types and runtime preference decoding. Give the shared warning-suppression state
  an explicit owner/lifetime rather than accidentally changing it during extraction.
- Do not turn this structural task into a general notification redesign. Existing
  logging and development-dispatch risks remain tracked in the
  [application abuse audit](application-abuse-risk-audit.md).

## Acceptance and verification

- No aggregate implementation remains in `learningReminders/service.ts`; remove
  the obsolete file after updating callers and mocks.
- Move the existing registration tests and add meaningful colocated `index.spec.ts`
  coverage for each extracted workflow. Mock native, storage and HTTP boundaries.
  Cover denied permission, unsupported token platform, backend failures, disabled
  reminders, malformed preferences and account changes between awaited steps.
- Check actual callers and effect ownership; preserve per-call UI callbacks and
  owner-specific cache/session behavior where applicable. Review the complete diff
  for feature boundaries, private helpers, JSDoc and utility organization.
- Run `npm run ci:frontend`, instruction/task-document formatting and
  `npm run check:staged` when staged changes exist. Preserve the user's existing
  changes and staging; distinguish existing failures from regressions.

Delete this task once the work is complete; keep lasting conventions in the
frontend guide rather than this temporary task.
