# Repository conventions

## Frontend architecture

Apply these rules when working in `frontend/**`:

- `frontend/app/**` contains Expo Router routes and layouts. Keep route files thin and delegate domain UI and behavior to features.
- `frontend/features/<feature>/**` owns feature-specific screens, components, hooks, API code, types, constants, and utilities.
- Everything outside `frontend/features/**` is shared infrastructure or shared UI.
- `frontend/components/**` contains UI components genuinely reusable across multiple features. Feature-specific components must remain inside their feature.
- `frontend/api/**`, `hooks/**`, `utils/**`, `constants/**`, and `providers/**` contain only domain-agnostic or cross-feature code.
- Keep code at the narrowest valid scope. Promote it from component to feature to shared only after genuine reuse appears.
- Shared code must not import from `features/**`.
- Avoid importing another feature's internal files directly. Expose intentional cross-feature APIs through that feature's `index.ts`.
- Prefer the dependency direction `app` to `features` to shared code.
- Apply this target structure to new and touched code; do not perform unrelated repository-wide moves.

## Frontend API functions

Apply these rules when working in `frontend/**`:

- Give each exported API request function its own named directory with an `index.ts` entry point, for example `api/getAchievementsProfile/index.ts`.
- Use `api/index.ts` as the feature API barrel and expose cross-feature API functions through the feature's root `index.ts`.
- Keep request and response types shared by multiple API functions in the feature's `types.ts` or `api/types.ts`.
- Helpers used only by one API request may remain private in that request's `index.ts`; helpers shared by multiple requests belong in `api/utils/<helperName>/index.ts`.
- Do not combine unrelated endpoint functions in a single `api.ts` or `api/index.ts` implementation file.
- Apply this structure to new and touched API code; avoid unrelated repository-wide migrations.
- Before finishing a refactor, audit every API module changed in the current diff, including moved files and request functions mixed into other modules, and apply this rule consistently across that scope.

## Frontend utilities

Apply these rules to all utility modules in `frontend/**`, including feature-level and shared utilities:

- Give each independent utility its own named directory with an `index.ts` entry point. Do not group independent utilities merely because they belong to the same feature.
- Keep a helper private in the owning utility's file only when it is used exclusively to implement that utility. Extract helpers shared by multiple utilities to the narrowest common owner.
- Use barrel files for re-exports, keep shared types in colocated `types.ts`, and keep shared constants in `constants.ts`.
- Apply these rules consistently to all utility modules touched or moved by the current task. Audit the complete diff before finishing.

## Frontend type placement

Apply these rules when working in `frontend/**`:

- Place module-level `type` and `interface` declarations near the top of the file, after imports and before constants, functions, or components.
- Keep utility-private types in the owning utility's `index.ts`; do not export or move them to `types.ts` just to satisfy ordering.
- Keep types shared by multiple modules in the closest owning `types.ts`, following the existing scope rules.
- Apply this ordering to new and touched code; avoid unrelated repository-wide moves.

## Frontend utility documentation

Apply these rules to all utility modules in `frontend/**`, including component-level, feature-level, and shared utilities:

- Document every independent utility function with JSDoc immediately above its implementation, including utilities created or moved during refactoring.
- Describe what the utility does, document each input with `@param`, explain the output with `@returns`, and include at least one concrete `@example` with the expected result.
- For parameterless utilities, omit `@param`. For utilities returning `void`, describe their effect in `@returns`.
- Explain relevant edge cases, fallback behavior, input mutation, or side effects when they affect how callers should use the utility.
- Add inline comments for non-obvious implementation choices or invariants. Explain why the code works that way rather than narrating obvious statements.
- Keep descriptions concise and consistent with the implementation. Private implementation helpers need additional documentation only when their behavior is not clear from their name and code.
- Apply this documentation requirement to every utility created, changed, or moved by the current task; do not document unrelated modules as part of the same change.

Use this template, adapting the parameters and example to the actual utility:

```ts
/**
 * Briefly describe the operation and its purpose.
 *
 * @param input - Describe the accepted input and relevant constraints.
 * @returns Describe the result and relevant edge cases.
 * @example
 * utilityName(exampleInput);
 * // => expectedResult
 */
```

## Frontend utility tests

Apply these rules to all utility modules in `frontend/**`, including component-level, feature-level, shared, and API utilities:

