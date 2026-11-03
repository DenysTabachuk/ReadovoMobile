# Task: OpenAPI contract and frontend type generation

Status: translations pilot implemented and ready for review, following the implemented
[API error contract](../api-error-contract.md). The pilot includes Swagger UI,
offline schema export, generated transport types and CI/staged freshness checks.
Do not expand to other modules before pilot review. Do not introduce a separate
error-only generator. Contributor workflow: [OpenAPI contract](../openapi-contract.md).

## Pilot progress and remaining migration

- Selected translations after inspecting its single public POST endpoint, existing
  provider HTTP tests and real frontend request/query consumers.
- Artifacts: `backend/openapi/openapi.json` and
  `frontend/api/generated/transport.d.ts`; root commands are `contracts:generate`
  and `contracts:check`.
- Actual wire behavior includes HTTP 201, defaulted language strings, omitted
  undefined fields and preserved nullable context. Existing transport declarations
  incorrectly excluded null context; the pilot corrects that representation.
- Public schema names generate direct `TranslateWordRequest` and
  `TranslateWordResponse` exports. The frontend request imports them directly;
  feature API types only re-export them. No client or hooks are generated.
- Shared Swagger error documentation now uses `@ApiErrorResponses`: parser and
  internal errors are automatic, DTO validation is an explicit opt-in, and the
  controller lists each operation-specific provider error. Runtime exception
  handling and serialized responses remain unchanged.
- Offline export uses real modules with Nest preview mode. One documented-module
  list feeds both export and Swagger UI; manual controller lists and inert service
  bindings have been removed. Isolation tests include fresh-process import guards.
- Remaining after pilot: inventory and migrate the other modules in small batches;
  document real auth/security requirements and date serialization as each module
  enters coverage; cover path/query parameters, discriminated unions, partial
  successes and additional fixtures; assess runtime validators where required;
  complete public API coverage and remove superseded declarations and plans.
- Keep this task until the broader migration is complete. The user requested a
  dedicated branch and commit for the completed pilot.

## Verification (2026-11-03)

- The pilot is based on current main, commit `34830a1`, in the dedicated branch
  `feat/openapi-translations-pilot`. Existing changes were backed up and restored
  with staging intact before finalization.
- Backend CI passed: typecheck, lint, formatting, 75 suites / 617 tests and OpenAPI
  freshness. Backend production build passed.
- Frontend CI passed: typecheck, lint, formatting, documentation, 140 suites / 712
  tests and generated-type freshness.
- The earlier Windows documentation formatting failures were caused solely by
  CRLF/LF differences. `.gitattributes` now enforces LF for Markdown; no semantic
  frontend-convention changes were needed.
- Backend e2e: 4 passed; 17 PostgreSQL reward cases skipped because
  `QUIZ_TEST_DATABASE_URL` is not configured. No live database was started.
- Every translations HTTP response in the provider suite is checked against the
  exported response schema with test-only Ajv and independent expected statuses
  and bodies. Coverage includes null/omission, normalization, contextual success,
  validation details, parser limits, provider failures and variable-status errors.
- Shared Swagger errors have focused tests for defaults, validation opt-in and
  explicit operation errors. Error definitions remain owned by their modules.
- Preview export uses real modules from `DOCUMENTED_API_MODULES`, with no manual
  service bindings. Tests verify skipped constructors, equal UI/export documents,
  and fresh-process isolation with network, environment-file and relevant secret
  reads blocked before application imports.
- Repeated generation was byte-stable without production environment files or
  credentials. Backend and frontend freshness checks passed independently of the
  other project's dependency installation. Missing/stale files and source/schema
  drift were detected without rewriting artifacts.
- An isolated staged-snapshot regression rejected a deliberately stale staged JSON
  even when the working tree was correct. During review, partial user staging
  correctly failed on missing dependencies. The complete final snapshot passed
  `check:staged` before committing.
- A local read-only Swagger viewer was verified against the canonical JSON, with
  request execution disabled and no application endpoints registered. Deployment
  of the backend remains separate from this local review.

