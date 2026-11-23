# TODO: investigate and improve Codex GitHub PR review performance

Status: planned.

## Goal

Identify supported ways to reduce Codex GitHub pull request review time while
preserving meaningful regression detection and actionable findings. Establish how
subagents work in the actual review integration and whether repository guidance
can control their use.

Coordinate instruction changes with
[the AGENTS.md review task](review-agent-instructions.md).

## Scope and investigation

The user reports that Codex sometimes takes too long to review GitHub pull
requests. Investigate this workflow, including
whether subagent guidance can improve it.

- Confirm the review mechanism used by the repository and inspect available
  settings and representative slow review runs. Record the reviewed commit, diff
  size, elapsed time and visible activity where available. Attribute causes only
  when supported by run evidence, and record unavailable diagnostics explicitly.
- Verify subagent availability and configuration for that specific GitHub review
  mechanism using current official documentation and observable run evidence.
  Record whether delegation is automatic, configurable or unverified. Evaluate
  delegation guidance if that mechanism supports it.
- Review how implementation-oriented instructions apply during a read-only PR
  review, especially full-project checks, staged-snapshot checks, generation and
  task-document lifecycle requirements. Clarify applicability where evidence shows
  unnecessary work or ambiguity while preserving implementation verification.
- Propose a concise `Code Review Rules` section at the appropriate owners. Focus
  on regressions introduced by the PR and follow affected callers, dependencies
  and contracts far enough to establish a concrete finding. Candidate concerns
  include API compatibility, auth/session ownership, cache isolation and atomic
  persistence. Select rules based on actual repository risks.
- Keep deterministic formatting and lint checks in CI. Define actionable findings
  with affected code, a reproducible trigger or supported failure path, and impact.
- If delegation is supported and measurements justify it, give independent review
  areas bounded questions and require the coordinator to validate and deduplicate
  findings. Measure both elapsed time and finding quality.
- Compare representative reviews before and after instruction changes where the
  integration permits. Include a known regression, a safe change and an unrelated
  change. Record noise, missed regressions and latency without claiming a speedup
  from an unmeasured change.

The official GitHub integration guide documents scoped `AGENTS.md` review rules
and one-off review focus in PR comments. The documentation checked during task
creation leaves automatic subagent use and delegation controls in GitHub Code
Review unverified. Recheck these capabilities during implementation.

References are the [GitHub review guide](https://learn.chatgpt.com/docs/third-party/github)
and [custom review rules guidance](https://developers.openai.com/blog/custom-code-review-rules-for-codex).

## Acceptance and verification

- [ ] The repository's GitHub review mechanism and available configuration are
      identified. Document subagent support and delegation controls with evidence,
      including any remaining unknowns.
- [ ] Representative slow runs have been investigated using available diagnostics.
      Observed causes and hypotheses are clearly distinguished.
- [ ] Review instructions address demonstrated issues and have clear applicability
      to PR review, with focused repository-specific correctness checks.
- [ ] Compare review quality and elapsed time before and after changes where
      possible. Record unavailable measurements and unresolved limitations.
- [ ] Run `npm --prefix frontend run docs:check` and directly check changed Markdown
      outside its coverage. Run relevant checks for configuration changes and
      `npm run check:staged` when staged changes exist.
- [ ] Keep lasting findings and usage guidance in appropriate project documentation.
      Delete this task document once the work is fully complete.
