# Vocabulary content storage

Official vocabulary lessons use their own PostgreSQL tables. Personal dictionary
entries, article quizzes and user statistics remain separate. This first storage
change adds content only; it does not add endpoints, seed content, progress,
rewards or an authoring interface.

## Content and translations

`VocabularyLesson` represents one lesson. Its UUID is the relational identity;
its unique slug is a readable identifier such as `common-things`. Child IDs such
as `backpack` or `learn-first` are unique within that lesson and can be reused in
another lesson. `level` uses the `VocabularyLevel` PostgreSQL/Prisma enum with
`A1`, `A2`, `B1`, `B2`, `C1` and `C2` values.

A null `publishedAt` means draft. Versioning is deliberately deferred while there
are no persisted attempts or progress. Before adding persistence, resolve what
should happen when words or questions change in an existing lesson; see
[Content updates with saved progress](tasks/vocabulary-content-updates.md).

Lesson and stage titles/descriptions live in `VocabularyLessonTranslation` and
`VocabularyStageTranslation`. Each locale has one row per owner, for example
`(lessonId, "uk", title, description)`. Adding interface translations inserts rows
without adding database columns. These rows store actual content, not frontend
translation keys. The future importer must normalize locale identifiers, validate
required interface locales and define missing-locale fallback before publishing.

Words and example sentences are English, with Ukrainian translations, independently
of the selected interface language. Adding learner translation languages is a
separate content decision; existing `translationUk` fields are not interface copy.
Arbitrary learning languages and user-created lessons remain outside the current
scope. Pronunciation uses the app's shared US English setting; IPA must match it.

## Structure

`VocabularyLessonTranslation` stores localized lesson copy and
`VocabularyStageTranslation` stores localized stage copy. Their compound primary
keys prevent duplicate locales for the same owner; deleting the owner removes
its translations.

| Model                      | Responsibility                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `VocabularyLesson`         | Lesson identity, CEFR level, publication timestamp.                                                 |
| `VocabularyLessonWord`     | Word or phrase, IPA, Ukrainian translation, example and its translation, image key and attribution. |
| `VocabularyLessonStage`    | Ordered learning or practice step.                                                                  |
| `VocabularyStageWord`      | Ordered word roster for a stage; the same word can appear in several stages.                        |
| `VocabularyExercise`       | Ordered question in a stage, exercise kind and server-owned correct word reference.                 |
| `VocabularyExerciseOption` | Ordered, distinct word choices for a question.                                                      |

Positions are zero-based and unique within their owner. Word, stage and exercise
references include the lesson UUID so content cannot refer to another lesson's
words. There is no fixed 10-word or 20-word database limit: the Common Things seed
will define the two learning blocks and practice rosters. Counts derive from
those rows rather than duplicate counters on lessons or stages.

Learning stages use their ordered word roster for cards. Practice stages contain
questions of kind `word_to_picture`, `audio_to_picture` or `sentence_gap`. A final
mixed stage can contain all three kinds without another question format. Word
and audio prompts come from the correct word; option images/text come from the
referenced words. Sentence gaps store text before and after the gap plus the
completed sentence's Ukrainian translation. No delimiter parsing is required;
either text part may be empty, but both cannot be blank. Sentence fields are
required for gaps and forbidden for the other formats.

The correct word and all options must belong to the lesson. The future
importer must additionally validate that each question has at least two choices,
includes its correct word, uses words in its stage roster, and belongs to a
practice stage. It must also validate complete stage content and matching image
metadata before publication. These cross-row rules are not enforced by this
initial schema. Draft imports can assemble content in one transaction.

Correct-answer references are storage details. The read API must explicitly map
public responses and omit answer keys for unanswered questions; Prisma models
must not be returned directly as HTTP responses.

## Images

`imageKey` stores an object key such as `vocabulary/backpack/v1.svg`, without a
bucket URL or credentials. Delivery URLs belong to runtime configuration. The
schema rejects blank keys, leading slashes and URL-shaped keys; importers must
validate the complete key format and permitted delivery/source URLs. Versioned
keys distinguish asset replacements and avoid stale cached images.

Image source URL, licence and attribution text are required alongside the key.
The seed must carry actual source/licence information, including attribution for
the current Twemoji assets if reused. The schema neither uploads images nor
creates a bucket. Interface illustrations remain bundled in the mobile app.

## Integrity and deletion

PostgreSQL enforces nonnegative positions, supported CEFR levels, required
nonblank content, unique ordering, scoped foreign keys and sentence-field shape.
CHECK constraints and deferrable foreign-key settings live in the SQL migration;
Prisma does not represent them fully in its schema file.

Deleting a lesson cascades through its content. Word references from
rosters, exercises and options use `NO ACTION`, deferred until transaction commit:
deleting a referenced word alone fails, while deleting the whole lesson succeeds
independently of cascade trigger order. Callers must handle errors at commit, not
only at individual writes. No deletion endpoint is part of this change. Future
progress/attempt relationships and content-edit policy must be designed together
before those features are added.

## Verification

From the repository root, with the local Compose PostgreSQL service running:

```sh
npm --prefix backend run prisma:generate
npm --prefix backend run test:e2e -- --runInBand vocabulary/content-schema
npm run ci:backend
```

The Jest integration suite creates a uniquely named temporary database in the local Compose
PostgreSQL service, applies the complete migration history, runs
`backend/test/vocabulary/content-schema.sql`, then drops only that test database.
It does not apply migrations to the application's database. It verifies all three
exercise formats, lesson isolation, ordering, content checks, foreign keys and
deletion behaviour against PostgreSQL. Docker access is required; it is separate
from the ordinary backend unit/HTTP suites.
