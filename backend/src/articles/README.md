# Articles domain

The articles module discovers reading material, stores a user's article library,
and creates level-aware learning content. The root files are the public boundary;
implementation details live in capability folders.

## Request flow

```text
ArticlesController
        |
        v
ArticlesService (stable facade)
        |
        +-- discovery/       Wikipedia search, parsing, formulas
        +-- library/         saved/recent articles and Prisma queries
        +-- transformation/  summaries, adaptations, prompts, cache
        +-- quiz/            reading and vocabulary quizzes
        +-- infrastructure/  structured AI transport, retry, telemetry
```

Controllers should call `ArticlesService`. They should not depend directly on
the internal services below, so implementation details can change without
changing the HTTP boundary.

## Folder ownership

### `contracts/`

HTTP DTOs and shared domain types. This is the only folder intended to be
imported by other backend domains when an article contract is required.

### `discovery/`

- `WikipediaArticlesService` owns Wikipedia requests and presentation filters.
- `article-catalog.ts` contains curated discovery data and selection rules.
- `article-html-parser.ts` turns Wikipedia HTML into article blocks.
- `ArticleFormulaRenderer` renders formula blocks through MathJax.

### `library/`

`ArticleLibraryService` owns saved articles, recent articles, and available
adaptation lookups. Prisma access for these use cases stays here.

### `transformation/`

`ArticleAdaptationService` orchestrates summaries and adaptations. The other
files own prompts, chunking, semantic validation, and persistence of cached
results. AI transport does not belong in this folder.

### `quiz/`

`ArticleQuizService` orchestrates reading and vocabulary quizzes. Focused
validators enforce domain rules that JSON Schema cannot express, such as
source-term membership and valid answer references.

### `infrastructure/`

External transport adapters live here. `GroqTextClient` owns Groq SDK setup,
timeouts, strict JSON Schema requests, runtime Zod validation, and model
selection. `AiStructuredOutputRunner` performs at most one semantic retry with
bounded validation feedback. `AiTelemetry` emits low-cardinality OpenTelemetry
spans and metrics without recording article text or model output. A deployment
must register its OpenTelemetry SDK/exporter; without one, the standard API is
intentionally a no-op.

## Main scenarios

### Discover an article

```text
controller -> facade -> WikipediaArticlesService
                     -> ArticleLibraryService (available adaptations)
                     -> presentation filters -> response
```

### Create a summary or adaptation

```text
controller -> facade -> ArticleAdaptationService
                     -> cache lookup
                     -> exact token budget and token-safe chunk creation
                     -> per-chunk persistent cache lookup
                     -> AiStructuredOutputRunner
                     -> GroqTextClient (strict JSON Schema)
                     -> runtime schema + domain validation
                     -> chunk cache store and merge
                     -> complete-result cache store -> response
```

### Generate a quiz

```text
controller -> facade -> ArticleQuizService
                     -> full-request token budget
                     -> representative section selection for oversized sources
                     -> prompt factory
                     -> AiStructuredOutputRunner
                     -> strict schema + semantic validator -> response
```

## AI response policy

- Groq must return the versioned schema named in `contracts/ai-output.schemas.ts`.
- Zod validates the parsed response again at the application boundary.
- Shape/JSON failures fail closed; malformed or truncated JSON is never repaired.
- Semantic failures receive one corrective retry, then return a gateway error.
- Provider-level transient retries are delegated to the Groq SDK and remain
  separate from the single semantic retry.
- Source content is included only once in every transformation prompt
  (structured blocks when available, otherwise plain text).
- Requests are planned from their complete token cost, including the JSON
  Schema and maximum completion, with a safety margin below the configured TPM.
- Validated transformation chunks are persisted for 30 days, allowing a failed
  or restarted operation to resume without regenerating completed chunks.
- Quiz prompts use the complete source when it fits. Oversized sources use
  complete, evenly distributed sections from across the article and label them
  as representative excerpts; arbitrary character truncation is not used.
- Prompts, article content, and raw model responses are never telemetry
  attributes.

## Change guidelines

- Keep `ArticlesService` as a thin facade with a stable public API.
- Add behavior to the capability that owns it; do not create generic `utils`
  or `helpers` folders.
- Keep external SDK calls inside `infrastructure/` adapters.
- Keep Prisma queries in the service that owns the corresponding use case.
- Validate untrusted Wikipedia and AI responses before returning domain types.
- Place focused tests beside the implementation; keep cross-capability tests at
  the module root.
- Update this document when a new capability or external dependency is added.

## Verification

From `backend/` run:

```bash
npm test -- --runInBand
npm run test:e2e
npx eslint "{src,apps,libs,test}/**/*.ts"
npm run build
```
