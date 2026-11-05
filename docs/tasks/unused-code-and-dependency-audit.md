# Task: Set up Knip and audit unused code, dependencies and Expo configuration

Status: analyzer and initial audit implemented at the user's request. Awaiting
review before further cleanup. Only the separate mock-server removal and its
exclusive root dependency were subsequently approved and completed; no native
configuration change has been approved. Start with the [review overview](unused-code-audit-review.md)
and [analyzer usage](../unused-code-audit.md).

The user requires the complete audit on every commit and in CI, with failures
blocking the check immediately. No accepted-finding baseline or warning-only CI
phase is planned; findings will be resolved in this branch through focused review.
Native platform files use Knip's documented Metro entry patterns, linked beside
the configuration. The custom native adapter and platform-report scripts are removed.

## Goal

Provide a repeatable inventory of unused files, exports and dependencies, then
review what can actually be removed. The mobile app targets native platforms;
browser support is not a product requirement. This is broader than removing web
configuration: inspect runtime dependencies, development tools and implicit usage.

## Scope

- Inspect the actual root/frontend/backend npm package layout before configuring
  Knip. Support the existing structure without migrating package managers or
  introducing workspaces solely for the tool.
- Configure relevant entry points and plugins for Expo Router, native app entry,
  NestJS, tests, scripts, build tools and generated contracts. Account for assets,
  side-effect imports, platform-specific files and native/config-plugin usage.
- Add a documented root command to run the analysis. Check both application and
  development usage; production-only analysis must not label test/tool dependencies
  unused simply because development entry points were excluded.
- Review each finding against real consumers. Distinguish confirmed unused code
  from implicit framework usage, dynamic registration and unresolved findings.
  Record narrow, explained exceptions instead of ignoring whole directories or
  dependency families to obtain a clean result.
- Audit direct dependencies/devDependencies in all three package manifests. Do
  not manually remove transitive packages or treat a missing source import as
  sufficient evidence that a native package is unused.
- Inspect Expo web scripts/configuration, direct web dependencies, TypeScript
  includes and Expo's web type augmentation. Explain why `hovered` enters the
  full typecheck while an isolated Jest suite can see only native Pressable types.
  Remove genuinely unnecessary web setup while preserving native Expo tooling.
- Include StreakCard in the unused-code findings; coordinate its ownership with
  [the streak localization task](streak-localization.md).

## Review boundary

First deliver the configured analyzer and a categorized baseline report for
review. Propose any CI enforcement with its baseline/exception policy. Stop before
bulk deletion, dependency removal or native build configuration changes.
Subsequent approved cleanup must update the owning manifest and lockfile together
and verify native/config-plugin behavior where applicable.

## Acceptance and verification

- Knip can run reproducibly from the documented command against the actual package
  structure, with useful findings rather than a blanket suppression baseline.
- The report identifies files/exports/dependencies, evidence, owner, confidence,
  exceptions and proposed next actions. Knip output alone is not proof of safe
  removal, particularly for native dependencies.
- Explain which web-related entries are required by Expo tooling, unnecessary for
  the product or still uncertain. Do not add web support as part of this task.
- Run applicable repository checks for touched packages, documentation formatting
  and `check:staged` when a staged snapshot exists. Verify installation/lockfile
  consistency and relevant native builds after approved dependency cleanup.
- Do not commit, stage user changes, update APIs or alter business behavior as a
  side effect of introducing the analyzer.
