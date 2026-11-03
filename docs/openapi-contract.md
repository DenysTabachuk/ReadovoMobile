# OpenAPI contract and frontend transport types

The document covers `POST /api/translations/word`, `GET /achievements/profile/me`,
the five mascot operations under `/mascot/profile/me` and the five streak
operations under `/streak/profile/me`. Other API modules are not covered yet.
The migration status and remaining work are tracked in
[the migration task](tasks/openapi-contract-generation.md).

## Viewing the API

Start the backend normally, then open `http://localhost:3000/api/docs` (adjust the
port if configured). A deployed backend serves the same page at `/api/docs` on its
own origin. Swagger UI assets are served locally. The raw document is available at
`/api/docs-json`. Translations is currently public. Achievements requires the
existing access token: use **Authorize** and enter the JWT without a `Bearer`
prefix. Swagger sends `Authorization: Bearer <token>` for secured operations.
The security declaration documents the existing guard; it does not install one.
Swagger's **Try it out** sends real requests to the backend and may contact the
translation provider or persistence. Normal backend startup still requires its usual services.

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

The export root also registers the real global `PrismaModule` to satisfy feature
module dependencies. Preview skips its database adapter constructor and lifecycle
hooks. The offline ts-node loader maps generated Prisma `.js` imports back to their
`.ts` sources; it does not build or start the backend.

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
   For operations protected by `UserAuthGuard`, use the auth-owned method decorator
   `@ApiUserAuth({ validation: true, errors: [...] })` and import `AuthModule` in the
   feature module. It installs the real guard, documents Bearer security and adds
   missing/invalid/expired token errors alongside shared HTTP errors. Supply only
   operation-specific errors; omit `validation` when there is no DTO validation.
   Do not stack `ApiErrorResponses` on the same method: pass all operation errors
   through `ApiUserAuth` so responses sharing a status (including 401) are grouped
   once. This decorator does not enforce ownership or roles.
   For public operations or a different authentication boundary, use
   `@ApiErrorResponses({ validation: true, errors: [...] })` with existing,
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
`uk`; explicit null languages fail validation. The supported directions are owned
by `SUPPORTED_TRANSLATION_PAIRS` in the translations module, currently only
`en -> uk`. Source/target enums are derived from that policy, and a DTO validator
checks the complete pair before any provider call. Reverse, same-language and
unknown directions return `400 VALIDATION_FAILED`. OpenAPI `oneOf` branches describe
the same pair restrictions, including effective defaults for omitted request fields.
To add a direction, update that policy, regenerate contracts and extend the tests;
do not independently widen two language lists. Frontend hooks use generated language
types and leave defaults to the backend. Strings are trimmed and languages lowercased
before validation. Unknown request properties are rejected. Swagger constraints
describe the normalized input; they do not implement those transformations.

Context may be omitted, null, empty or a string. The response preserves null;
undefined context and unavailable contextual translation fields are omitted during
JSON serialization. Required response fields remain strings.

Achievements returns HTTP **200** and reads the owner from the verified token,
not a client-supplied user ID. Its `claimedAt` and `unlockedAt` fields are always
present: ISO date-time strings for stored dates, or null when absent. Achievement
IDs are an enum derived from the backend's `ACHIEVEMENT_IDS` list. Missing,
invalid and expired tokens return documented **401** errors; a deleted/missing
user returns **404**. Authentication endpoint contracts remain outside coverage.

Mascot operations require Bearer authentication. Profile reads and slot clearing
return HTTP **200**; purchases and equipping return **201**, including purchasing
an already owned item. All return `MascotProfileResponse`. `equippedItems` is
always present; its `eyes` and `head` properties are optional strings, never null.
Empty slots are omitted from JSON. `ownedItemIds` contains strings and may be
empty. Database timestamps and legacy equipped-item columns are not exposed.
Path parameters are required: `itemId` is trimmed and must be nonempty; `slot`
is trimmed and must match the backend-owned `eyes`/`head` enum. Catalog membership,
ownership and balance are checked by the service and documented as distinct 400
errors alongside DTO validation. Catalog IDs remain strings rather than a fixed
transport enum, preserving the existing service boundary and stored legacy IDs.

Streak operations require Bearer authentication. Profile/calendar reads return
HTTP **200**; restore, freeze and token purchase return **201** with `StreakState`.
The monthly calendar requires integer `month` (1–12) and `year` (1970–2100) query
parameters. The DTO converts query text to numbers; the service rejects future
months separately. Freeze accepts a required `date` body field, trims it and
validates an actual `YYYY-MM-DD` date. Unknown query/freeze-body properties are
rejected. Restore and token purchase have no request DTO: prices come from backend
policy, and existing unused JSON body fields do not override them.

Activity/calendar dates, `brokenAt` and `lastActivityDate` are date-only strings.
`serverNow` and non-null achievement `claimedAt` values are ISO date-time strings.
Break details, last activity and claim timestamps are required fields that may be
null. The break object-or-null schema is explicit rather than inferred from the
TypeScript union. Status enums and numeric milestones are backend-owned and
generated for frontend consumers. Existing persisted-data decoders are retained.

Generated TypeScript is compile-time information, **not runtime validation**.
Axios generics do not validate JSON. The existing API error decoder and its safe
unknown/malformed-response fallback remain in place, as does validation of external
translation provider responses. Existing transport tests may intentionally return
malformed bodies to exercise this boundary. UI must not display diagnostic server
messages directly. Infrastructure failures can have a different body and need the
same defensive fallback. Generating runtime validators, clients or hooks is outside
this pilot.
