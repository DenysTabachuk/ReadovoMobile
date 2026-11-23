# Vocabulary content storage

Vocabulary cards and practice exercises belong to the selected
[thematic lesson variant](topic-based-learning.md). The variant UUID scopes their
storage. The thematic lesson slug and CEFR level identify the content in the API.
The variant publication timestamp controls its visibility.

## Test database population

`backend/prisma/seed.ts` writes the development Oktoberfest example in one
transaction. The seed creates or updates the topic, lesson, A1 variant, words,
exercises and reading questions. The sample uses the reserved thematic lesson
slug `seed-oktoberfest`. Its image keys are placeholders. Run
`npm --prefix backend run prisma:seed` explicitly against a development database.
Production content imports require separate agreement.

## Content and API

The thematic lesson response embeds ordered vocabulary cards and unanswered
questions for the selected level. A vocabulary check uses the same lesson slug
and level and returns the correct choice, word metadata and any full-sentence
translation. The backend scopes the exercise to the variant and checks choice
membership. The app keeps the attempt score and retry state for the current
screen.

Words and examples are English with Ukrainian translations. This is independent
of the interface locale. Pronunciation uses the app's shared US English setting.

## Structure

| Model                        | Responsibility                                                     |
| ---------------------------- | ------------------------------------------------------------------ |
| `LearningLessonVariant`      | Owns words and practice at one CEFR level.                         |
| `VocabularyLessonWord`       | Word or phrase, IPA, examples, translations and image attribution. |
| `VocabularyLessonStage`      | Orders learning and practice content within a variant.             |
| `VocabularyStageTranslation` | Localized metadata for an internal stage.                          |
| `VocabularyStageWord`        | Orders the word roster within a stage.                             |
| `VocabularyExercise`         | Exercise kind, order and correct-word reference.                   |
| `VocabularyExerciseOption`   | Ordered, distinct word options for an exercise.                    |

Positions are zero-based. Composite child references restrict stages, words,
exercises and options to the same variant. The API combines learning-stage cards
in order and combines practice-stage exercises in order. Supported exercise kinds
are `word_to_picture`, `audio_to_picture` and `sentence_gap`. Sentence gaps
store text before and after the gap as well as the completed Ukrainian translation.

The ownership migration turns the previously linked vocabulary UUID into the
variant UUID, preserving words, stages, exercise IDs and their child relations.
It preserves effective visibility and aborts if it encounters unlinked vocabulary
records, so those records can be reviewed before changing the schema.

## Images

`imageKey` stores an object key such as `vocabulary/backpack/v1.svg`, without a
bucket URL or credentials. Delivery URLs belong to runtime configuration. The
schema rejects blank keys, leading slashes and URL-shaped keys; importers must
validate the complete key format and permitted delivery/source URLs. Versioned
keys distinguish asset replacements and avoid stale cached images.

Image source URL, licence and attribution text are required alongside the key.
Real images require accurate source, licence and attribution metadata. Interface
illustrations remain bundled in the mobile app.

## Integrity and deletion

PostgreSQL enforces nonnegative positions, supported CEFR levels, required
nonblank content, unique ordering, scoped foreign keys and sentence-field shape.
CHECK constraints and deferrable foreign-key settings live in the SQL migration;
Prisma does not represent them fully in its schema file.

Deleting a variant cascades through its vocabulary content. Word references from
rosters, exercises and options use `NO ACTION`, deferred until transaction commit:
deleting a referenced word alone fails, while deleting the whole variant succeeds
independently of cascade trigger order. Callers must handle errors at commit, not
only at individual writes. No deletion endpoint is part of this change. Future
progress/attempt relationships and content-edit policy must be designed together
before those features are added.

## Verification

From the repository root:

```sh
npm --prefix backend run prisma:generate
npm run ci:backend
```

Seed validation unit tests run through the ordinary backend Jest command.
The vocabulary-specific database integration suites and temporary-database
helpers were removed after review. These checks do not apply migrations or
populate the application's database.
