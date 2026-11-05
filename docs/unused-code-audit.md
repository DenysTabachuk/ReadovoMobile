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

There are no custom dependency/file/export ignore rules. Known false positives
remain visible with evidence in the review report. Plugins also have built-in
heuristics; an absent finding does not prove that a package is necessary.

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
The plan is to resolve current findings in this branch through focused review.
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
