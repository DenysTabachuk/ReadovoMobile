# Frontend instructions

Read the relevant sections of [the convention guide](../docs/frontend-conventions.md)
when changing architecture, APIs, components, types, or utilities. It contains the
full requirements, examples, documentation template, and edge cases.

## Ownership and dependencies

- Keep Expo Router routes in `app` thin. Feature UI, behavior, data access, types,
  and domain utilities belong in `features/<feature>`.
- Everything outside `features` is shared infrastructure or genuinely reusable
  UI. Keep code at its narrowest owner; promote it only when reuse is real.
- Follow `app -> features -> shared`. Shared code must not import features; another
  feature's internals are accessed only through that feature's root `index.ts`.

## Data layer

- Use `api/requests` for HTTP functions, `api/queries` for query hooks, and
  `api/mutations` for mutation hooks. Give each request and each React Query
  operation its own named directory with an `index.ts` entry point.
- Keep barrels for re-exports. Expose intentional cross-feature APIs through the
  owning feature's root `index.ts`; keep shared API types in `api/types.ts` or the
  feature's `types.ts`.
- Keep transport independent of React/React Query. Data hooks own request
  execution, query keys, cache updates, invalidation, and optimistic rollback.
  UI state, modal visibility, and navigation belong in components or UI hooks.
- API modules must not import screen internals or their own aggregate API barrel.
  Keep single-request helpers private; shared request helpers belong in `api/utils`.

## Components and utilities

- Keep component entry files focused on state, effects, event wiring, and rendering.
  Extract meaningful calculations and cohesive UI blocks, not trivial callbacks
  or wrappers merely to reduce line count.
- Parent-only subcomponents belong in `components/<name>/index.tsx` under their
  parent. Move the styles, types, and utilities owned by the extracted block with it.
- Each independent utility gets `utils/<name>/index.ts` at its closest owner.
  Search for an equivalent before creating one. Keep exclusive implementation
  helpers private; keep shared helpers at their narrowest common owner.
- Use barrels for re-exports, colocated `types.ts` for shared types, and
  `constants.ts` for shared constants. Keep component-only values local.

## Types and values

- Put module-level types after imports, before constants and implementations.
  Name props and parameter-object types; avoid inline object types in signatures.
- Keep private types in their module. Move types to the closest `types.ts` only
  when shared. Keep callback types within their owner unless independently reused.
- One or two simple positional parameters are fine; more than three require a
  named parameter object. With exactly three, choose readability, preferring an
  object for callbacks/options. Do not alias individual primitives just for style.
- Name non-obvious behavioral/design values and prefer existing theme tokens.
  Do not extract self-explanatory literals or obvious, single-use StyleSheet values.

## Hook and utility documentation, utility tests

- Document complex hooks with JSDoc explaining responsibility, inputs, returned
  API, and relevant state transitions, effects, or cleanup, plus a usage example.
  Apply this to hooks created, changed, or moved; skip trivial wrappers. See the
  guide's hook documentation section.

- Every independent utility created, changed, or moved needs concise JSDoc with
  inputs, output, relevant edge cases/side effects, and a concrete expected-result
  example. Explain non-obvious invariants inline; document private helpers only
  when their behavior is unclear. See the guide for the JSDoc template.
- Create/move/update a colocated `index.spec.ts` for every independent utility
  created, extracted, moved, or behaviorally changed. Use existing Jest; test
  private helpers through public behavior. Documentation-only edits need no
  unrelated test backfill.
- Test the contract and relevant boundaries, fallbacks, errors, immutability,
  ordering, stable keys, and reference reuse. Use independent concrete expected
  results. Resolve suspected bugs rather than codifying them as expectations.
- Keep tests deterministic; control time and mock storage/native/network boundaries.
  Run relevant tests and inspect failures. Audit the complete task diff, including
  moved API/utility modules, before finishing.

## Verification

- TypeScript, ESLint, Prettier, and Jest configurations enforce mechanical checks;
  do not duplicate their formatting rules here. Follow the guide's tool/review map.
- Run `npm run ci` from `frontend`, or `npm run ci:frontend` from the repository root.
  For documentation-only work, run `npm --prefix frontend run docs:check` from root.
