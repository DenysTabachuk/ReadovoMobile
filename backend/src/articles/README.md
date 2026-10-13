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
        +-- infrastructure/  external AI client
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
files own prompts, chunking, response normalization, and persistence of cached
results. AI transport does not belong in this folder.

### `quiz/`

`ArticleQuizService` orchestrates reading and vocabulary quizzes. Parsers reject
invalid model output and vocabulary policy contains the domain filtering rules.

### `infrastructure/`

External transport adapters live here. `GroqTextClient` owns Groq SDK setup,
timeouts, and model selection; business services only request text completion.

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
                     -> prompt/chunk creation
                     -> GroqTextClient
                     -> response parser
                     -> cache store -> response
```

### Generate a quiz

```text
controller -> facade -> ArticleQuizService
                     -> prompt factory
                     -> GroqTextClient
                     -> reading/vocabulary parser -> response
```

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
