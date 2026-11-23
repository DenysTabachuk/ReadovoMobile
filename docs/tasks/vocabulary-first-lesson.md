# Vocabulary: first mobile lesson

Status: steps 1–3 are implemented as local UI prototypes. The content schema,
migration and test seed are implemented and applied to the local application
database. Published lesson overview/card read APIs are implemented. Approved
production content, media delivery and saved progress remain pending.
The catalogue, overview, cards and all practice formats now use the normal API;
answer checking is server-side and attempt state remains temporary.
The agreed order changed after UI review: build storage before
expanding the temporary frontend fixtures.

## Goal

Deliver one complete official A1 lesson, Common Things, in small changes that can
be reviewed independently. Do not implement the entire feature in one PR.
The representative mobile UI is implemented with local demonstration content.
Build the real content storage next, then seed the full lesson and connect the UI;
do not expand the disposable frontend fixtures to 20 words first.

## Agreed direction

- Enter Vocabulary from the existing Learning screen. Keep Grammar unchanged.
- Start with 20 words: learn 10, practise those 10, learn 10 more, then practise
  all 20. This is the first lesson's structure, not a universal lesson-size rule.
- Show one word card at a time: image, English word or phrase, IPA transcription,
  Ukrainian translation, pronunciation button, short example and its translation.
- Store lesson content and user progress in the existing PostgreSQL/Prisma stack.
  Keep vocabulary lesson content separate from personal dictionary entries.
- Store word images in Cloudflare R2. Store their object keys in the database;
  resolve delivery URLs through configuration. Keep interface art in app assets.
- Upload the initial images manually. No upload UI or runtime image generation.
- Support the existing light/dark themes and English/Ukrainian interface locales.
  Keep the app portrait-only and avoid an arbitrary screen-wide maximum width.
- User-created lessons are a distant possibility, outside this implementation.
- Local fixtures and bundled word images are acceptable for the UI prototype;
  they are temporary and must be replaced during production integration.

## Decisions to explore through the UI

- Confirm the 20 words, their intended meanings and their division into two sets.
- Choose the pronunciation variant and matching IPA. Assess the existing device
  speech implementation before introducing stored audio or a paid provider.
- Confirm the exercise formats, number of questions and completion rule. Proposed
  formats: word-to-picture, audio-to-picture and a sentence with a missing word.
- Decide whether to include small checks after five cards. This is a proposal,
  not an agreed requirement.
- Define how mistakes return for practice, when the second set unlocks, whether
  known words can be skipped and how replay works.
- Decide how completion relates to existing streaks, achievements, coins and the
  personal dictionary. Do not award rewards or mark words mastered implicitly.

These decisions can evolve during UI reviews. Start with a small representative
sample; a final 20-word inventory and storage design must not block the first
screen. Before media setup, confirm R2 account access and the production
delivery domain. Account changes, billing choices and publishing assets are
separate explicit setup actions.

## Review sequence

Each item below is a separate review unit. Complete its checks and review its
result before starting the next. Split further if implementation reveals a larger
dependency; avoid combining unrelated refactoring with these changes.

### 1. Prototype lesson selection and overview

Step 1 delivered Vocabulary entry, a local Common Things lesson and a four-stage
overview in both locales. At its initial review, the first stage was marked coming
soon and Start was disabled. Step 2 below supersedes those entry states; practice,
saved progress, R2 and backend work are still deferred. Step 3 also makes Quick
Practice accessible as a preview; the later two stages remain locked.

Verification: checked lesson entry, overview, scrolling and return navigation in
the Android emulator, with English/dark and Ukrainian/light combinations. Start
remains disabled. Content uses a count label to avoid relying on device-specific
plural-rule support. Product approval is still pending.

- Enable Vocabulary on Learning and add a lesson list and four-stage overview.
- Use small, feature-owned local fixtures and representative legal image assets.
  Keep prototype data separate from presentation without inventing HTTP DTOs or
  building a mock server.
- Review navigation, wording, stage layout and proposed locked/completed states
  on the emulator. Do not present unfinished stages as playable.
- Outcome: the lesson's entry experience is visible; no R2, API or database work.

### 2. Prototype word cards

Implemented: Start and the first stage open a three-card local sample (backpack,
book and pencil). Cards include US IPA, Ukrainian translations, original example
sentences and their translations, device pronunciation for words and examples,
previous/next controls and a sample-specific progress indicator. The last card
now opens picture practice (step 3) without marking a block completed.
Position is held only while the screen remains mounted. Twemoji illustrations
are bundled with attribution and their licence; R2 remains deferred.