## Goal

Describe the complete public HTTP API with OpenAPI and generate frontend transport
types from that document. Requests, successful responses and error responses must
share one documented wire contract instead of maintaining duplicate handwritten
backend/frontend transport models. Keep internal database/domain types private.

Use the existing NestJS/class-validator architecture as the starting point.
Introduce `@nestjs/swagger` and select a maintained TypeScript generator, with
`openapi-typescript` as the initial candidate. Do not migrate DTO validation to
Zod or introduce a shared runtime-schema package as part of this task.

## Scope and constraints

- Generate a deterministic OpenAPI JSON or YAML artifact locally from backend
  sources. JSON versus YAML is a storage-format choice; select one canonical file.
- Cover path/query parameters, bodies, authentication requirements, response
  statuses, success/partial-success payloads and application-owned error bodies.
- Define response schemas explicitly where TypeScript interfaces, unions,
  generics or inferred return types do not provide runtime Swagger metadata.
  Account for the repository's `dto.ts` filenames when configuring the CLI plugin.
- Describe serialized wire values: dates are strings, optional and nullable are
  distinct, and transformed query/body input may differ from service input.
  Preserve constraints, defaults, enum values and discriminated block unions.
- Assemble error schemas/enums from module-owned error definitions and shared
  validation rules. Retain the distinction between fixed statuses and the
  `REQUEST_REJECTED` fallback. Do not maintain another independent code list.
- Keep generated frontend files read-only. Feature-owned aliases, `Pick`/`Omit`
  types and transformations may adapt transport data for UI needs; they must not
  conceal an incorrect backend schema through assertions or manual patches.
- Retain the current HTTP client, session logic and feature ownership. Generating
  request functions or React Query hooks is optional future work, not a reason to
  replace the data layer during the type migration.
- Generated TypeScript does not provide runtime validation. Decide explicitly
  which boundaries need generated validators or separate safe decoders. Preserve
  the API error decoder's handling of unknown/malformed responses and safe fallback.
- Export the schema without listening on a port, connecting to persistence,
  reading secrets, downloading models, sending mail/push or running background
  dispatch. Provide an offline export path and verify these constraints.
- One repository enables atomic updates and CI checks; frontend production code
  must still not import backend DTO classes, Prisma models or Nest dependencies.

## Review batches

1. Inventory existing backend/frontend transport types, DTOs, response models and
   test/mock fixtures. Identify actual duplication and serialization differences.
   Propose artifact ownership and commands without migrating consumers yet.
2. Pilot one small module, for example translations. Add schema export and generate
   its frontend types. Review the document, generated output, nullable/optional
   behavior and developer workflow before expanding coverage.
3. Add deterministic generation and freshness checks to CI and the staged-snapshot
   workflow. Fail on stale/missing artifacts with an actionable regeneration command.
   Check both projects and independent backend/frontend dependency installations.
4. Describe shared errors/auth, then expand module by module in reviewable batches.
   Migrate frontend transport types and mock fixtures while preserving feature UI
   models, business behavior, permissions, retries and successful payloads.
5. Complete coverage, remove superseded transport declarations and obsolete
   generation plans, and publish lasting contributor documentation.

## Acceptance and verification

- Every supported endpoint has accurate input, success and error schemas with
  existing statuses and security requirements. Compare representative real HTTP
  responses with the generated document, including unions and partial successes.
- Frontend consumers use generated transport types, without changing generated
  files or importing backend implementation. Genuine UI/domain types stay local.
- Adding/removing a field, enum member or API error code updates the contract;
  CI rejects outdated artifacts. Repeated generation is byte-stable apart from
  normalized line endings and never embeds credentials or environment-specific URLs.
- Schema export works offline with no production credentials or external services.
- Relevant backend/frontend CI, typecheck, e2e, mock checks, documentation formatting
  and actual staged-snapshot checks pass, or pre-existing/environment failures are
  reported separately.
- Document commands, ownership, generated-file rules and runtime-validation limits
  in lasting project documentation. Delete this temporary task when complete.
