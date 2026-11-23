# Topic-based learning

The Topics tab opens the topic catalogue directly. There is no Vocabulary/Reading
activity chooser. A topic can contain child topics and named lessons. Each topic
and lesson has one identity across English levels; available levels are shown on
the same card, rather than duplicating it for each adaptation.

The catalogue uses illustrated cover cards, full-width local search and a separate
row for level selection and Filters. Search matches titles/descriptions in the
currently open topic. Filters currently opens a clearly labelled future-filters
sheet; no additional filters are applied. Level selection reuses the app's
OptionPickerField/bottom-sheet pattern, both here and on lesson overviews.

## Content ownership

`LearningTopic` stores an ordered catalogue tree and publication state. Its
translations own interface-locale titles and descriptions. `LearningLesson` is a
named learning unit placed in one topic, with its own translated overview copy.
`LearningLessonVariant` identifies one lesson/CEFR-level pair. A variant combines:

- ordered vocabulary cards and exercises;
- a prepared English reading title and paragraphs;
- authored comprehension questions, choices, answer keys and explanations.

Each variant owns its vocabulary words, stages and exercises by UUID. Stage and
question references are scoped to that variant. The public lesson slug and the
variant's level identify all activities. Deleting a lesson cascades to its
variants and their vocabulary and reading content.

Topic self-parenting and cycles are rejected by SQL constraints and a tree-edit
trigger. Deleting a nonempty topic is restricted. Content authoring happens
outside the public learning API.

## Levels and publication

English level and interface locale are independent. Missing requested interface
copy falls back to English. A missing English-level variant never falls back to
another level: the overview explicitly returns `variant: null`.

Catalogue availability aggregates published variants through visible descendant
topics. Publication uses the variant timestamp. A topic
under an unpublished/missing ancestor is hidden. Supported CEFR choices are
returned as metadata from the existing backend enum, not maintained independently
by the frontend.

Current catalogue choices are A1, A2, B1 and B2, owned by the learning module's
catalogue policy. The existing database/transport CEFR enum retains C1/C2 for
future content; they are not shown as catalogue choices.

The catalogue and lesson overview share a temporary level selection inside the
learning navigation stack. Changing level remounts that lesson's local activity
state. The selector is on the lesson overview, so it does not silently switch an
in-flight exercise. This preference is not yet saved to a user profile or storage.

## Lesson flow

Each lesson presents words, vocabulary practice, reading and comprehension in that
order, with free access to every available block.
The overview follows the earlier lesson-path design: numbered activity cards with
icons and descriptions, a highlighted first step and one Start Lesson button.
The highlight identifies the entry point; it does not imply saved progress.
Word cards present every ordered lesson word in one continuous roster. Internal
Vocabulary stages do not split the thematic word browser into separate parts.
The header Back action and Android Back close an activity to the lesson overview;
Back from the overview leaves the lesson. There is no extra Back to Lesson button.
The lesson response includes ordered vocabulary questions across its practice
stages. Opening vocabulary practice uses that data directly. The prepared reader
opens its matching comprehension questions without AI generation.

Answer checks require authentication and are stateless. Lesson reads omit answer
keys, sentence translations and explanations. Checking reveals feedback for the
scoped question and level. Scores and retry state stay in the mounted screen.
The answer checks do not write server-side progress, attempts, mastery or rewards.
Resolve [content editing with progress](tasks/vocabulary-content-updates.md)
before adding persistence.

## Topic covers

The explicit development seed includes Germany -> Oktoberfest at A1, with
20 topic-specific words in one list, 20 mixed vocabulary exercises, an original
four-paragraph fictional visit and five authored comprehension questions. Word
images are still placeholders. Cultural context was checked against the
[City of Munich](https://www.muenchen.de/en/events/oktoberfest) and
[Munich Tourism](https://www.munich.travel/en/topics/markets-festivals/oktoberfest/which-beer-tent-is-the-right-one-for-me);
the learner text is original sample content, not a quotation or production approval.

Topics store nullable versioned keys for the catalogue thumbnail and full cover.
Lessons store nullable thumbnail,
reading, and results keys shared across levels. Catalogue responses include
ready-to-use cover and thumbnail URLs, and lesson responses also include URLs
for reading, the shared end-of-reading callout, and results. The backend resolves
fallback artwork and builds API-relative links to `GET /learning/media`.
The route checks the session and the configured Readovo user allowlist before
reading PNG or WebP artwork from private R2. Unavailable covers use the app's
shared image placeholder.

The topic covers and existing lesson illustrations are stored in `readovo-media`.
The [topic cover guide](learning-media/topic-covers.md) and the
[lesson artwork guide](learning-media/lesson-art.md) record the source keys
and generation prompts. The [project README](../README.md#development-lesson-media)
documents local configuration. Word-card and vocabulary exercise images still use placeholders.

## API and validation

- `GET /learning/catalogue?locale=en|uk` lists root topics. An optional `topic`
  slug browses one topic's direct children and lesson summaries.
- `GET /learning/lessons/:slug?level=A1&locale=en` returns a unified overview and
  the requested variant, or an explicit null variant if that level is unavailable.
- `POST /learning/lessons/:slug/vocabulary/exercises/:exerciseId/check?level=A1` checks a vocabulary exercise.
- `POST /learning/lessons/:slug/questions/:questionId/check?level=A1` checks reading comprehension.
- Both checks accept `{ optionId }` and return feedback without writes.

Missing/hidden content returns `404 LEARNING_CONTENT_NOT_FOUND`. An unrelated
choice returns `400 LEARNING_OPTION_NOT_AVAILABLE`. DTO validation and the existing
Bearer/session safeguards remain authoritative.

`frontend/scripts/api-validators.mjs` also generates standalone Learning guards in
`frontend/api/generated/learning-validators.js` and `.d.ts`. The app fetches unknown
JSON and validates it before caching or using it. Backend tests cover response
identity. Regenerate
and verify all artifacts using root `contracts:generate` and `contracts:check`.

## Local sample

The explicit Prisma seed adds Germany and its A1 Oktoberfest lesson with 20 words,
20 mixed exercises, an original four-paragraph text and five authored comprehension
questions. The import is transactional and repeatable and preserves publication
timestamps. Display titles omit test-data suffixes at the user's request. Reserved
seed slugs and developer documentation still identify the content as a local sample.
Existing local records from earlier sample runs remain in the database.

Only A1 content exists in this sample. A2/B2 and other adaptations are not claimed
as available until their distinct words, texts and questions are authored. Word
images remain placeholders. This is integration test data, not approved production
content.
