# Vocabulary content updates with saved progress

Status: deferred. Revisit before implementing saved vocabulary progress or attempts.

## Problem

The initial content schema has one lesson record per unique slug and no revision
field. There are currently no saved vocabulary attempts. Once progress exists,
editing a lesson in place can change the meaning of stored answers or positions:

- A question's correct answer or distractors can change after the attempt began.
- Removing a word/question can leave stored progress referencing missing content.
- Reordering stages or cards can make a saved numeric position resume elsewhere.
- Retrying an old answer submission can produce a different result after an edit.

## Decision before persistence

Choose the smallest policy that fits the supported editing workflow. Possible
approaches include immutable published content, versioned lesson snapshots, or
attempt-owned snapshots of questions and answer keys. Do not assume that adding a
numeric `revision` field alone solves reference integrity or resume behaviour.

## Follow-up work

- Define which published content edits are permitted and whether active attempts
  continue, restart explicitly, or migrate. Distinguish translation-only fixes
  from changes to word rosters, stage order and answer keys.
- Choose stable progress references and deletion rules; avoid relying only on
  array positions or the current latest content.
- If revisions are selected, implement the schema migration, immutable import/
  publication workflow, and explicit attempt-to-revision references together.
- Cover resume after content changes, removed content, stale submissions,
  idempotent retries and retention of referenced content in relevant tests.
- Update the content documentation and initial seed/import workflow.

No version tables, revision counters or automatic migration of user progress are
required in the current content-only implementation. Delete this task after the
policy is implemented; retain lasting decisions in the feature documentation.
