# OpenAPI contract and frontend transport types

The translations pilot documents `POST /api/translations/word`. Other API modules
are not covered yet. The migration status and remaining work are tracked in
[the migration task](tasks/openapi-contract-generation.md).

## Viewing the API

Start the backend normally, then open `http://localhost:3000/api/docs` (adjust the
port if configured). A deployed backend serves the same page at `/api/docs` on its
own origin. Swagger UI assets are served locally. The raw document is available at
`/api/docs-json`. This pilot endpoint is public; no bearer token is required.
Swagger's **Try it out** sends real requests to the backend and may contact the
translation provider. Normal backend startup still requires its usual services.

## Ownership and artifacts

Backend modules own request DTOs, path/query parameters, success schemas, error
definitions, statuses and authorization. Existing NestJS/class-validator validation
remains authoritative at runtime. Explicit Swagger decorators describe DTOs and
serialized responses; this pilot does not depend on the Swagger CLI plugin or file
suffix discovery. Legacy `dto.ts` filenames in other modules can also be described
with explicit decorators when those modules enter coverage.

- `backend/src/translations/dto/translate-word.dto.ts`: accepted request body and validation.
- `backend/src/translations/dto/translate-word-response.dto.ts`: serialized success body.
- `backend/src/translations/translations.controller.ts`: route, operation ID,
  public access, success status and reachable errors.
- `backend/src/translations/translations-errors.ts`: module-owned errors.
- `backend/src/common/errors/common-errors.ts` and the validation rule mapping:
  shared boundary errors and validation details. OpenAPI derives codes from these
  definitions; there is no second manually maintained code catalogue.
- `backend/src/openapi`: document composition and isolated offline export.
- `backend/openapi/openapi.json`: canonical generated OpenAPI 3 JSON, checked in.
- `frontend/api/generated/transport.d.ts`: generated transport types, checked in.
  Never edit generated artifacts manually.

Public OpenAPI schema names generate direct `TranslateWordRequest` and
`TranslateWordResponse` exports via openapi-typescript's root-type options. Requests
import these generated names; feature API barrels may re-export them. The generated
`operations` map remains available for endpoint/status-specific typing.
UI/domain models stay in their features. Frontend production
code must not import backend DTOs, NestJS or Prisma. The HTTP client, React Query
hooks and auth/session behavior remain independently maintained.

## Generation and freshness

From the repository root, after installing backend and frontend dependencies:

```sh
npm run contracts:generate
npm run contracts:check
```

The first command updates the JSON and TypeScript artifacts. The second compares
generated content in memory with checked-in files; it does not rewrite them. Missing
or stale files fail with the regeneration command. Object keys are sorted; arrays
retain order, output has no timestamp or environment-specific server URL, and
freshness checks normalize CRLF/LF line endings.

The backend-only `npm --prefix backend run openapi:check` requires no frontend
installation. The frontend-only `npm --prefix frontend run api-types:check` consumes
the checked-in JSON without backend dependencies. CI runs these separately.
The root staged workflow runs both through `contracts:check` after typechecking.
It uses lint-staged's hidden working-tree changes to verify the selected commit
snapshot. Stage source changes and regenerated artifacts together; unstaged fixes
do not repair a stale staged contract.

`backend/src/openapi/documented-modules.ts` owns the single list of modules included
in both production Swagger UI and offline export. Export imports these real modules
and creates a Nest application with `preview: true`; it does not duplicate controller
lists or substitute service bindings. Preview skips DI constructors and factories
by default. Export does not import `AppModule`, call `app.init()` or listen on a port.
No database, provider credentials, mail, push or jobs are needed.

Preview is not a sandbox: JavaScript at import time still runs, including static
dynamic-module registration, and modules can opt into initialization during preview.
Before adding a real module to the coverage list, review these behaviors and run
the isolation tests. A fresh-process test guards against network/listening, `.env`
reads and relevant secret reads before importing application code. Tests also verify
that production service/controller initialization is skipped and that normal
Swagger UI and offline export produce the same document.

## Adding or changing an endpoint

1. Define inputs in the accepting module's class-validator DTOs. Document defaults,
   transforms, limits and nullable/optional semantics with Swagger decorators.
   Add explicit path/query metadata when relevant.
   Keep DTOs in the owning module's `dto/` directory, with operation-specific
   filenames such as `translate-word.dto.ts` for input and
   `translate-word-response.dto.ts` for the serialized success response.
2. Define a module-owned serialized response schema. Interfaces, inferred return
   types and unions do not supply sufficient runtime metadata. Describe dates as
   ISO strings and specify `date`/`date-time` where appropriate. Describe unions and
   enum values explicitly from their owning definitions.
   Give public request/response schemas intentional names with `@ApiSchema`, such
   as `TranslateWordRequest` and `TranslateWordResponse`; these become direct
   generated type exports rather than exposing backend class naming conventions.
3. Document status, operation ID, security and reachable errors on the controller.
   Use `@ApiErrorResponses({ validation: true, errors: [...] })` with existing,
   explicitly selected operation error definitions. The decorator adds shared
   malformed-body, oversized-body and internal errors automatically. Set
   `validation: true` only when DTO validation can reject the request; it defaults
   to false. Guards and service error branches are not inferred. This decorator
   describes the installed global HTTP boundaries and does not handle exceptions.
   Its `apiErrorResponses` helper derives schemas from the definitions.
   `VALIDATION_FAILED` requires
   field details; `REQUEST_REJECTED` retains a variable status and is documented as
   the fallback rather than assigned a new fixed status. The fallback is also
   included in explicit error-status schemas because OpenAPI's `default` response
   does not apply to a status that already has an explicit response.
4. Add HTTP contract tests with production validation/serialization and mocked
   external boundaries. Compare wire responses and metadata, including errors and
   missing/null values. Extend offline/UI tests for newly included modules.
5. Run generation, migrate actual frontend consumers to generated transport types,
   remove superseded transport declarations, and retain domain/UI adaptations.
6. Run freshness checks, both project checks and documentation formatting. Include
   source, generated files and related fixtures in the same staged snapshot.

## Wire semantics and runtime validation

Translations currently returns HTTP **201**. Omitted languages default to `en` and
`uk`; explicit null languages fail validation. Language codes are strings constrained
by a pattern, not a fixed enum. Strings are trimmed, and languages lowercased,
before validation. Unknown request properties are rejected. Swagger constraints
describe the normalized input; they do not implement those transformations.

Context may be omitted, null, empty or a string. The response preserves null;
undefined context and unavailable contextual translation fields are omitted during
JSON serialization. Required response fields remain strings. There are no date
fields in this pilot; date serialization must be verified when migrating modules
that actually return dates.

Generated TypeScript is compile-time information, **not runtime validation**.
Axios generics do not validate JSON. The existing API error decoder and its safe
unknown/malformed-response fallback remain in place, as does validation of external
translation provider responses. Existing transport tests may intentionally return
malformed bodies to exercise this boundary. UI must not display diagnostic server
messages directly. Infrastructure failures can have a different body and need the
same defensive fallback. Generating runtime validators, clients or hooks is outside
this pilot.
