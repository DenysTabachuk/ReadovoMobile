# TODO: add focused repository agent skills

Status: planned.

## Goal

Make recurring Readovo workflows easier for AI agents to complete consistently.
Keep mandatory repository rules in `AGENTS.md` and detailed conventions in their
existing guides. Skills should provide actionable workflows and reference those
sources rather than duplicate their contents.

## Scope

Coordinate with [the instruction review](review-agent-instructions.md) to avoid
creating competing sources of truth. Start with these three candidates:

1. `readovo-api-change`: trace affected callers; update DTOs, validation,
   serialization, Swagger, security and reachable errors; update frontend
   consumers and fixtures; verify HTTP contracts; regenerate and check artifacts.
   Cover offline export isolation and route coverage when composition changes.
2. `readovo-data-hooks`: implement or change requests, queries and mutations with
   correct ownership, generated transport types, runtime validation where needed,
   owner-specific cache keys, invalidation and rollback. Preserve auth/session
   boundaries and keep mutation-driven UI effects in per-call callbacks.
3. `readovo-verify-changes`: inspect the complete working-tree and staged diffs,
   select required checks from repository instructions and current configuration,
   run them, distinguish existing failures from regressions, and report results.
   Preserve staging choices and never treat an empty staged run as validation.

Begin with `readovo-api-change`. Validate that pilot before implementing the
remaining two; refine their boundaries if they overlap existing instructions.
Consider UI/theme/localization and unused-code-audit skills only when recurring
tasks demonstrate a need. Generic TypeScript or code-quality skills are outside
this initial scope.

## Implementation approach

- Read the current skill-creation guidance and confirm repository-local discovery
  for the intended agent before choosing installation paths.
- Give each skill a narrow description with clear triggers and exclusions, a
  concise procedure, relevant source references and observable completion criteria.
- Use `docs/openapi-contract.md`, `docs/frontend-conventions.md`, repository
  instructions and package/CI/staged-check configuration as authoritative inputs.
- Add scripts or templates only when they remove demonstrated repeated work.
  Keep new JavaScript scripts as `.mjs` ES modules.
- Do not relocate mandatory safeguards into an optionally invoked skill. Add
  conditional skill references to instructions only where they improve discovery.
- Do not add approval gates, commits, staging or external actions to workflows
  unless the user's task or an applicable existing requirement calls for them.

## Acceptance and verification

- [ ] The three initial workflows have focused repository-local skills with
      working references and no conflicting copies of repository policy.
- [ ] Skill metadata and structure pass the available skill validator, and the
      intended agent can discover them.
- [ ] Representative prompts exercise each workflow; unrelated prompts do not
      trigger it. Document any limitations in the task while work remains.
- [ ] Exercise the API pilot in a disposable fixture or isolated checkout rather
      than altering unrelated application code. Verify relevant failure handling,
      including stale artifacts and missing contract updates.
- [ ] Verification uses actual configuration, preserves user changes and staging,
      and reports failed or unavailable checks accurately.
- [ ] Run documentation formatting, relevant checks for any scripts/configuration
      changed, and `npm run check:staged` when staged changes exist.
- [ ] Delete this task document once the work is fully complete; keep lasting
      usage documentation with the skills or in the appropriate project guide.
