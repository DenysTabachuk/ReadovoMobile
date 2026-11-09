# Vocabulary test seeds

This directory contains test/sample records for populating development databases,
not approved production lesson content. The sample lesson is named
`Common Things (test data)` and uses the slug `seed-common-things`.

- `common-things.ts`: 20 sample words, stage copy and sample exercises.
- `import.ts`: transactional, repeatable insertion/update of the sample draft.
- `validate.ts`, `schema.ts`, `types.ts`: seed-only input validation and types.
- `*.spec.ts`: seed unit tests discovered by the ordinary backend Jest command.

The entry point is `backend/prisma/seed.ts`. From the repository root:

```sh
npm --prefix backend run prisma:seed
```

This is an explicit database write using the backend's configured `DATABASE_URL`.
It does not run on application startup. The seed stays unpublished, refuses to
replace published lessons, and uploads no images. Image keys are placeholders;
source/licence metadata describes the proposed artwork only.

Production content import requires a separate explicit agreement. Production
application code under `backend/src` must not import this seed directory.