Speech requests are cancelled on card changes and screen blur. Native speech
errors and image loading failures have visible fallback states. Lifecycle tests
cover late callbacks, pending playback, unmounting and retry after speech failure.

Verification: `npm run ci:frontend` passed (152 suites, 794 tests). Checked all
three SVG illustrations, word/example pronunciation controls, previous/next
navigation, first-card disabled Previous, last-card return and still-locked
practice in the Android emulator. Reviewed Ukrainian/light and English/dark
appearances, then restored Ukrainian/light. Device audio output quality and
additional screen sizes remain part of product/device review. No staged changes
were present for a commit-snapshot check.

- Build the word card, forward/back controls, progress indicator, example and
  translation using the local sample. Try pronunciation through existing speech.
- Review real image sizes, unavailable images/audio, scrolling, both themes and
  locales, small screens and larger text before expanding the content inventory.
- Keep position in local prototype state; do not claim restart persistence.
- Outcome: an interactive word-learning screen that can be reviewed independently.

### 3. Prototype practice, one exercise format per review

Implemented: a local three-question word-to-picture exercise using the same
backpack, book and pencil illustrations. The last word card opens practice;
Quick Practice on the overview also provides direct preview access. Users choose
an image, check once and then advance. Checked choices are locked, correct/wrong
options have distinct icons and colours, and feedback shows the word's meaning.
The result shows the first-attempt score and words answered incorrectly, with
restart and return-to-lesson actions. Restart clears the attempt. No progress,
rewards, streak changes, API calls or later-stage unlocking are implemented.

Verification: `npm run ci:frontend` passed (154 suites, 809 tests). Hook tests cover
invalid selections, check/advance gating, duplicate submissions, stale events,
scoring and reset. In the Android emulator, checked cards-to-practice navigation,
correct/incorrect feedback, a 2/3 result with the expected review word and retry
from an unanswered first question. Reviewed Ukrainian/light and English/dark.
Google sign-in with the existing emulator account worked; use that route for
future local visual checks when signed out. Native screen-reader output and
additional device sizes remain unverified. No staged files were present.

Audio-to-picture is available as a separate third step in the lesson overview
and through the word-to-picture result. It reuses the questions, checking and
result UI with a different prompt: each focused question automatically plays
the word and provides a compact inline button for unlimited replay. The English
answer stays hidden until checking. Existing device
speech handles playback, errors and cancellation when leaving the question.
The sample still contains three words and keeps no persisted progress.

The word and audio exercises have separate screen components. They compose the
feature-owned `PicturePractice` UI with their own prompt; only the word screen
provides the listening transition on results. Shared options, feedback, results
and attempt state have no exercise-mode flag. Audio playback and its tests belong
to the audio screen. After this refactor, frontend checks still pass (814 tests);
the emulator walkthrough confirmed word practice, its result and the audio entry.

Verification: `npm run ci:frontend` passed (155 suites, 814 tests). Added tests
cover autoplay, replay, stable playback across rerenders, hidden prompt
text/accessibility labels, question cleanup and retry after a speech error.
Android emulator checks confirmed the direct overview entry and compact replay
control, as well as the listening
screen, replay control, hidden word, correct/incorrect feedback, question
transitions and a 2/3 result with Backpack listed for review in Ukrainian/light.
Audio output quality and a full review in both
themes/locales remain device/product checks. `npm run check:staged` passed for
the two staged locale files; the implementation remains unstaged.

Sentence-gap practice is available as a separate fourth overview step. Three
original sentences use the same backpack, book and pencil sample, with text
choices. Checking locks the choices, highlights the correct word in the completed
sentence and reveals its Ukrainian translation. Results include the score, words
to review, retry and return to the lesson. The question set and result are local;
later stages stay locked and no progress is saved.

All formats reuse `useVocabularyPractice`, now parameterized by a stable question
set. The former picture-specific hook and its regression suite were renamed;
progress and result UI moved to shared vocabulary components. Sentence-specific
presentation remains in its own screen, with no exercise-mode flags.

Verification: `npm run ci:frontend` passed (156 suites, 817 tests), including the
existing attempt safeguards and new screen tests for hidden translations, locked
answers, a 2/3 score, retry reset and unknown lessons. In the Android emulator,
verified the fourth-step entry, unanswered state, completed sentence and feedback
in Ukrainian/light. Both-theme/device review remains pending. No files were
staged, so a staged commit snapshot could not be validated.

