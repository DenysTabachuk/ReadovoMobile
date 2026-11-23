# Generated response validation beyond Learning

Status: TODO. Learning is the current pilot; other features retain their existing
runtime decoders. See [the contract guide](../openapi-contract.md#generated-learning-response-validation).

## Scope

- Review the Learning pilot after practical use before expanding adoption.
- Migrate one feature at a time. Generate success-body guards from OpenAPI and
  replace handwritten transport-shape checks. Cover server-owned response
  invariants in backend tests. Keep domain adaptations, session safeguards and
  persisted-data validation at their owners.
- Candidate boundaries include learning-reminder preferences and article quiz
  generation. Check schema completeness first, including formats and optional/null
  semantics. Learning-reminder HH:mm narrowing still needs its domain check unless
  that constraint is explicitly represented in the contract.
- Treat authentication as a separate review. Preserve token/profile validation,
  storage checks, refresh/session ownership and malformed-error fallbacks; a valid
  success-body shape alone does not make an authentication workflow safe.
- Extend supported formats and standalone generation only when an adopting feature
  needs them. Keep output deterministic, offline and free of runtime schema
  compilation or validator-package imports.

## Verification and completion

- Test malformed responses at the frontend boundary and server-owned response
  invariants in the backend.
- Run contract generation/freshness checks, frontend CI and unused-code checks.
  Include source and generated output in the same review.
- Remove superseded parsers and their obsolete tests after equivalent contract
  coverage exists. Do not remove validation for independent storage/provider data.
- Record lasting conventions in the contract guide. Delete this task once the
  agreed adoption scope is complete.
