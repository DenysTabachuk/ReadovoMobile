# Repository instructions

- Before changing `frontend/**`, read [frontend/AGENTS.md](frontend/AGENTS.md),
  including when the session starts from the repository root. Read the linked
  convention sections relevant to the task.
- Keep changes within the requested scope. Apply conventions to new, moved, and
  touched implementation; do not migrate unrelated code. Import-only updates do
  not require refactoring the module's existing implementation.
- Keep existing user changes intact. Report logical problems and material
  improvement opportunities found while working.
- In TypeScript, prefer inference, checked type annotations, generics and narrowing
  over type assertions (`as Type`). Validate untrusted data at runtime. Use an
  assertion only for a justified boundary the compiler cannot express, and explain
  the invariant locally. Do not bypass errors with `as any`, double assertions or
  non-null assertions. `as const` for literal inference is allowed. Apply this to
  new and touched code; do not perform unrelated assertion-removal sweeps.
- Write documentation in English, including task documents, unless the user
  explicitly requests another language.
- Treat documents created to track a task as temporary. Delete the task document
  once the task is fully completed; retain any lasting documentation in the
  appropriate project documentation. Keep task documents while work remains.
- Run checks relevant to the change and report what passed or could not run.
  Fix failures introduced by the task; distinguish pre-existing failures.
- Before handing changes back to the user, verify the final implementation with
  the relevant checks below. Rerun affected checks after subsequent fixes.
- When staged changes exist, also run `npm run check:staged` against the actual
  staged snapshot. A passing working-tree check does not verify staged content.
  Inspect staged/unstaged differences; never silently stage unrelated user changes.
  If nothing is staged, run the relevant working-tree checks and report that the
  staged check could not validate a commit snapshot; an empty run is not a pass.

## Backend utility documentation

- Every independent utility created, changed, or moved under `backend/**` needs
  concise JSDoc immediately above its implementation. Describe its responsibility,
  each input with `@param`, its output with `@returns`, and a concrete `@example`
  with the expected result. Omit `@param` for parameterless utilities; for `void`
  utilities, describe the effect in `@returns`.
- Document relevant edge cases, fallbacks, thrown errors, input mutation and side
  effects when they affect callers. Explain non-obvious invariants inline; document
  private implementation helpers only when their behavior is unclear.
- Apply this rule within the current task scope. Do not backfill unrelated existing
  utilities or add unrelated tests for documentation-only edits.

## Backend test organization

- Apply these rules to backend tests created, changed, or moved in the current
  task. Keep unrelated suites intact. Test observable behavior, regressions and
  meaningful boundaries; do not add cases solely to increase test counts or mirror
  implementation steps.
- Do not expand a feature task into a broader test-organization migration. Record
  existing structural debt in a separate task unless that refactoring is explicitly
  in scope; improve the tests required by the feature without reorganizing others.
- Give each test file a clear responsibility and test level. Split independent
  flows such as login, password reset, Google identity and authorization into
  focused suites instead of accumulating them in a module-wide catch-all file.
  Name files after their behavior or owner, using `.http.spec.ts` for HTTP contract
  suites under `backend/src` and `.spec.ts` for unit suites. Keep full-application
  e2e tests under `backend/test` with the existing `.e2e-spec.ts` configuration.
- Unit tests own direct service/utility behavior, including safeguards unreachable
  through DTO validation. HTTP contract tests own routing, DTO validation, guards,
  serialization, status, headers and public bodies. Do not mix direct service
  assertions into HTTP suites. Repeat scenarios across levels only when each
  level checks a distinct guarantee.
- Keep each case readable as setup, action and expected outcome. Use descriptive
  scenario names. Use `it.each` when cases share the same setup and assertion
  structure; avoid large tables of unrelated callbacks or setup branches selected
  by scenario-name strings. Group related cases with `describe`.
- Keep scenario-specific data and mock overrides beside the test. Extract repeated
  app construction and fixtures into narrowly owned test helpers when genuinely
  shared. Search for existing mocks and factories before creating new ones. Prefer
  typed factories that return fresh mocks/data for each test; keep them within the
  owning module until multiple modules demonstrate reuse. Do not share mutable
  mock singletons between suites.
  Helpers must expose their dependencies and lifecycle; avoid hidden Jest
  hooks, mutable fixtures shared across suites, or a generic test framework/DSL.
  Keep expected statuses, codes and response fields explicit in HTTP tests rather
  than deriving them from production definitions that could contain the same bug.
- Use the production boundary configuration in HTTP tests and keep the components
  being verified real. Mock external providers, mail and persistence at their
  boundaries; do not call live services. Restore clocks, environment variables,
  spies and app instances so cases do not depend on execution order.
- Before handing back test changes, review the file structure and coverage as well
  as the test results. When splitting suites, preserve meaningful cases, verify
  Jest discovers the new files, and run the affected suites and required checks.
  Avoid arbitrary file-length or test-count limits; split by responsibility.

## Commands

Run from the repository root:

- Frontend checks: `npm run ci:frontend`.
- Backend checks: `npm run ci:backend`.
- TypeScript for both projects: `npm run typecheck`.
- Instruction/documentation formatting: `npm --prefix frontend run docs:check`.
- Pre-commit staged checks: `npm run check:staged`.

Root `npm install` / `npm ci` runs `scripts/setup-git.cjs` before installing Husky.
On Windows it enables `core.longpaths` for this checkout so Git can prepare and
restore deeply nested component files during staged checks. For an existing
installation, rerun `npm run prepare` from root to apply the setup.

CI configuration lives in `.github/workflows/ci.yml`. Local staged checks are
configured in `lint-staged.config.mjs` and `.husky/pre-commit`; they check the
staged snapshot. Keep commands in these configurations as the source of truth.
