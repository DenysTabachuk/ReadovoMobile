# Vocabulary: first mobile lesson

Status: step 1 implemented; awaiting UI review. Steps 2–8 are not started.

## Goal

Deliver one complete official A1 lesson, Common Things, in small changes that can
be reviewed independently. Do not implement the entire feature in one PR.
Build and review the mobile UI first using local demonstration content. Implement
R2, backend contracts and persistence after the learning experience is approved.

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
screen. Before infrastructure work, confirm R2 account access and the production
delivery domain. Account changes, billing choices and publishing assets are
separate explicit setup actions.

## Review sequence

Each item below is a separate review unit. Complete its checks and review its
result before starting the next. Split further if implementation reveals a larger
dependency; avoid combining unrelated refactoring with these changes.

### 1. Prototype lesson selection and overview

Implemented: Vocabulary is enabled, the local Common Things lesson opens a
four-stage overview, and both locales are supported. The first stage is marked
coming soon, subsequent stages are locked and Start is disabled. No progress,
word cards, exercises, R2 or backend work is included. Review the emulator UI
before moving to step 2.

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

- Build the word card, forward/back controls, progress indicator, example and
  translation using the local sample. Try pronunciation through existing speech.
- Review real image sizes, unavailable images/audio, scrolling, both themes and
  locales, small screens and larger text before expanding the content inventory.
- Keep position in local prototype state; do not claim restart persistence.
- Outcome: an interactive word-learning screen that can be reviewed independently.

### 3. Prototype practice, one exercise format per review

- Begin with word-to-picture selection and its correct/incorrect feedback.
- Review audio-to-picture and sentence-gap formats in subsequent small changes
  if they remain part of the agreed lesson. Avoid adding all formats at once.
- Use local example answers for the prototype only. Review distractors,
  explanations, mistakes returning for practice and progress behaviour.
- Outcome: approved exercise interactions without backend dependencies.

### 4. Connect and approve the complete local lesson

- Expand original content to 20 words and connect both learning blocks, practices
  and results. Review unlocking, replay and the distinction between viewing a
  word, practising it and completing the lesson.
- Walk through the whole experience in the emulator. Confirm the remaining
  content and completion decisions before designing production persistence.
- Keep progress temporary and rewards inactive. Do not add prototype results to
  the personal dictionary or existing streak/reward state.
- Outcome: an approved UI flow and content inventory that guide backend design.

### 5. Prepare R2 media

- Create the media bucket and configure development/production delivery. Keep
  write credentials out of the mobile app and repository.
- Optimise and manually upload approved images with stable, versioned keys.
  Record sources, authors and licence/attribution information.
- Replace temporary bundled word images with remote delivery and verify loading,
  caching and failures on a device. Keep interface illustrations bundled.
- Outcome: the reviewed UI uses production media without requiring a lesson API.

### 6. Persist content and expose read APIs

- Add a vocabulary backend module, reviewed Prisma migration and repeatable
  import/seed tooling using stable content IDs and media keys.
- Model only what the approved flow requires. Define the minimal revision policy
  needed to avoid silently changing an in-progress attempt after a content edit.
- Add authenticated catalogue/detail endpoints, module-owned DTOs, documented
  errors and HTTP tests. Generate both contract artifacts in this review.
- Outcome: database-backed lesson content and verified read contracts. Split the
  migration/seed and read endpoints into separate reviews if this becomes large.

### 7. Connect the approved UI to real lesson content

- Replace local content fixtures with API requests and data hooks using generated
  transport types, runtime validation and existing session/cache safeguards.
- Add real loading, empty, error and retry states. Preserve the reviewed layout.
- Remove superseded fixture wiring rather than maintaining a second production
  data path.
- Outcome: the approved lesson loads from the backend; progress remains temporary.

### 8. Persist learning and implement answer checking

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