- Begin with word-to-picture selection and its correct/incorrect feedback.
- Review audio-to-picture and sentence-gap formats in subsequent small changes
  if they remain part of the agreed lesson. Avoid adding all formats at once.
- Use local example answers for the prototype only. Review distractors,
  explanations, mistakes returning for practice and progress behaviour.
- Outcome: approved exercise interactions without backend dependencies.

### 4. Add the content schema and migration

Implemented: vocabulary content tables for lessons, words, stages, stage word
rosters, exercises and options, plus locale-based lesson/stage translations. Three question kinds support the
existing UI. Composite foreign keys prevent cross-lesson references, and SQL
constraints validate ordering, required content and sentence shape. Image keys
and attribution metadata are stored with words. No seed, endpoints, user progress
or frontend changes are included in this review.

See the [Prisma schema](../../backend/prisma/schema.prisma) and
[variant ownership migration](../../backend/prisma/migrations/20261119193000_attach_vocabulary_to_learning_variants/migration.sql)
for the current storage model and SQL constraints.
The migration was applied to the local application database on 2026-11-09,
along with the preceding pending streak-policy migration. All six repository
migrations are now applied locally. There is no production database.

Initial verification: Prisma validation and client generation passed. An isolated
PostgreSQL check applied all six migrations and passed the vocabulary integrity
and deletion tests. The vocabulary database integration suites, SQL test fixture
and temporary-database helper were subsequently removed after review. Seed
validation unit tests remain in the normal Jest suite.

- Review the schema before seeding the complete content inventory.
- Outcome: a verified storage foundation, without disposable expanded fixtures.

### 5. Populate test data, then prepare real content and media

Seeds are test data by default. The current sample and its import/validation
code live under `backend/prisma/seeds/learning/`, with the entry point at
`backend/prisma/seed.ts`. Do not treat the sample as approved production content.
The seed and pending migrations were applied to the local application database
on 2026-11-09. Running the seed twice succeeded with the same lesson ID and no
duplicate lesson: direct database reads confirmed 20 words, 6 stages, 50 exercises
and a null publication timestamp. Image keys remain placeholders.

The first real seed run exposed a TypeScript loader configuration issue: generated
Prisma sources import `.js` paths, which plain `ts-node` did not resolve to `.ts`.
The backend TypeScript configuration now enables `ts-node.experimentalResolver`,
matching the resolver already used by offline OpenAPI export. The seed entry point
and explicit execution command are unchanged.

Verification: migration status reports no pending migrations; both explicit seed
runs succeeded. `npm run ci:backend` passed (97 suites, 824 tests, including OpenAPI
freshness). Documentation checks, formatting of the changed configuration/task
document and `git diff --check` passed. No files were staged, so there was no staged
commit snapshot to validate. API and UI integration remain separate review units.

Split test population, approved production content and R2 setup into separate
small review units.

- Implement a repeatable, transactional seed/import for Common Things with 20
  original words, two learning blocks, practice rosters and the three exercise
  formats. Keep this sample visibly labelled as test data. Real content import
  requires explicit agreement and a separate workflow.
- Use stable lesson/word/stage/question IDs; validate choices, correct-answer
  membership, stage kinds, word rosters and required translation locales.
- Keep real-content drafts unpublished until content and actual media are ready.
  The explicitly invoked local sample is catalogue-visible for integration testing.
  Confirm
  pronunciation/IPA, completion rules and the intended content inventory.
- Create the media bucket and configure development/production delivery. Keep
  write credentials out of the mobile app and repository.
- Optimise and manually upload approved images with stable, versioned keys.
  Record sources, authors and licence/attribution information.
- Replace temporary bundled word images with remote delivery and verify loading,
  caching and failures on a device. Keep interface illustrations bundled.
- Outcome: the reviewed UI uses production media without requiring a lesson API.

### 6. Expose read APIs

First read API increment implemented: authenticated catalogue and detail endpoints
for published lessons, localized lesson/stage copy with English fallback, word
cards, attribution, ordered stage rosters and counts. Missing and draft slugs share
the same 404; the sample was initially hidden until the local seed visibility
change described below. Explicit response mapping
omits storage fields and answer keys. Module registration and canonical OpenAPI
coverage include both routes; generated artifacts accompany the implementation.

