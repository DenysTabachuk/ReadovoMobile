# Task: Handle language preference save failures

Status: planned. This is a failure path identified by code inspection, not a
reported occurrence during normal app use. Do not implement as part of planning.

## Problem

`PreferencesProvider.setLanguagePreference` currently changes the i18n language,
then saves to AsyncStorage and finally updates provider state. If storage rejects,
the displayed language can differ from the selected/stored language. LanguageOption
discards the setter promise without reporting that rejection.

## Scope

- Review language selection, initialization and their actual callers.
- Define an explicit failure-safe update order and recovery behavior for storage
  and i18n failures. A successful choice must agree across i18n, provider state and
  storage; failures must not silently report success or leave an unhandled promise.
- Keep the interaction simple: disable selection during a save and guard taps
  arriving before the disabled state renders. Do not introduce a write queue or
  request-version tracking without a demonstrated need.
- Use existing localized feedback and retain the last committed selection on a
  recoverable failure. Keep late feedback from appearing after screen unmount.
- Handle unsuccessful recovery explicitly if the chosen approach needs rollback;
  storage and i18n do not form an atomic transaction.

## Acceptance and verification

- Test successful selection and rehydration after restart, storage rejection,
  i18n rejection, retry, repeated taps and feedback after unmount.
- Verify selected language, displayed language and persisted value through real
  provider behavior with mocked storage/i18n boundaries.
- Add copy in both supported locales where needed. Preserve theme persistence,
  auth/session behavior and unrelated preferences.
- Run `ci:frontend`, documentation formatting and `check:staged` if staged changes
  exist. Record device verification separately from Jest assertions.