- Create a colocated `index.spec.ts` whenever creating or extracting an independent utility, for example `utils/countSentences/index.spec.ts`. A new utility is not complete without meaningful tests.
- When changing utility behavior, update its tests in the same task. When moving a utility, move and update its existing tests; add the colocated test file if it has none.
- Cover the main expected behavior and relevant edge cases: empty or missing inputs accepted by the signature, boundaries and thresholds, fallback behavior, and error paths where applicable. Choose cases based on the utility's contract rather than imposing a fixed test count.
- Use concrete inputs and independently determined expected results. Do not compute expectations with the same algorithm as the implementation or rely only on assertions that a result exists.
- Treat JSDoc examples as useful starting cases, and add cases that exercise the utility's decisions. Do not turn a suspected bug into expected behavior just to make a test pass; resolve the intended behavior from the task and call sites.
- Check input immutability, ordering, stable keys, or reference reuse when these are part of the utility's contract.
- Make tests deterministic: control time and mock storage, native modules, and network boundaries when needed. Do not perform real network requests or depend on the developer's device or environment.
- Test private implementation helpers through the owning utility's public behavior; do not export them solely for tests.
- Use the existing Jest setup and keep tests at the narrowest owning scope. Do not add a new test framework for utility tests.
- Run the relevant tests before finishing, inspect failures, and fix problems introduced by the task. Report what was run and any checks that could not be completed; creating a test file alone is not verification.
- Apply this requirement to utilities created, extracted, moved, or behaviorally changed in the current task. Documentation-only edits do not require a repository-wide test backfill.

## Frontend component utilities

Apply these rules when working in `frontend/**`:

- Keep component entry files focused on React state, effects, event wiring, and rendering.
- Extract pure calculation, formatting, mapping, and `resolve*` helpers from component files into a colocated `utils` directory when they form an independently understandable operation or obscure the component flow.
- Give each independently reusable or testable utility its own named directory with an `index.ts` entry point, for example `utils/resolveResultTier/index.ts`.
- Helpers used only to implement one utility may remain private in that utility's `index.ts`; do not create separate modules for them.
- Keep utilities as close as possible to their usage: component-only utilities belong in the component's `utils`; utilities used by multiple components of one feature belong in that feature; only domain-agnostic, cross-feature utilities belong in shared frontend locations.
- Before adding a utility, search for an existing equivalent and reuse it only when its semantics genuinely match.
- Do not extract trivial inline callbacks or functions tightly coupled to component state merely to reduce the component's line count.
- Put types shared by sibling component utilities in the component's colocated `types.ts`. Do not export utility-private types.
- Apply these conventions to code touched by the current task; avoid unrelated repository-wide refactors.

## Frontend subcomponents

Apply these rules when working in `frontend/**`:

- Extract a JSX block into a colocated subcomponent when it has a clear visual or behavioral responsibility, owns meaningful state or effects, has substantial dedicated markup or styles, or can be described through a small cohesive props interface.
- Put component-specific subcomponents under the parent component's `components/<subcomponentName>/index.tsx` and keep their styles, private types, and private utilities with the closest owning subcomponent.
- After extracting a subcomponent, move the utilities and styles used only by that block with it instead of leaving them in the parent module.
- Keep the parent component responsible for orchestration and composition; keep implementation details inside the subcomponent that owns them.
- Do not extract trivial wrappers, one-line conditional blocks, or tightly coupled fragments solely to reduce line count.
- Promote a subcomponent outside its parent only when it is genuinely reused and its API is not coupled to the parent's implementation details.

## Frontend constants and magic values

Apply these rules when working in `frontend/**`:

- Replace non-obvious literals that encode behavior or design decisions—such as thresholds, limits, durations, dimensions, opacity levels, and repeated identifiers—with semantically named constants.
- Prefer an existing theme or design token for shared colors, spacing, typography, and sizing before introducing a new constant.
- Keep a value used by only one component local to that component; promote it to feature or shared constants only when multiple owners genuinely use the same concept.
- Do not introduce constants for self-explanatory values such as `0`, `1`, `true`, or `false` when the surrounding expression already makes their meaning clear.
- Name constants after their meaning rather than their raw value, for example `READY_VIDEO_OPACITY` instead of `OPACITY_094`.
- Values inside a `StyleSheet` are not automatically magic values when the style name and property already explain their purpose; extract them only when they are reused, encode a non-obvious invariant, or belong in a design token.