Verification: `npm run contracts:generate` and `npm run contracts:check` passed.
`npm run ci:backend` passed (99 suites, 835 tests), including route coverage,
fresh-process export isolation and runtime Swagger parity. `npm run ci:frontend`
passed (156 suites, 817 tests). The new HTTP suite checks real controllers,
service, auth guard and boundary configuration with persistence mocked; unit
checks verify publication predicates and ordered reads. A read-only smoke check
against the local application database confirmed an empty published catalogue,
404 for the draft seed and unchanged sample publication/counts. Documentation
formatting and `git diff --check` passed. No files were staged; no staged commit
snapshot was available to validate.

Subsequent agreed direction: serve the local test lesson through the ordinary
published-content API by making the explicitly invoked seed catalogue-visible,
rather than adding development-only preview routes. The unfinished preview module
was removed. The importer now accepts reserved `seed-` slugs, verifies stable
identity and preserves `publishedAt` across repeat imports. Titles remain visibly
labelled test data; catalogue visibility is not production content approval.

Practice question delivery and stateless server checking are now implemented as
an additional contract increment. Unanswered responses omit answer IDs and
sentence translations; feedback supplies them after a submitted choice. The
service validates persisted option/roster membership and scopes every read/check
to the catalogue-visible lesson and practice stage. Media delivery remains a
separate dependency because placeholder keys do not resolve to images.

- Add the vocabulary backend module and read services using the reviewed schema
  and seed. Keep feature contracts and validation within the owning module.
- Add authenticated catalogue/detail endpoints, module-owned DTOs, documented
  errors and HTTP tests. Generate both contract artifacts in this review.
- Outcome: database-backed lesson content and verified read contracts.

### 7. Connect the approved UI to real lesson content

Catalogue/overview/card increment: the normal authenticated API now supplies the
lesson list, localized overview, ordered stages and both ten-word learning rosters.
Generated transport types are checked at runtime before caching. Cache keys include
the current account and interface locale. Screens show loading, empty, missing,
error and retry states; navigation uses API slugs and explicit stage IDs. Both
learning blocks can be reviewed without suggesting saved unlocking/progress.

The catalogue/word-card fixture path was removed. Cards use API Ukrainian strings
and examples directly. Missing illustrations show an explicit placeholder, without
inventing delivery URLs or substituting unrelated sample artwork. Finishing a
block now opens the next stored stage. All practice stages, including the mixed
final stage, read database questions and submit choices to the server. Local
result state uses checked feedback, locks submitted choices, prevents duplicate
in-flight requests and supports retry/reset. Screen effects run in per-call mutation
callbacks so unmounting drops late feedback. The old preview slug and frontend
practice fixtures/word illustrations have been removed while preserving the
exercise presentation. Before deployment, review publication eligibility and
removal of sample content. Production media and saved progress remain pending.

Verification: `npm run ci:backend` passed (99 suites, 836 tests), and
`npm run ci:frontend` passed (164 suites, 848 tests). `npm run contracts:check`,
`npm run audit:unused`, documentation formatting and `git diff --check` passed.
The HTTP contract did not change. A real local HTTP smoke check in both locales
read the seed through the ordinary authenticated routes and passed those responses
through the frontend decoder: 20 words, 6 stages, 50 exercise counts and two
ten-word rosters. Reimport preserved its publication timestamp. Screen tests
cover loading/error/retry, empty/missing content, API slug navigation, roster order,
all twenty cards, block switching and unavailable practice. Account/locale query
cache separation is covered. Emulator visual/audio review remains pending. Current
changes are unstaged, so there is no staged snapshot to validate for this increment.

- Replace local content fixtures with API requests and data hooks using generated
  transport types, runtime validation and existing session/cache safeguards.
- Add real loading, empty, error and retry states. Preserve the reviewed layout.
- Remove superseded fixture wiring rather than maintaining a second production
  data path.
- Walk through the complete 20-word lesson and review both learning blocks,
  practices, unlocking and results using database content.
- Outcome: the approved lesson loads from the backend; progress remains temporary.

