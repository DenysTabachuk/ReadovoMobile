# Repository instructions

- Before changing `backend/**`, read [backend/AGENTS.md](backend/AGENTS.md),
  including when the session starts from the repository root.
- Before changing `frontend/**`, read [frontend/AGENTS.md](frontend/AGENTS.md),
  including when the session starts from the repository root. Read the linked
  convention sections relevant to the task.
- Before changing HTTP endpoints, request/response DTOs, Swagger metadata or
  frontend API transport types, read [docs/openapi-contract.md](docs/openapi-contract.md).
- Keep changes within the requested scope. Apply conventions to new, moved, and
  touched implementation; do not migrate unrelated code. Import-only updates do
  not require refactoring the module's existing implementation.
- Keep existing user changes intact. Report logical problems and material
  improvement opportunities found while working.
- Write new JavaScript scripts as ES modules with the `.mjs` extension and static
  `import` statements. Use `import.meta.url` for paths relative to the script.
  Keep npm commands and relevant formatting, linting and staged-check patterns in
  sync with `.mjs` files. Retain another format when required by the tool that loads
  the file; do not migrate unrelated existing scripts just to apply this preference.
- In TypeScript, prefer inference, checked type annotations, generics and narrowing
  over type assertions (`as Type`). Validate untrusted data at runtime. Use an
  assertion only for a justified boundary the compiler cannot express, and explain
  the invariant locally. Do not bypass errors with `as any`, double assertions or
  non-null assertions. `as const` for literal inference is allowed. Apply this to
  new and touched code; do not perform unrelated assertion-removal sweeps.
- Write documentation in English, including task documents, unless the user
  explicitly requests another language.
- Treat database seeds as test/sample data by default. Do not present them as
  approved production content; production data imports require explicit agreement.
- Store temporary task documents in `docs/tasks/`. Delete the task document once
  the task is fully completed; retain lasting documentation outside `docs/tasks/`
  in the appropriate project documentation. Keep task documents while work remains.
- Run checks relevant to the change and report what passed or could not run.
  Fix failures introduced by the task; distinguish pre-existing failures.
- After substantial user-facing UI, navigation or API integration changes, run
  the [Readovo emulator check](.agents/skills/readovo-emulator-check/SKILL.md)
  proactively. Reuse existing authorization and report actual device coverage.
- Before handing changes back to the user, verify the final implementation with
  the relevant checks below. Rerun affected checks after subsequent fixes.
- When staged changes exist, also run `npm run check:staged` against the actual
  staged snapshot. A passing working-tree check does not verify staged content.
  Inspect staged/unstaged differences; never silently stage unrelated user changes.
  If nothing is staged, run the relevant working-tree checks and report that the
  staged check could not validate a commit snapshot; an empty run is not a pass.

## Brainstorming and decision approval

- Before implementing a large feature, making an important architectural decision,
  or changing an API contract or data model, review the relevant code and discuss
  the open decisions with the user. Present viable approaches, their tradeoffs and
  a recommendation, then wait for agreement on the direction before implementing
  the affected work.
- Use the request and previous agreements to identify decisions that are already
  settled. Continue within the agreed direction and bring new significant
  decisions back to the user when they arise.
- Routine implementation details and small fixes may proceed autonomously within
  the requested scope.
- Seek approval of visual/UI design only when the user explicitly requests it.
  Apply the significant-decision rule above to architecture, API contracts and
  data models involved in UI work.

## Required and optional inputs (frontend and backend)

- Make function parameters, hook inputs and component props required when the
  operation needs them to work correctly. Do not add `?`, `| undefined` or `| null`
  merely because a caller has not validated or loaded the value yet.
- Validate or resolve required values at the nearest input boundary. Handle
  missing, invalid and loading states there before calling the operation. In
  React, preserve unconditional hook calls by rendering a child with validated
  required props when appropriate; do not weaken the hook's input contract.
- Use optional inputs only when omission has a meaningful supported behaviour,
  such as an optional callback, an absent filter or a deliberate default. Make
  that behaviour clear in the implementation or documentation.
