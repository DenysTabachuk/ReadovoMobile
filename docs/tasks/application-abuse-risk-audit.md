# TODO: Audit application access, abuse and external-service usage risks

Status: TODO. The public translation endpoint prompted this audit; other findings
must be verified rather than assumed.

## Goal and scope

Inventory backend HTTP entry points and their real protection. Trace calls to paid
or constrained services, user-data access and resource-intensive work. Check the
frontend and deployment boundaries where they affect those protections.

The known translation finding is tracked separately in
[translation abuse protection](translations-abuse-protection.md). Link to it instead
of maintaining a second implementation plan.

## Audit work

- Inventory all controllers, routes, HTTP methods, guards and global middleware.
  Record which routes are intentionally public and why. Do not infer protection
  from Swagger metadata, frontend navigation, CORS or an undocumented URL.
- Trace each operation to external providers and expensive local work, including
  AI generation, translation, embeddings, article fetching, mail, push, storage,
  exports and background dispatch where present. Distinguish inbound abuse controls
  from outbound scheduling intended only to respect provider rate limits.
- Verify authentication and authorization separately: a valid token must not allow
  access to another user's resources through submitted IDs or route parameters.
- Review intentionally public registration, login, verification and password-reset
  flows for request abuse, account enumeration and repeated mail/provider work.
  Required public access should have appropriate protections rather than a blanket
  login requirement.
- Review request-size and complexity bounds, pagination, concurrency, retries,
  deduplication, cache growth and work amplification. Identify operations capable of
  spending disproportionate resources per request or across concurrent requests.
- Inspect frontend configuration, persistence, logs, debugging utilities and
  artifacts for exposed secrets or assumptions that client-side checks enforce
  security. Never copy secret values into findings or task documents.
- Verify available hosting/network controls, public documentation/debug routes,
  provider restrictions, quotas, alerts and deployment parity. Clearly label anything
  not verified because access or evidence is unavailable.

## Evidence and deliverables

For each finding, record:

- affected operation, owning module and source references;
- observed behavior, required access and a safe reproduction or automated test;
- potential data, availability or provider-usage impact and its prerequisites;
- existing controls, confidence, severity rationale and unverified assumptions;
- recommended remediation, a focused follow-up task and verification criteria.

Prioritize confirmed unauthenticated provider usage and cross-user data access.
Separate confirmed defects, defense-in-depth improvements and intentional public
behavior. Do not claim a complete audit from automated searches alone.

## Execution boundaries and acceptance

- Use code review, local tests and mocked external boundaries first. Do not load
  test a live deployment, send real mail/push, invoke paid providers or perform
  destructive data operations as part of the audit without explicit authorization.
- Audit all discovered operations or identify a concrete coverage gap and reason.
  Deliver a route/control inventory and prioritized findings with evidence.
- Create focused remediation tasks; do not turn the audit into an unreviewed
  repository-wide authentication or architecture migration.
- Verify fixes with meaningful regression tests and repository-required checks.
  Preserve user changes and staging, and distinguish existing failures.
- Store lasting findings and the coverage inventory in appropriate security
  documentation. Keep this task while audit work remains and delete it when complete.
