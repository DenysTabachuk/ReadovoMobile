# Task: Localize active streak copy

Status: planned. Do not implement as part of task preparation.

## Problem

The active StreakAchievementCard renders Ukrainian milestone, status and reward
copy directly. ProfileStreak can therefore show mixed languages in English mode.
The unused-code audit subsequently confirmed that StreakCard had no consumers
and removed it with its exclusive styles. That ownership decision is complete;
this task retains the active StreakAchievementCard localization work.

## Scope

- Confirm the actual render/import paths for active streak components. See the
  [completed unused-code audit](../unused-code-audit.md#completed-audit-2026-11-05)
  for the dormant StreakCard removal decision.
- Replace app-owned visible/accessibility copy in active streak components with
  translation keys in Ukrainian and English. Use interpolation and pluralization
  for milestone days and rewards rather than concatenated sentences.
- Keep existing streak calculations, rewards, API behavior, layout and colors.

## Acceptance and verification

- Active achievement/status/reward copy follows the selected language, including
  representative plural counts and locked/unlocked states.
- Update focused behavior tests, run `ci:frontend` and documentation formatting,
  and run `check:staged` when staged content exists.
- Review the profile streak/achievements in both supported languages on a device;
  report any unavailable device checks without claiming Jest verified rendering.
