# Repository instructions

- Before changing `frontend/**`, read [frontend/AGENTS.md](frontend/AGENTS.md),
  including when the session starts from the repository root. Read the linked
  convention sections relevant to the task.
- Keep changes within the requested scope. Apply conventions to new, moved, and
  touched implementation; do not migrate unrelated code. Import-only updates do
  not require refactoring the module's existing implementation.
- Keep existing user changes intact. Report logical problems and material
  improvement opportunities found while working.
- Run checks relevant to the change and report what passed or could not run.
  Fix failures introduced by the task; distinguish pre-existing failures.

## Commands

Run from the repository root:

- Frontend checks: `npm run ci:frontend`.
- Backend checks: `npm run ci:backend`.
- TypeScript for both projects: `npm run typecheck`.
- Instruction/documentation formatting: `npm --prefix frontend run docs:check`.

CI configuration lives in `.github/workflows/ci.yml`. Local staged checks are
configured in `lint-staged.config.mjs` and `.husky/pre-commit`; they check the
staged snapshot. Keep commands in these configurations as the source of truth.
