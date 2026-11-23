# Thematic lesson seed

This development sample creates Germany and its A1 Oktoberfest lesson using the
reserved slugs `seed-germany` and `seed-oktoberfest`. The variant owns all 20
word cards, vocabulary exercises, reading and comprehension.

The Prisma entry point is `backend/prisma/seed.ts`. Run from the repository root:

```sh
npm --prefix backend run prisma:seed
```

`seed-thematic-lesson.ts` validates the vocabulary and writes the sample in one
transaction. Re-running replaces practice and reading questions for the same
variant and preserves its publication timestamp. Vocabulary keys reference the
versioned WebP renditions in the private development media bucket.
The sample is development data. Production content import requires a separate
agreement.
