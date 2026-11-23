# Backend instructions

These instructions complement the repository-wide rules in
[the root AGENTS.md](../AGENTS.md). Keep shared readability, constants,
TypeScript, scope and staged-verification rules there rather than duplicating them.
Before changing HTTP contracts, also read
[the OpenAPI contract guide](../docs/openapi-contract.md).

## Database seeds

- Treat seeds as test/sample data as required by the root instructions. Keep the
  Prisma seed entry point in `prisma/seed.ts` and feature-owned seed data, import
  logic, validation and unit tests under `prisma/seeds/<feature>/`, outside
  production `src/**`. Clearly label sample content in names/comments and keep
  seed execution explicit. Include seed TypeScript in relevant lint, formatting,
  type and test checks.

## Module ownership and validation

- Keep one class declaration per source file, including DTOs and nested Swagger
  response models. Name each file after its class/responsibility and import composed
  models from their own files. Apply this to classes created, moved or changed
  within the task; do not split unrelated existing files or generated code.
- Keep new feature request and response DTOs in the owning module's `dto/`
  directory. Use operation-specific filenames: `<operation>.dto.ts` for input and
  `<operation>-response.dto.ts` for the serialized response, for example
  `dto/translate-word.dto.ts` and `dto/translate-word-response.dto.ts`. Name other
  DTOs after their specific responsibility; avoid aggregate `dto.ts` files. Apply
  this to DTOs created or moved within the task; do not reorganize unrelated modules.
- Keep feature-specific DTOs, domain types, constants, error definitions and
  utilities in their owning NestJS module. Keep exclusive implementation helpers
  private. Apply these rules within the task scope; do not migrate unrelated code.
- Use `common` for domain-independent infrastructure and contracts with actual
  reuse. A generic name or a potential future consumer does not justify moving
  feature code there. For example, mascot item/slot DTOs belong in `mascot`, while
  a genuinely shared user-ID parameter DTO may stay in `common`.
- Feature modules may depend on shared infrastructure; shared production code must
  not import feature internals. Application composition and catalogues may assemble
  module-owned public definitions. Tests may exercise real modules at boundaries.
- Expose cross-module providers through NestJS module exports only when a real
  consumer needs them. Use intentional public providers/contracts to communicate
  between modules; do not import another module's private DTOs or helpers.
- Define request DTOs at the module that accepts the request. Reuse shared base
  DTOs only for genuinely shared fields; do not put domain-specific fields in a
  shared base and conceal them behind an empty feature subclass.
- Validate request structure, formats and static input ranges in DTOs through the
  global validation pipe. Keep business rules and checks against persisted state
  in services. Do not duplicate DTO validation for hypothetical internal callers;
  verify actual call sites before adding or retaining another validation boundary.
  Persisted data and external provider responses require their own runtime checks.
- For new or touched OpenAPI-documented endpoints protected by `UserAuthGuard`,
  use the auth module's method decorator `@ApiUserAuth({ errors, validation })`.
  It installs the real guard and documents Bearer security, token errors and shared
  HTTP errors together. Import `AuthModule` in the owning feature module. Supply
  only operation-specific errors and opt into DTO validation when applicable;
  do not repeat token error lists or stack `ApiErrorResponses` on that method,
  because Swagger responses with the same status can overwrite one another.
  Public endpoints use `ApiErrorResponses`; ownership and role checks still need
  their own guards/logic. Do not migrate unrelated endpoints just for this rule.

## Feature organization

- When a feature contains distinct responsibilities, group their implementation
  into named subfolders such as `diagnostics/`, `preferences/` or `delivery/`.
  Keep the controller, exclusive DTOs, helpers and tests with their actual owner;
  keep shared feature contracts and infrastructure at the closest common owner.
  Prefer responsibility boundaries over feature-wide `controllers/`, `services/`
  or `tests/` buckets. A file count alone does not justify another folder.
- For example, notification diagnostics should own their optional controller and
  module under `notifications/diagnostics/`, while ordinary notification APIs,
  shared delivery infrastructure and worker contracts retain their production
  owner. Production code must not depend on optional diagnostics internals.
- Folder organization and NestJS module boundaries are separate decisions. Add a
  module for actual DI/export or registration needs, such as development-only
  controllers; do not create a module/service for every folder or duplicate
  providers, SDK clients or background workers just to organize files.
- Apply this to new subareas and structural changes within the current task.
  Move associated imports/tests and verify registration and public contracts when
  reorganizing. Do not expand a focused change into an unrelated feature rewrite
  or split an existing service solely to satisfy a naming/file-count rule.

## Naming

- Name variables after the domain data they contain. Include the relevant state
  or transformation when several representations coexist: `generatedQuestions`
  and `questionsWithAnswerKeys`, rather than `generated` and `snapshots`.
- Use generic names such as `data`, `result`, `items` or `snapshot` only when the
  local context makes their meaning unambiguous. Reserve `snapshot` for a captured
  state, not any mapped intermediate value.
- Prefer meaningful distinctions over longer names or type prefixes. Keep concise
  names when their meaning is clear. Apply naming improvements within the current
  scope; do not rename unrelated code.

## Utility organization

- Give each independent backend utility a named directory with a camelCase name:
  `utils/<utilityName>/index.ts`, with its unit tests in `index.spec.ts` beside it.
  Keep feature utilities in their owning NestJS module; use `common/utils` only
  for domain-independent utilities with actual reuse across modules.
- Keep exclusive implementation helpers private inside their owning utility.
  Extract meaningful standalone behavior, not trivial expressions or methods
  that belong to a service. Keep services, controllers, DTOs and schemas in the
  existing NestJS structure.
- Keep private types and constants with the utility. Introduce `types.ts` or
  `constants.ts` only when separate ownership or real reuse makes them useful.
- Apply this structure to utilities created, moved, or substantially reworked
  within the task scope. Do not reorganize unrelated utilities or create an
  import-only migration to enforce the convention.

## Utility documentation

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

## Test organization

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

## Verification

- Run `npm run ci:backend` from the repository root for backend implementation changes.
- For HTTP contract changes, follow the shared generation, HTTP testing and
  artifact rules in the root instructions and the OpenAPI contract guide.
- Run `npm --prefix frontend run docs:check` for instruction/documentation changes.
- Follow the root instructions for checking the actual staged snapshot and
  preserving the user's staging choices.
