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
- Before handing changes back to the user, verify the final implementation with
  the relevant checks below. Rerun affected checks after subsequent fixes.
- When staged changes exist, also run `npm run check:staged` against the actual
  staged snapshot. A passing working-tree check does not verify staged content.
  Inspect staged/unstaged differences; never silently stage unrelated user changes.
  If nothing is staged, run the relevant working-tree checks and report that the
  staged check could not validate a commit snapshot; an empty run is not a pass.

## Commands

Run from the repository root:

- Frontend checks: `npm run ci:frontend`.
- Backend checks: `npm run ci:backend`.
- TypeScript for both projects: `npm run typecheck`.
- Instruction/documentation formatting: `npm --prefix frontend run docs:check`.
- Pre-commit staged checks: `npm run check:staged`.

Root `npm install` / `npm ci` runs `scripts/setup-git.cjs` before installing Husky.
On Windows it enables `core.longpaths` for this checkout so Git can prepare and
restore deeply nested component files during staged checks. For an existing
installation, rerun `npm run prepare` from root to apply the setup.

CI configuration lives in `.github/workflows/ci.yml`. Local staged checks are
configured in `lint-staged.config.mjs` and `.husky/pre-commit`; they check the
staged snapshot. Keep commands in these configurations as the source of truth.