Practice integration verification: `npm run ci:backend` passed (101 suites,
849 tests), and `npm run ci:frontend` passed (168 suites, 869 tests).
`npm run contracts:generate`, `npm run contracts:check`, `npm run audit:unused`
and formatting/diff checks passed. The real local HTTP walkthrough exercised all
50 stored questions and checked 100 correct/incorrect submissions through the
frontend runtime decoders. No attempts, progress or rewards were written.
HTTP tests cover serialization, guards, DTO rejection and missing/invalid choices;
unit tests verify publication/lesson/stage scoping and persisted-content guards.
Frontend tests cover all formats, mixed transitions, locked choices, duplicate
taps, failed-check retry, mismatched feedback, scoring, next-stage navigation and
reset. Existing speech lifecycle/autoplay tests remain. Emulator visual/audio
review and actual image delivery remain pending. The staged snapshot check was
run and failed because the user's partial selection omits required parsers/test
fixtures and retains an obsolete preview import. Staging was preserved; these
failures do not occur in the complete working tree.

Vocabulary response validation now pilots standalone guards generated from the
four OpenAPI success schemas. Handwritten transport parsers have been removed;
request identity and auth/session checks remain. Other features are tracked in
[a separate TODO](generated-response-validation.md). This does not change the HTTP
contract or introduce persisted progress.

Validator pilot verification: frontend CI passed (166 suites, 847 tests), including
schema-driven generation and malformed-response coverage. Contract generation,
freshness checks and unused-code checks passed. The lower test count reflects
removal of the handwritten-parser suites and addition of generated-validation
coverage; the API-backed practice and speech tests remain.

Device review resumed on 2026-11-18 using the existing
`Medium_Phone_API_36.0` emulator and installed development client. The app retained
its authenticated session. The local database and services were initially stopped;
Docker/PostgreSQL, backend and Metro were started without clearing app or database
data. The catalogue's localized error/retry screen was observed while the API was
unavailable. The authenticated route now responds with 401 to an unauthenticated
probe, confirming backend reachability. Recovery via the UI, generated validators
inside Metro, card blocks and API-backed practice still require the device
walkthrough. UI automation was paused because the user is actively using the
computer. Do not count this partial startup as a passed feature walkthrough.

Initial loading now uses the existing shared `FullScreenLoader` in the catalogue,
overview, word cards and practice instead of a text notice. Obsolete Vocabulary
loading copy was removed from both locales. Frontend CI passed (166 suites,
847 tests); device verification remains pending desktop availability. Emulator
guidance now uses `start:dev`, root `db:up`, a current development-client session
and emulator-only capture, and stops foreground input while the user is working.

Background-only device verification attempt on 2026-11-18: the existing
`emulator-5554`, installed app process, PostgreSQL, backend on port 3000 and Metro
on port 8081 were running. PostgreSQL reported ready, Metro's status endpoint
reported running, and an unauthenticated vocabulary catalogue request returned 401. Existing ADB reverse mappings for 3000 and 8081 were present. No duplicate
services were started, and app/database data were preserved. A scoped sample of
ReactNativeJS/AndroidRuntime error logs was empty; this is not a successful UI check.
Android activity diagnostics showed the launcher as the resumed activity, so the
running Readovo process alone does not confirm startup or a current bundle.

The Computer Use API documents window-scoped capture, but input methods activate
their target window automatically. It therefore does not provide the isolated
background input required by the user. Window discovery also failed with
`Computer Use native pipe is unavailable`, including after retry and session reset.
No desktop screenshots, window activation or UI input were performed. Startup,
catalogue recovery, overview, both card blocks, all three practice formats, mixed
practice, answer locking, correct/incorrect feedback, results, retry and generated
validators in the device bundle were unverified at that point. The subsequently
approved ADB walkthrough below supersedes this tooling blocker.

The actual staged snapshot check was rerun and failed on existing missing modules
and obsolete imports in the partial selection. Lint-staged reported successful
restoration of the original state. Staging was not changed to repair that snapshot.

The user subsequently approved device-scoped ADB screenshots/input and requested
that the emulator skill be corrected if that approach worked. It worked without
Windows mouse/keyboard input or window activation. The skill now prefers ADB with
an explicit device serial, observed coordinates/UI bounds and screenshots after
actions. Windows computer-use is a foreground-only fallback. The skill also warns
against running staged checks during a Metro walkthrough because temporarily hidden
dependencies can leave stale resolution errors.

ADB walkthrough on 2026-11-18 used the installed client and local API in
Ukrainian/dark mode. Initial startup showed a Metro 500 for an existing unstaged
module. Restarting only the identified Metro process with `--clear` rebuilt the
current Android bundle (2436 modules) and removed that error. The login screen
then appeared. Native modules initially reported an unavailable activity, including
Google sign-in `NULL_PRESENTER`; sending the app to Android Home and resuming it
restored ordinary Google sign-in with the authorized existing account. No storage
was cleared, no app was reinstalled and no authentication bypass was introduced.
This startup observation does not establish a production Vocabulary regression.

