# TODO: Protect translation requests from unauthorized use and abuse

Status: TODO. Investigation identified an exposed provider-backed operation;
implementation and production infrastructure verification are pending.

## Confirmed findings (2026-11-03)

- `POST /api/translations/word` has no authentication guard in
  `backend/src/translations/translations.controller.ts`.
- No global authentication guard was found in the application setup.
- `TranslationsService` calls Google Translate with the server-owned
  `GOOGLE_TRANSLATE_API_KEY`. The caller does not need to possess that key.
- No translation-specific inbound rate limit or user quota was found in code.
- The in-memory base-word cache reduces some repeated calls but does not enforce
  a spending limit. Context translation can still call the provider on a cache hit.
- Swagger currently documents the endpoint as public. Changing Swagger metadata
  alone will not restrict access.

If the deployed endpoint is publicly reachable and provider credentials are active,
unauthenticated callers can trigger provider usage. Hosting controls, deployed code,
Google quotas and billing settings have not been verified. This finding does not
establish that abuse has occurred or that provider usage is unlimited.

## Work

- Require the existing `UserAuthGuard` at the translation HTTP boundary. Inspect
  module dependencies and actual frontend callers before changing the contract;
  preserve token refresh, session handling and legitimate translation behavior.
- Define request-rate, per-user usage and concurrency policies, including burst
  behavior, reset periods, character-based charging and contextual provider calls.
  Select thresholds explicitly; do not invent limits during implementation.
- Enforce limits before outbound work. Account for parallel requests, multiple
  backend instances, restarts, failed requests and any retry policy. Authentication
  alone does not prevent abuse by registered users.
- Verify provider-side quotas, API-key restrictions, usage monitoring and alerting.
  Distinguish enforced quotas from billing alerts; do not assume an alert stops
  spending. Do not expose credentials in responses, logs, artifacts or examples.
- Consider bounded caching and request coalescing after enforcing access and usage
  limits. Avoid unbounded attacker-controlled cache growth.
- Define module-owned limit errors and statuses using the existing error contract.
  Update Swagger security, reachable error responses, generated artifacts and
  frontend localized handling together. Preserve defensive response decoders.

## Acceptance and verification

- Missing, invalid and expired credentials are rejected before provider calls;
  authorized requests retain their expected successful behavior.
- Over-limit and excessive parallel requests are rejected before outbound work.
  Tests cover policy boundaries, resets and the chosen multi-instance guarantees.
- Provider calls are mocked in tests. HTTP suites verify real guards, validation,
  serialization, statuses and public bodies; direct quota behavior has focused tests.
- OpenAPI accurately describes authentication and limit errors. Generated types
  are current; relevant frontend session/error handling is verified.
- Backend/frontend checks, generation freshness, documentation formatting and
  actual staged-snapshot checks run with failures and infrastructure limits reported.
- Record verified deployment/provider protections and remaining risks. Keep this
  task until the work is complete; remove it after moving lasting policy documentation
  to its appropriate owner.

Related: [application abuse-risk audit](application-abuse-risk-audit.md) and
[OpenAPI contract workflow](../openapi-contract.md).
