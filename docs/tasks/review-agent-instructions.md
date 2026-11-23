# TODO: review repository AGENTS.md instructions

Status: planned.

## Goal

Review agent instructions for usefulness, clarity and maintenance cost. Remove
obsolete or redundant guidance, clarify ambiguous rules, and add missing guidance
only where repository evidence supports it. Preserve effective safeguards.

## Scope

Inventory every repository `AGENTS.md`, starting with the root, backend and
frontend files. Review linked convention sections, especially
`docs/frontend-conventions.md` and `docs/openapi-contract.md`, together with
package scripts, CI and staged-check configuration.

Coordinate with [the repository skills task](repository-agent-skills.md) and
the [GitHub PR review performance task](github-pr-review-performance.md).
Distinguish mandatory rules, reference documentation, repeatable skill workflows,
automated enforcement and temporary task notes. Keep each at its appropriate owner.
This task does not authorize application refactoring or a rewrite of all guides.

## Review procedure

1. Establish the current instruction hierarchy and verify file links, commands
   and applicability from both the repository root and project subdirectories.
2. Identify repeated instructions, conflicting requirements, stale examples,
   unnecessarily broad rules and wording that encourages unrelated refactoring,
   excessive testing, unnecessary approvals or extra artifacts.
3. Compare requirements with actual tooling. Remove redundant explanations only
   when tooling enforces the same guarantee; retain behavioral guidance that
   typechecking, linting and tests cannot establish.
4. Look for missing guidance using concrete repository issues and recurring task
   failures. Do not add hypothetical rules or copy generic best-practice lists.
5. Record proposed removals, additions and clarifications with their rationale and
   evidence in this task while work remains, then apply focused documentation
   changes. Do not discard rules merely to achieve a shorter file.
6. Walk representative frontend, backend, cross-project API and documentation-only
   tasks through the revised instructions. Check that agents can find applicable
   guidance and determine required verification without contradictions.

## Acceptance and verification

- [ ] Every repository `AGENTS.md` has been reviewed with its relevant references.
- [ ] Root rules cover shared concerns; project-specific rules retain their
      correct ownership and point to authoritative detail without duplication.
- [ ] Removed rules have a concrete rationale; additions address demonstrated
      gaps. No arbitrary instruction-length target is imposed.
- [ ] Scope boundaries, user-change preservation, validation of required inputs,
      runtime boundaries, contract generation and staged-snapshot verification
      remain clear and effective.
- [ ] Links and documented commands match the current repository. Review whether
      documentation-check coverage includes the maintained instruction files and
      any newly introduced skill files; fix relevant gaps where justified.
- [ ] Representative task walkthroughs expose no conflicting or missing required
      steps. Report unresolved decisions instead of silently weakening policy.
- [ ] Run `npm --prefix frontend run docs:check`, directly check changed Markdown
      outside that command's coverage, and run `npm run check:staged` when staged
      changes exist. Run affected checks for any tooling changes.
- [ ] Delete this task document once the review and agreed changes are complete.
