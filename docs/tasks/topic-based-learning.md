# Topic-based learning

Status: the first coherent thematic learning slice is implemented. Additional
authored level variants and saved progress remain pending. Lasting architecture
and API details live in [Topic-based learning](../topic-based-learning.md).

## Variant-owned vocabulary verification

The existing local Oktoberfest A1 variant retained 20 words, 20 exercises, 60
choices and five reading questions after migration. On Android with the local
API, the topic, lesson, first word card and reader opened successfully. Picture,
listening and sentence-gap answers returned feedback, and Android Back returned
from practice to the lesson. Demo image placeholders remained visible. Audio
playback and a full 20-question attempt were outside this device check.

## Agreed product direction

- The first tab opens topics directly. The rejected Vocabulary/Reading activity
  chooser is removed; words and reading are parts of one thematic lesson.
- Topics can contain child topics and lessons. Topic/lesson identity is shared
  across English levels; show one card with available levels, not duplicate cards.
- A lesson variant owns its words, vocabulary exercises, text and comprehension
  questions. Levels have deliberately different materials, not only different labels.
- Choose the level in the catalogue or on the lesson overview. The same temporary
  selection is used in both places. Missing levels are explicit, with no substitution.
- The activity order is words, vocabulary test, reading and comprehension. Access
  is free; no mandatory completion gates are introduced.
- Prepared text and questions are stored in PostgreSQL. Thematic learning does
  not generate content during a learner's session.
- Reuse existing word-card/practice infrastructure internally without exposing
  Vocabulary and Reading as separate product categories.
- Grammar is the second tab; Dictionary and Profile follow. Settings opens from
  Profile. Grammar content remains explicitly marked coming soon.

## Implemented

- Additive Prisma models/migration for ordered topic hierarchy, translated
  catalogue copy, shared lesson identity, CEFR variants and authored comprehension.
- SQL guards for topic cycles, variant-scoped vocabulary references, ordering and
  unique correct choices. Vocabulary content belongs to the thematic variant.
- Authenticated catalogue/lesson reads and stateless vocabulary and comprehension checking,
  with OpenAPI, transport generation and standalone runtime response validators.
- Direct topic catalogue, nested browsing, a shared level selector and unified
  lesson overview. Existing word cards/practice compose into that lesson rather
  than routing through the old Vocabulary catalogue/overview.
- Prepared reading, comprehension feedback, locked choices, result counts and
  retry. No progress, attempts, mastery, rewards or streak writes were added.
- Explicit, repeatable local A1 sample for Germany → Oktoberfest, with 20 words,
  mixed practice, an original four-paragraph text and five comprehension
  questions. Word images are placeholders for this development sample.
- Illustrated full-width catalogue cards, full-width local title/description
  search and a compact level/filter row. Reuses the shared option-picker sheet;
  catalogue choices are A1, A2, B1 and B2. Filters currently open an explicit
  coming-soon sheet. Search covers only the currently loaded catalogue section.
- Required nullable topic cover keys, inherited by lesson cards, with a local
  cover migration and bundled generated covers/fallback. Prompts and provenance
  are recorded in the learning feature's topic-cover README.
- Germany -> Oktoberfest is now the first local A1 test sample, with 20 new
  topic-specific words in two blocks, 20 mixed exercises, an original fictional
  four-paragraph visit and five comprehension questions. Other level adaptations
  have not been authored. At the user's request, display titles no longer carry
  test-data suffixes, and the previous Everyday Life topic/lesson plus Common
  Things component have been removed by their exact sample identities. The seed
  no longer recreates them. The content remains documented as a development sample.

## Verification

- Local migration applied successfully. Repeated explicit seeding retained one
  sample topic, lesson and variant with five comprehension questions.
- A rollback-only SQL smoke check rejected a topic cycle, a B2 variant referencing
  A1 vocabulary and a second correct choice for one question.