Observed device coverage:

- Catalogue and lesson overview loaded the labelled sample through the real API.
- Both ten-word card blocks were traversed in order, including all 20 words,
  translations, examples, placeholder images and final-card stage navigation.
- All ten questions in each standalone practice format were checked: word to
  picture, audio to picture and sentence gaps. Each result was 4/10, with the six
  expected review words (Book, Pencil, Notebook, Ruler, Key and Door).
- Correct/incorrect feedback and checked-choice locking worked. An attempted
  change after checking left the first picture answer unchanged. UI hierarchy
  checks confirmed disabled options after subsequent submissions.
- Sentence gaps filled with the correct word and revealed the Ukrainian sentence
  translation after checking. Audio prompts hid the word before checking; the
  replay control responded. Audible output and audio quality were not assessed.
- Retry from the first practice result reset to question 1/10 with no selection.
- The second card block opened mixed practice (20 questions). Its first picture
  answer, second audio answer and transition into a sentence-gap question were
  observed. The user requested stopping during question 3, so the remaining mixed
  questions, mixed result and mixed retry were not verified.

No new ReactNativeJS/AndroidRuntime errors appeared in the scoped log sample after
successful login and during the standalone practices. Successful device requests
exercised the generated response guards in the current Metro bundle. No Vocabulary
implementation fix was needed in this walkthrough. Further theme/locale combinations,
network-failure retry, actual media delivery and persisted progress are not claimed.
The temporary QA driver was stopped at the user's request; services and emulator
were left running, and task-created captures/driver were removed. Skill/document
formatting and diff checks passed. The skill's Python validator could not run
because PyYAML is missing; frontmatter was checked with the installed Node YAML
parser instead. The staged snapshot still has the separately reported existing
dependency/import failures; staging was preserved.

### 8. Persist learning and implement answer checking

Server answer checking was brought forward to remove the last frontend mock data
without exposing answer keys. It currently performs no writes. Saved attempts,
ownership, completion policy and content-update handling still belong to this step.

- First resolve [content updates with saved progress](vocabulary-content-updates.md).
  Versioning is not part of the initial content schema; do not introduce saved
  attempts without an explicit content-edit policy.

- First review saved card position and stage progress, including resume after
  navigation/restart, account switching and failures. Make saves idempotent and
  prevent older updates from overwriting newer positions.
- In the next review, add persisted attempts/answers, server-side answer keys,
  ownership checks, retry-safe submission and the approved completion rules.
- Replace prototype checking with server responses; do not return answer keys
  with unanswered questions. Update contracts/tests with each API increment.
- Integrate any approved streak/reward behaviour in a separate review if it
  requires substantial cross-feature work.
- Verify the full flow, resumption, replay, duplicate taps and request failures.
  Remove remaining prototype progress/checking code and temporary assets.
- Outcome: one complete persisted lesson ready for review before adding more.

## Verification for each implementation review

- Run `npm run ci:backend` and/or `npm run ci:frontend` for the affected projects.
- Before any HTTP contract work, read `docs/openapi-contract.md`. For each contract
  change, update relevant HTTP tests, run `npm run contracts:generate`, then
  `npm run contracts:check`; include both generated artifacts with their sources.
- When staged changes exist, run `npm run check:staged` against that snapshot.
  Preserve staging choices and distinguish staged results from working-tree checks.
- Review migrations, ownership boundaries and relevant negative cases; do not
  rely on generated transport types as runtime response validation.
- Record what passed and any remaining limitations in each handoff.

## Content sources

Test-English is a reference for activity formats and lesson presentation. Its
[terms of use](https://test-english.com/terms-of-use/) prohibit republishing its
materials, including test questions. Use original exercises and illustrations or
obtain permission before incorporating its actual content.

[Openverse](https://api.openverse.org/v1/) and
[Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia)
are possible image sources. Check each selected asset's original licence and
preserve the required attribution. R2 stores files; it does not supply images.

## Deferred

User-created/public lessons, an authoring admin UI, community moderation, automatic
image search/generation, a generic lesson engine, spaced repetition and guaranteed
offline lesson downloads. Ordinary image caching does not promise offline access.

Delete this task document when the first-lesson work is complete. Move lasting
content, storage and operational documentation into the appropriate project docs.
