# Unused code analysis

Run commands from the repository root after installing root, frontend and backend
dependencies with their own lockfiles. Backend installation generates the Prisma
client required by the analysis.

```sh
npm run audit:unused
npm run audit:unused:root
npm run audit:unused:frontend
npm run audit:unused:backend
```

The full command checks application code and development consumers. To inspect a
specific category or get machine-readable output:

```sh
npm run audit:unused -- --include files
npm run audit:unused -- --include dependencies,unlisted
npm run audit:unused -- --include exports,types
npm run audit:unused -- --reporter json
```

Findings fail the command. Inspect errors to distinguish findings from a broken
configuration. Review findings before using `--fix`.

## Configuration

[knip.jsonc](../knip.jsonc) defines three analyzer workspaces for the independent
root, frontend and backend npm packages. It does not introduce npm workspaces.
Paths are relative to the owning package: `project` selects files to analyze;
`entry` identifies files loaded by frameworks or tools. A trailing `!` also
includes the pattern in optional production analysis.

- Frontend: Expo/Expo Router discover app entry, routes and config plugins; Jest
  and tooling plugins include development consumers.
- Native variants use the official [Metro entry pattern](https://knip.dev/reference/plugins/metro#note),
  adapted to our layout and `.ios`, `.android` and `.native` targets.
- Backend: Nest startup, unit/HTTP tests and explicit `*.e2e-spec.ts` entries.
  Prisma's schema is analyzed without executing its environment-dependent config.
- Root: npm lifecycle scripts and Husky/lint-staged tooling.

Three exact dependency exceptions are explained beside their configuration:

| Package                  | Why the exception exists                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Backend `@prisma/client` | Generated Prisma source imports its runtime; generated internals are excluded from analysis.                     |
| Backend `mathjax`        | The formula renderer loads `mathjax/node-main.cjs` through `createRequire`, which Knip does not recognize.       |
| Frontend `expo-updates`  | Knip assumes this optional package without an actual app consumer or updates configuration. It is not installed. |

Revisit exceptions when usage or analyzer support changes. Do not add broad
ignores to make the check pass.

## Reviewing findings

- An unused export can still have local consumers. Remove only the export or
  redundant re-export when the implementation is needed. Preserve side-effect
  imports, decorators and generated contracts.
- Native variants are entries, so Knip cannot detect every orphaned platform
  family or unused entry export. Check consumers and siblings before deletion.
- Native packages can be used by autolinking, Babel or config plugins. Check those
  consumers and verify native integration before removing a dependency.
- Direct imports require direct manifest declarations, even when the package is
  already installed transitively. Update manifests and lockfiles using npm;
  do not remove transitive packages manually.
- The analysis is not a complete unused-image/video audit.

Web-related names do not prove redundancy: react-dom is used by a frontend test;
react-native-web still needs separate native/tooling verification before removal.
Expo's `expo/types` independently augments Pressable state with `hovered` through
`expo-env.d.ts`; removing react-native-web does not remove that augmentation.
An isolated Jest compilation can see only native types while full tsc loads Expo's
ambient declarations.

## Pre-commit and CI

Every commit runs the full audit through [lint-staged](../lint-staged.config.mjs).
Its `--hide-all` mode checks the staged snapshot. Findings block the commit.

[CI](../.github/workflows/ci.yml) runs each scoped command in its owning job:
Root tooling, Frontend or Backend. Root findings therefore fail the root job.
Root `npm run ci` runs formatting, both application pipelines and the full audit.

`--production` is an optional comparison, not a replacement for the full check:
it excludes development entry points and can report valid test/tool consumers as
unused. See [Knip production mode](https://knip.dev/features/production-mode).