- Frontend CI passed: 168 suites, 857 tests, typecheck, lint, formatting and
  generated contract freshness. Tests cover a unique topic card across levels,
  explicit unavailable variants, both word-block transitions and comprehension
  feedback/locking/result/retry and preservation of open reading after failed
  background refresh. Backend CI passed: 104 suites, 869 tests, typecheck, lint,
  formatting and OpenAPI freshness. Root contract checks and diff checks passed.
- Backend HTTP tests verify authenticated real controllers, DTO rejection,
  serialization against OpenAPI, locale-only fallback, scoped A2/B2 content,
  unavailable-level nulls, hidden ancestors, answer-key exclusion and stateless
  correct/incorrect/retried checks. Prisma is mocked at the persistence boundary.
- Android `emulator-5554` in Ukrainian/dark: direct topic entry, one card while
  selecting B2, nested topic and unified lesson entry, explicit unavailable B2,
  switching to A1, first/second word cards, mixed-practice entry and one successful
  check, all prepared reading paragraphs and all five comprehension questions.
  Correct/incorrect feedback and locked choices were observed; the result was
  the expected 3/5, and retry reset to unanswered question 1/5. The emulator was
  returned to the unified lesson overview. Only device-scoped ADB capture/input was used.
- No new ReactNativeJS/AndroidRuntime errors appeared in the scoped walkthrough
  log sample after sign-in. The existing Google account was reused normally.
- A final fresh-bundle probe found a stale Metro resolution error after staged
  checks/file moves. Restarting only the identified Metro process with `--clear`
  produced a successful 2459-module Android build and HTTP 200 for the current
  bundle. Clean startup and ordinary Google sign-in then opened the Topics
  catalogue successfully. The emulator was left on that catalogue, with A1 selected.
- The staged snapshot was checked and still fails because the user's partial
  selection has missing Vocabulary dependencies and obsolete imports. Lint-staged
  restored the original state; staged diff hash stayed
  `b000433d890e8a56af93c6558e610966707c0ede`. No files were staged automatically.
- Current catalogue design was checked on Android in Ukrainian/dark after
  reloading the development client from a freshly generated HTTP-200 bundle:
  compact spacing, Germany cover, A1-B2 dropdown, filters placeholder, no-results
  local search and clearing it. Germany -> Oktoberfest opens the unified lesson.
  Its first word card, mixed-practice entry and one successful word check, all
  four reading paragraphs, and one incorrect comprehension check with the right
  answer/explanation were observed. The app was left on the Oktoberfest overview.
  These are focused checks, not a full run of the new sample's exercises.
- Restored the earlier numbered lesson-path visual pattern for the unified
  overview: icon/description cards, a highlighted entry step and one Start Lesson
  action. Frontend CI remained green (168 suites, 856 tests). Android in
  Ukrainian/dark verified all four cards, scrolling to the footer, starting the
  first word block and opening reading directly, then returning to the overview.
  English/light appearance was not device-reviewed in this focused update.
- The thematic word browser now combines learning rosters into one ordered set
  (20 cards for Oktoberfest), without part labels or an extra Back to Lesson
  button. Navigation Back closes the current activity before leaving the overview.
  Tests cover the combined roster and navigation removal handling. Android in
  Ukrainian/dark verified 1/20 through 11/20, Next from 10 to 11, Previous back to
  10, header Back to the overview, Android Back from reading to the overview and
  header Back from the overview to Germany. The final source was loaded after
  clearing Metro's stale cache; the fresh Android bundle returned HTTP 200.

Actual A2/B2 adaptations, nested multi-topic device browsing, a complete 20-question
mixed run in this new wrapper, English/light review of these new screens, network
failure/retry and audible speech output are not claimed as device-verified.

## Remaining work

### Illustrated lesson follow-up (in progress)

The user approved the illustrated overview, editorial reading layout and support
for comprehension images. The overview now renders the existing topic cover with
a readable title scrim; reading uses that cover, editorial typography, literal
vocabulary highlighting, a working larger-text toggle and an end-of-story panel.
Comprehension has a question-position track, numbered radio choices and bottom
action/feedback layout. Back semantics and stateless checking remain intact.

