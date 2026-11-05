# Unused code audit: review overview

Status: standard Knip configured; initial audit complete; awaiting focused cleanup review.
Date: 2026-11-05. Base: main at 08e0c12.
Branch: chore/unused-code-dependency-audit.

The user approved removal of the development mock server and replacement of the
custom native adapter with Knip's documented Metro entry configuration. The mock
directory, command and exclusive json-server declaration are removed. The custom
adapter/configuration wrapper, platform runner, merger and their tests are removed.
Other application cleanup and native build changes remain subject to review.
No commit or staging action is authorized by this report.

## Review order

1. Analyzer setup: knip.jsonc, root manifest/lockfile, staged configuration and CI.
   See [usage documentation](../unused-code-audit.md). Platform entry configuration
   includes the official documentation link beside its glob. No per-component
   entries, custom import rewriting or report merging remain.
2. [Dependencies and Expo](unused-code-dependency-review.md).
3. Dormant files below, including StreakCard ownership.
4. [Exports by owner](unused-code-export-inventory.md). Review individual modules
   separately; setup approval does not approve all cleanup.

## Baseline

Full Knip 6.44.1: 12 files, 63 value exports, 102 type exports, 6 dependencies,
4 dev dependencies and 5 unlisted dependencies (192 findings). No unresolved
imports, duplicate exports, enum/namespace member or binary findings in the full
run. Exit 1 is expected while findings remain; configuration completes normally.

CI has separate root, frontend and backend jobs. Each analyzes only its own
workspace. Pre-commit runs the complete repository audit. Existing findings fail
both checks, with no accepted-finding baseline or warning-only phase. The plan is
to resolve findings in this branch through focused review.

## Confirmed dormant files

Confidence is high for the current checked-out source graph. Verification combined
Knip with searches for component names, paths, barrels and dynamic imports. No
runtime registry or route references these components. No files were deleted.

| Owner              | File(s), relative to frontend                                                                 | Evidence and proposed action                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared UI          | `components/collapsible/index.tsx`, `styles.ts`                                               | Only definition/internal style edge; no caller. Propose deleting together.                                                                         |
| Shared UI          | `components/externalLink/index.tsx`                                                           | Only definition; no route/barrel consumer. Review with the expo-web-browser decision.                                                              |
| Shared UI          | `components/floatingActionButton/styles.ts`                                                   | Active component delegates to Cta and does not import this file. Delete only obsolete styles, retain the component.                                |
| Shared UI          | `components/helloWave/index.tsx`                                                              | Definition only; dormant starter component.                                                                                                        |
| Shared UI          | `components/parallaxScrollView/index.tsx`, `styles.ts`                                        | Internal pair only; no caller.                                                                                                                     |
| Articles           | `features/articles/screens/ArticlesScreen/components/articleThumbnail/index.tsx`, `styles.ts` | Dormant screen-local pair. Active articleCard uses the separate `features/articles/components/articleThumbnail` implementation; preserve that one. |
| Learning reminders | `features/learningReminders/api/types.ts`                                                     | Unreferenced transport re-export file; active consumers use other owned types. Preserve generated transport artifact.                              |
| Streak             | `features/streak/components/streakCard/index.tsx`, `styles.ts`                                | StreakCard has no imports, barrel export or route/dynamic consumer. Active profile uses StreakAchievementCard instead.                             |

Streak cleanup belongs to [the localization task](streak-localization.md): propose
removing dormant StreakCard and its exclusive styles after explicit review. Do
not localize dormant UI in parallel. `weekDayLabels` is only consumed by StreakCard
and unused barrel exports; review it with that cleanup. `streakMilestones` also
has no active consumer; keep its reward-rule decision separate. This audit does
not implement that task or change active streak behavior.

## Export triage

The inventory lists all 165 findings, including multiple unused barrel exports of
the same declaration. These counts are exports, not 165 independent dead features.

- **Confirmed unused public surface, preserve implementation:** article block DTO
  classes are referenced locally through Swagger decorators and getSchemaPath;
  Ai* schemas compose other schemas; parseInlineNodes has local callers. Their
  export modifiers may be redundant, but deleting the declarations would break
  behavior or contracts. The same applies to locally used validation/reward/test
  constants and types. Review export narrowing only.
- **Confirmed side-effect usage:** `devtools/reactotron.ts` is imported by the
  root layout. Its named export is unused; the module and dependency are used.
- **Confirmed dormant callable candidates:** searches for
  `fetchRandomWikipediaArticles`, `getAccessToken` and `getRefreshToken` found only
  definitions and re-exports. They are candidates for a focused owner review, not
  authorization to alter auth/session code.
- **Barrel findings:** achievements, dictionary, mascot, streak, article storage,
  auth API and component type exports often have implementations consumed directly
  within the owner. Remove only redundant re-exports after each owner's review;
  do not delete their request functions/hooks based on a barrel finding.
- **Additional verification:** generated transport re-exports and backend domain
  aliases need a per-symbol local-use check before deciding between removing an
  export modifier, removing an alias or preserving an intentional public API.
  Complete paths/names are in the inventory; these are explicitly pending review.

## Limitations and verification

The official Metro setup treats native variants as entries. It avoids false
unused-file reports for the iOS IconSymbol sibling but cannot prove an entire
platform family is orphaned. Entry exports are not checked by default. Check
consumers and sibling files manually before deleting platform implementations.
No broad ignore rules are added. Native autolinking/build behavior and binary
asset ownership still need manual verification for any approved cleanup.

The backend e2e suites are included through their dedicated configuration and
explicit filename entries. MathJax and generated Prisma runtime false positives
remain documented in the dependency review rather than suppressed.

Previously completed application checks: frontend 152 suites / 797 tests;
backend 95 suites / 815 tests, including TypeScript, lint, formatting and contract
freshness. Application implementation has not changed during analyzer simplification.
Compiler API comparison reproduced native Pressable state with pressed and full
Expo-augmented state with pressed/hovered; this conclusion does not depend on
the removed custom Knip adapter.

Root retains Prettier for its own formatting. The adapter's direct TypeScript
declaration is removed with the root lockfile updated by npm. npm may retain a
TypeScript package as an optional peer of the existing root i18n declarations;
transitive packages are not manually deleted.

Verification: the complete audit and all three scoped commands complete with
findings/exit 1. Scoped reports are disjoint and together equal all 192 full
findings. The native entry glob includes the iOS IconSymbol implementation without
a per-component entry. Production comparison also completes with findings.
Root formatting, documentation formatting, TypeScript, contract freshness,
git diff --check, npm ls and the offline root lockfile dry-run checks pass.

The actual staged check fails because format:staged is absent from the older
staged package.json; remaining checks are interrupted/skipped. lint-staged
restores the original state. The staged diff hashes immediately before and after
that check match. No files were staged automatically. GitHub-hosted jobs and
native builds have not been run from this local session.
