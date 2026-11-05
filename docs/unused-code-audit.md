# Unused code analysis

Run `npm run audit:unused` from the repository root after installing the root,
frontend and backend dependencies with their own lockfiles. Knip is pinned in the
root manifest. It needs Node 20.19+ on the 20.x line or Node 22.12+; CI uses Node 22.
Prisma's generated client should already exist after backend installation.

The command invokes Knip directly using `knip.jsonc`. There are no custom import
rewriters, platform passes, report-merging scripts or audit environment variables.
The default analysis includes application code and development consumers. Exit 1
means findings exist; configuration errors can also fail the command, so inspect
the output. Do not use `--fix` before reviewing a cleanup.

```sh
npm run audit:unused -- --include files
npm run audit:unused -- --include dependencies,unlisted
npm run audit:unused -- --include exports,types
npm run audit:unused -- --reporter json
```

## Configuration and entry points

`knip.jsonc` declares three analyzer workspaces matching three independent npm
packages. It does not introduce npm workspaces or change dependency resolution.
Paths inside each workspace are relative to its directory. `project` lists source
files to inspect; `entry` describes files loaded by tools/frameworks rather than
ordinary source imports. A trailing `!` includes a pattern in production analysis.

- Root: npm lifecycle scripts and Husky/lint-staged configuration.
- Frontend: Expo and Expo Router plugins read `app.json`, its config plugins,
  `expo-router/entry` and file routes. Jest, ESLint, TypeScript and script discovery
  include development consumers.
