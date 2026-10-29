# Task: OpenAPI contract and frontend type generation

Status: planned and explicitly deferred from the implemented
[API error contract](api-error-contract.md). Do not introduce a separate error-only
generator. Start this broader migration as its own reviewable task.

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