- Preserve genuine optional/nullable external contracts and domain states. Do not
  hide missing data with assertions, placeholder values or arbitrary defaults to
  satisfy a required type.
- Check actual callers when choosing the input contract. Apply this rule to new
  and touched code within the task; do not sweep unrelated optional fields.

## Conditional readability (frontend and backend)

- Do not nest ternary expressions. Use a ternary only for a short, straightforward
  choice between two values; use `if`/`else` for multiple branches or business
  calculations. Name intermediate results when that makes the decision clearer.
- Do not compress several business decisions into dense expressions or replace
  nested ternaries with equally obscure boolean/fallback chains. Keep meaningful
  defaults explicit and preserve required missing-data handling.
- Apply this rule to new and touched implementation within the task scope;
  do not rewrite unrelated conditionals.

## Constants and magic values (frontend and backend)

- Replace non-obvious literals that encode business rules or design decisions,
  such as rewards, thresholds, limits, durations and repeated identifiers, with
  semantically named constants. Name their meaning and units where useful, not
  their raw value: `FIRST_TEST_BONUS_COINS`, not `BONUS_10`.
- Keep values at their narrowest owner. Keep single-owner constants local;
  introduce shared constants only when multiple owners use the same concept.
  Do not duplicate a shared rule across frontend and backend.
- Do not extract self-explanatory literals such as `0`, `1`, `true` or `false`
  when their meaning is clear. Named policy tables may contain literal values
  when their keys and fields already explain each value's role.
- Apply this rule to new and touched implementation within the task scope;
  do not perform unrelated constant-extraction sweeps. Frontend theme/token and
  StyleSheet guidance remains in the frontend convention guide.

## OpenAPI contracts and generated transport types

- Backend DTOs, validation and Swagger metadata own the HTTP contract. When an
  API changes, update its inputs, serialized responses, statuses, security and
  reachable errors together with the affected frontend consumers and fixtures.
- After a contract change, run `npm run contracts:generate`, then
  `npm run contracts:check` from the repository root. Keep source changes,
  `backend/openapi/openapi.json`, `frontend/api/generated/transport.d.ts` and
  affected generated response validators together in the same review/commit.
  Preserve the user's staging choices; do not stage files automatically.
- Never edit generated artifacts manually. Frontend consumers use direct named
  exports from the generated transport types instead of duplicating request or
  response fields. Feature re-exports, aliases and UI/domain adaptations may
  compose those types; frontend production code must not import backend DTOs.
- Add or update relevant HTTP contract tests to verify actual serialization,
  nullable/optional fields, statuses, security and errors against the documented
  contract. Generated types and HTTP-client generics do not validate received JSON;
  preserve runtime decoders and auth/session safeguards.
- Keep export deterministic and offline: no HTTP listener, database connection,
  environment-file/secret reads, external services or background jobs. When adding
  a module or changing export composition, verify route coverage, export isolation
  and runtime Swagger parity with the relevant tests described in the guide.

## Commands

Run from the repository root:

- Frontend checks: `npm run ci:frontend`.
- Backend checks: `npm run ci:backend`.
- TypeScript for both projects: `npm run typecheck`.
- Generate OpenAPI and frontend transport types: `npm run contracts:generate`.
- Check contract freshness without writing files: `npm run contracts:check`.
- Instruction/documentation formatting: `npm --prefix frontend run docs:check`.
- Pre-commit staged checks: `npm run check:staged`.

Root `npm install` / `npm ci` runs `scripts/setup-git.cjs` before installing Husky.
On Windows it enables `core.longpaths` for this checkout so Git can prepare and
restore deeply nested component files during staged checks. For an existing
installation, rerun `npm run prepare` from root to apply the setup.

CI configuration lives in `.github/workflows/ci.yml`. Local staged checks are
configured in `lint-staged.config.mjs` and `.husky/pre-commit`; they check the
staged snapshot. Keep commands in these configurations as the source of truth.