- Native variants: `frontend.metro.entry` follows the official
  [Metro plugin guidance](https://knip.dev/reference/plugins/metro#note). Its glob
  covers `.ios`, `.android` and `.native` files across the actual frontend layout,
  rather than Knip's default `src` directory. Web/Windows targets are not added.
  The documentation link is also beside this setting in `knip.jsonc`.
- Backend: `src/main.ts`, Nest module imports/decorators, Jest unit/HTTP suites,
  explicit e2e entries and `test/jest-e2e.json`. Knip's default Jest file patterns
  do not recognize this repository's `*.e2e-spec.ts` suffix from `testRegex`.
- Prisma: its plugin parses the schema; `prisma7.config.ts` is analyzed as source,
  not executed. Loading that config would run `dotenv/config` and require an
  environment variable. The audit needs neither a secret nor a database.
- Script discovery follows the offline OpenAPI exporter and transport generator.
  Generated transport types remain reachable. Ignored generated Prisma internals
  are not hand-cleanup candidates.
- Side-effect imports remain real graph edges: localization, Reactotron and
  Reanimated in the root layout must survive an unused-export cleanup.

## Limits and review

The documented Metro approach treats platform variants as entries. Consequently,
Knip alone cannot prove that an entire platform family has lost all consumers;
entry exports are also not checked by default. Search the module's consumers and
platform siblings before approving their deletion. This is an explicit limitation
of the standard setup, not a claim of complete Metro resolution parity.

There are no custom file/export ignores. Three individual dependency exceptions
are documented beside their names in the configuration: generated Prisma source
needs `@prisma/client`, a `createRequire` call loads `mathjax/node-main.cjs`, and
Knip assumes the optional `expo-updates` package without an app configuration or
source consumer. Remove an exception when analyzer support makes it unnecessary.
Plugins also have built-in heuristics; an absent finding does not prove that a
package is necessary. Direct source imports require direct manifest declarations,
even when another installed package already supplies the dependency transitively.

Knip does not validate Gradle/Pod linkage or arbitrary binary assets. Review
autolinking, Expo modules, Babel and config-plugin usage before removing native
packages. Static asset require calls are followed, but this is not a complete
unused-image/video audit. Never remove transitive dependencies by hand.

## Pre-commit and CI

The pre-commit hook runs the complete audit on every commit through lint-staged's
catch-all rule, after TypeScript and contract checks pass. `--hide-all` ensures
these checks see the staged snapshot, including unchanged tracked files, rather
than unstaged fixes. Existing findings block the commit; no baseline is accepted
automatically.

CI has three separately named jobs, each reporting only its owning package:

| Job          | Audit command                   | Installation                                              |
| ------------ | ------------------------------- | --------------------------------------------------------- |
| Backend      | `npm run audit:unused:backend`  | Root tooling and backend, including Prisma generation.    |
| Frontend     | `npm run audit:unused:frontend` | Root tooling and frontend.                                |
| Root tooling | `npm run audit:unused:root`     | Root dependencies only; also runs `npm run format:check`. |

These are workspace filters on the same static Knip configuration. Root findings
fail the root job, not the frontend job. Jobs run on pull requests and pushes to
main, with no path filters, accepted-finding baseline or `continue-on-error`.
Root `npm run ci` runs formatting, both application checks and the complete audit.

`npm run audit:unused -- --production` is an optional secondary comparison. It
excludes development entry points and cannot replace the full run. Test helpers
under src and offline OpenAPI tooling can appear unused in this mode despite
having development consumers. The backend's `start: nest start` can also report
the development `nest` binary. Never remove test/tool dependencies solely from
production-mode findings.

See [Knip workspaces](https://knip.dev/features/monorepos-and-workspaces),
[configuration](https://knip.dev/reference/configuration) and
[production mode](https://knip.dev/features/production-mode).

## Completed audit: 2026-11-05

The initial full run had 192 findings: 12 unused files, 63 value exports,
102 type exports, six runtime dependencies, four development dependencies and
five unlisted dependencies. Consumer checks and approved cleanup resolved them;
the final full and package-scoped audits pass without findings. There is no
accepted-finding baseline and no file/export ignore list.

Removed code includes dormant starter UI, the duplicate screen-local article
thumbnail, StreakCard and their exclusive styles; obsolete request/token getter
wrappers; and the exclusive streak reminder helper and its tests. The active
article thumbnail, StreakAchievementCard, token/session infrastructure and
side-effect modules remain. Most export findings required removing redundant
barrel exports or making locally used declarations private. Swagger DTOs, Zod
schemas, active helpers and generated contracts were preserved.

### Dependency decisions

| Decision                                     | Evidence                                                                                                                                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remove root i18next/react-i18next            | Root tooling has no consumers. Frontend owns and retains its localization dependencies.                                                                                                             |
| Remove json-server                           | Its only owner was the removed development mock server.                                                                                                                                             |
| Remove backend @eslint/eslintrc              | Flat ESLint configuration does not use eslintrc compatibility.                                                                                                                                      |
| Remove direct pg/@types/pg declarations      | Backend uses PrismaPg; @prisma/adapter-pg owns these dependencies and npm retains them transitively.                                                                                                |
| Remove direct source-map-support declaration | No project import/preload; Jest retains its own transitive dependency.                                                                                                                              |
| Remove ts-loader                             | The configured Nest TypeScript build does not use the optional webpack builder. Production build passes without it.                                                                                 |
| Declare express directly                     | configure-api-boundaries.ts directly calls json/urlencoded. Version 5.2.1 was already installed through the Nest Express adapter.                                                                   |
| Declare three frontend test dependencies     | Jest config uses @babel/preset-react and @babel/plugin-transform-modules-commonjs; rootAuthNavigation.spec.ts directly imports @react-navigation/routers. Existing installed versions are retained. |
| Remove expo-web-browser                      | Its only app consumer was dormant ExternalLink. No remaining source, Router dependency or config-plugin consumer was found. Native integration checks pass after removal.                           |
| Retain @prisma/client and mathjax            | Generated Prisma runtime and createRequire usage explain the two exact backend analyzer exceptions.                                                                                                 |
| Do not add expo-updates                      | The app does not configure/import this optional package. The exact frontend exception corrects Knip's Expo assumption. OTA updates are not enabled by this audit.                                   |

Manifests and lockfiles were updated using npm. Transitive packages were never
manually removed. Installed package versions were not upgraded as part of the
new direct declarations. Network-backed npm checks also reported installed-tree
security advisories; dependency security remediation was outside this audit.

### Native product and Expo web types

The browser start command and app.json's web output/favicon settings were removed.
Native build settings and assets were not changed. These removals do not imply
that every dependency with a web-related name is unnecessary:

- react-dom remains used by the DictionaryTestScreen test through
  jest.requireActual('react-dom/server').
- react-native-web is retained as a separate candidate for future verification.
  Router declares it as an optional peer and Expo CLI has web prerequisite logic;
  this audit does not establish that native tooling requires the direct package.
  It is not suppressed through a custom Knip exception.
- Expo's environment declaration and TypeScript roots remain tooling inputs.
  They do not indicate that the app supports browsers.

The Pressable `hovered` property comes from Expo itself, not from the installed
react-native-web package:

```text
tsconfig.json includes expo-env.d.ts
  -> reference types="expo/types"
  -> expo/types/index.d.ts references ./react-native-web
  -> declare module 'react-native'
  -> PressableStateCallbackType gains readonly hovered: boolean
```

React Native's native declaration has only pressed. Full TypeScript checking
loads the Expo ambient reference; an isolated ts-jest import graph can omit it.
Compiler API checks reproduced both shapes with the same compiler options and
different root files. Runtime Jest mocks do not change these declarations.
Removing react-native-web would not remove Expo's type augmentation.

### Verification and follow-ups

The final checks include root CI (formatting, both application pipelines and the
full audit), the three package-scoped audits, backend production build, lockfile
consistency and the actual staged-snapshot checks. Frontend has 151 passing suites
and 789 tests; backend has 95 passing suites and 815 tests. Generated OpenAPI and
transport artifacts remain current without edits.

After native dependency removal, Android and iOS production JS/Hermes exports
and Expo autolinking resolution for both platforms pass. An offline Android
debug APK build for x86_64 passes. Native iOS compilation and device smoke tests
were not run on this Windows host. Database smoke tests were not run.

Separate requested follow-ups remain in
[the TensorFlow removal task](tasks/remove-tensorflow-dictionary-embeddings.md)
and [the backend-owned freeze-token limit task](tasks/streak-freeze-token-limit-contract.md).
They are not implemented by this audit.
