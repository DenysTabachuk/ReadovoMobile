# Task: Remove obsolete TensorFlow dictionary endpoints and dependencies

Status: planned. The user requested a removal task after reviewing TensorFlow
usage during the unused-code audit. This document does not implement removal.

## Context

`backend/src/dictionary/dictionary-embedding.service.ts` imports
`@tensorflow/tfjs` and `@tensorflow-models/universal-sentence-encoder`. It loads
the model on the CPU in onModuleInit, caches text embeddings, compares them with
cosine similarity and selects distractor words. Model initialization therefore
runs during normal backend startup even without embedding requests.

The service is exposed through three public dictionary endpoints:

- `POST /api/dictionary/embedding`
- `POST /api/dictionary/similar-words`
- `POST /api/dictionary/quiz-options`

No calls to these endpoints were found in the current frontend implementation.
The dictionary test flow already uses Groq through createTestQuestionsWithAi;
it does not use this TensorFlow service. Knip keeps these dependencies reachable
through the registered controller and provider, so it cannot establish whether
the HTTP functionality still serves a product need.

## Scope

1. Recheck repository consumers and document the removal of the three public
   endpoints. A repository search cannot prove the absence of external clients;
   record this API compatibility change in the implementation review.
2. Remove the endpoint methods and exclusive DTOs from the dictionary controller,
   their DictionaryService forwarding methods and exclusive word-list fallback
   logic. Delete DictionaryEmbeddingService and its provider registration.
   Remove exclusive types, constants and error definitions only after checking
   remaining consumers. Preserve shared dictionary and quiz behavior.
3. Remove @tensorflow/tfjs and
   @tensorflow-models/universal-sentence-encoder from the backend manifest using
   npm, updating its lockfile together. Let npm resolve remaining transitive
   dependencies; do not remove transitive packages manually or add Knip ignores.
4. Remove tests exclusive to the deleted feature. Update dictionary test-app
   helpers, OpenAPI export isolation tests, Swagger tests and other mocks that
   currently provide or override DictionaryEmbeddingService. Preserve meaningful
   coverage of unrelated dictionary operations and offline OpenAPI generation.
5. Update source-owned API documentation and regenerate
   `backend/openapi/openapi.json` and `frontend/api/generated/transport.d.ts`.
   Verify the removed routes, operation IDs and exclusive schemas disappear.
   Never edit generated artifacts manually.

Read repository instructions and [the OpenAPI contract guide](../openapi-contract.md)
before implementation. Read frontend instructions if frontend files need changes.
Do not replace TensorFlow with another model/provider or expand this into an AI
refactor. Preserve Groq-generated dictionary tests, saved-answer validation,
dictionary CRUD/progress, auth/session safeguards and active quiz functionality.

## Acceptance and verification

- No production TensorFlow imports, embedding provider registration or model
  initialization remain. Backend startup no longer loads this model.
- The three obsolete HTTP routes are absent from runtime routing and OpenAPI;
  remaining dictionary operations retain their contract and behavior.
- Tests verify dictionary test generation still uses its existing Groq boundary
  without real provider calls. Retain or add a focused route-removal regression
  check at the existing HTTP boundary where appropriate.
- Backend manifest and lockfile are consistent and no longer require TensorFlow
  for this feature. Any retained transitive package has an actual remaining owner.
- Run `npm run contracts:generate`, `npm run contracts:check`,
  `npm run ci:backend`, `npm run ci:frontend`, `npm --prefix backend run build`
  and `npm run audit:unused`. Run `npm run check:staged` when staging exists,
  preserving user staging and reporting unrelated existing failures separately.
- Verify backend startup with its normal local prerequisites when available;
  report any environment limitation explicitly.

Delete this task document after removal and verification are complete.