Two original images were generated with built-in ImageGen and saved under
`frontend/features/learning/assets/lesson-art/`; exact prompts are in its README.
They are prepared assets, not yet connected to independent reading/question
fields. A required architectural question is pending: extend the established
image-key scheme with optional reading and per-question images, no authoring UI
in this step, versus keeping only the inherited cover for now. Per repository
instructions, no database/API changes have been made before that agreement.

Frontend CI passed (169 suites, 861 tests). Android in Ukrainian/dark verified
the overview cover, reading typography/highlights, both text sizes, all paragraphs
and the reading-to-comprehension transition, one correct check and header Back.
Light/English appearance and independent reading/question image loading remain
unverified. Staged checking failed against the user's current snapshot; its hash
remained `f66bcd50263bcb15b022f31712efe116592e2665`. The current working-tree CI
passes. Metro required a cache clear after staged checking; fresh bundle HTTP 200.

### Content and progress

1. Review this coherent A1 slice, then prepare a second genuinely adapted level
   for the same sample lesson. Decide the initial supported content levels and
   author words, text and questions together. Germany/Oktoberfest is imported
   only as explicit local test content, not approved production content.
2. Review UX details including whether level choice should persist across app
   restarts, whether switching is allowed inside an active exercise, and how to
   handle unsaved work. Current switching is on the overview and remains temporary.
3. Decide any permanent entry for free article discovery separately. Do not
   restore the rejected Vocabulary/Reading chooser.
4. Resolve [content editing with progress](vocabulary-content-updates.md) before
   saving attempts/progress. Agree completion, reward and delayed-review policies
   separately; existing article quiz completion must not award rewards implicitly.
5. Review real media delivery and publication eligibility before production use.

An unrelated pre-existing observation: the Profile calendar month heading remained
Ukrainian after switching the surrounding UI to English. Calendar implementation
was not changed in this task.

Keep this task while work remains. Delete it when complete and retain lasting
decisions in the feature documentation.

### Topics library follow-up

- [x] Add All, Saved and Completed views. Saved and Completed list individual
      lessons with their parent topic. Show a completion badge only after answering
      the final comprehension question and reaching the results.
- [x] Keep bookmarks and completion local to each account on this device. A
      completion flag is for the lesson as a whole, regardless of level or score.
- [ ] Design cross-device sync before changing the API or database. Define stable
      lesson identity, import of existing local flags, conflict handling for removed
      bookmarks, and behavior for unpublished lessons. Verify isolation by account.
- [x] Restore the Wikipedia discovery card in All, above the topic cards. It
      opens the existing article catalogue, which owns article bookmarks.
- [ ] Define and implement topic and lesson filter options. Both catalogue
      screens expose the filter sheet through the icon next to search. The sheet
      currently shows the existing placeholder message.

Verified on Android in Ukrainian dark mode with the local API. Bookmarked
Oktoberfest, opened it directly from Saved, finished all five comprehension
questions, removed the bookmark, and confirmed the Completed badge persisted
after app restart and sign-in. Frontend CI passed. The existing staged snapshot
failed lint on the vocabulary fixture import in `learning/testing/fixtures.ts`.

The updated catalogue layout was verified against the local API on Android in
Ukrainian dark mode. The filter sheet opened from both catalogue screens. The
topic title appeared once in the navigation header, and the lesson card showed
its thumbnail, description and completion badge. The bookmark toggled in place,
and the chevron opened the lesson.

The lesson overview header was verified on Android in Ukrainian dark mode. The
level pill opened the picker, switching to A2 showed the unavailable state, and
switching back to A1 restored the lesson. The header bookmark toggled both ways.
The controls disappeared in the reader and returned on Back.

The reading cover now extends from edge to edge below the header and fades into
the screen background. Verified the cover and reading layout on Android in
Ukrainian dark mode. Light mode was not reviewed on the device for this change.

On Android in Ukrainian dark mode, the Wikipedia card opened the existing
catalogue, which loaded a set of 20 articles. The Cuisine article opened in the
reader, and Back returned through the catalogue to Topics.
