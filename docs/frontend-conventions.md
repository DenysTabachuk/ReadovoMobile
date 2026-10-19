# Frontend conventions

Detailed examples and edge cases for [frontend/AGENTS.md](../frontend/AGENTS.md).
Read the relevant sections before changing architecture, APIs, components, types,
or utilities. The conventions apply to new, moved, and touched implementation;
import-only updates do not require refactoring the imported module.

## Architecture

- `frontend/app/**` contains Expo Router routes and layouts. Keep route files thin and delegate domain UI and behavior to features.
- `frontend/features/<feature>/**` owns feature-specific screens, components, hooks, API code, types, constants, and utilities.
- Everything outside `frontend/features/**` is shared infrastructure or shared UI.
- `frontend/components/**` contains UI components genuinely reusable across multiple features. Feature-specific components must remain inside their feature.
- `frontend/api/**`, `hooks/**`, `utils/**`, `constants/**`, and `providers/**` contain only domain-agnostic or cross-feature code.
- Keep code at the narrowest valid scope. Promote it from component to feature to shared only after genuine reuse appears.
- Shared code must not import from `features/**`.
- Avoid importing another feature's internal files directly. Expose intentional cross-feature APIs through that feature's `index.ts`.
- Prefer the dependency direction `app` to `features` to shared code.

## API functions

- Organize each feature's data layer under `api/requests`, `api/queries`, and `api/mutations`. Keep HTTP functions in `requests`, React Query read hooks in `queries`, and React Query mutation hooks in `mutations`.
- Give each exported API request function its own named directory with an `index.ts` entry point, for example `api/requests/getAchievementsProfile/index.ts`. Request functions must not depend on React or React Query.
- Use `requests/index.ts`, `queries/index.ts`, and `mutations/index.ts` as re-export barrels where those groups exist, and `api/index.ts` as the feature API barrel. Expose intentional cross-feature APIs through the feature's root `index.ts`.
- Keep request and response types shared by multiple API functions in the feature's `types.ts` or `api/types.ts`.
- Helpers used only by one API request may remain private in that request's `index.ts`; helpers shared by multiple requests belong in `api/utils/<helperName>/index.ts`.
- Do not combine unrelated endpoint functions in a single `api.ts` or `api/index.ts` implementation file.
- Before finishing a refactor, audit every API module changed in the current diff, including moved files and request functions mixed into other modules, and apply this rule consistently across that scope.

## React Query hooks

- Wrap each `useQuery` and `useMutation` operation in its own named custom hook, with an `index.ts` entry point under the owning feature's `api/queries` or `api/mutations`, for example `api/queries/useArticleDetailQuery/index.ts`.
- Keep query keys, request execution, cache updates, invalidation, and optimistic rollback inside the owning query or mutation hook.
- Keep screen state, modal visibility, and navigation in the calling component or orchestration hook. Pass typed callbacks for screen-specific success behavior when needed.
- Keep data hooks in the feature that owns the data. For example, a dictionary mutation used by an article screen belongs in `dictionary/api/mutations` and is imported through `dictionary/index.ts`.
- Keep UI and orchestration hooks in feature- or screen-level `hooks` directories, separate from the API layer. API hooks must not depend on screen internals or their utility barrels.
- Within the API layer, import request functions, types, and sibling modules directly or through their group barrels; do not import the owning feature's aggregate API barrel back into itself.

## Hook documentation

- Add JSDoc immediately above complex hooks created, changed, or moved during the task. Complexity includes coordinated state transitions, asynchronous workflows, optimistic cache changes, timers, and native subscriptions; line count alone is not a criterion.
- Explain the hook's responsibility, each input with `@param`, and the returned state/actions with `@returns`. Omit `@param` for parameterless hooks; describe related return values together instead of repeating every property name.
- Document state transitions, side effects, cleanup, error handling, or caller obligations that affect correct usage. Distinguish actions triggered by callers from effects that run automatically. Do not promise cancellation, atomic writes, or deduplication unless the implementation provides them.
- Include a concrete `@example` showing use inside a component or another hook and the expected behavior. For asynchronous actions, explain what happens after completion rather than implying an immediate result.
- Keep the description concise and focused on the contract. Use inline comments for non-obvious reasons or invariants, without narrating each implementation step.
- Simple state hooks and straightforward `useQuery`/`useMutation` wrappers need no boilerplate JSDoc. Existing hooks outside the task scope do not need a documentation backfill. Comments complement readable code; they do not replace simplifying an oversized hook.

```ts
/**
 * Owns an article's text versions and selects the version shown by the reader.
 *
 * @param article - Article for the current reader instance.
 * @param onTextChange - Clears external selection when the displayed text changes.
 * @returns Available versions, generation state, and selection/generation actions.
 * @example
 * // Inside a component or another hook:
 * const text = useArticleTransformations(article, clearSelection);
 * text.generateTransformation('summary');
 * // Requests a summary for the selected level; selects it after successful generation
 * // if that level is still selected.
 */
```

## Utilities

- Give each independent utility its own named directory with an `index.ts` entry point. Do not group independent utilities merely because they belong to the same feature.
- Keep a helper private in the owning utility's file only when it is used exclusively to implement that utility. Extract helpers shared by multiple utilities to the narrowest common owner.
- Use barrel files for re-exports, keep shared types in colocated `types.ts`, and keep shared constants in `constants.ts`.
- Apply these rules consistently to all utility modules touched or moved by the current task. Audit the complete diff before finishing.

## Type placement

- Place module-level `type` and `interface` declarations near the top of the file, after imports and before constants, functions, or components.
- Keep utility-private types in the owning utility's `index.ts`; do not export or move them to `types.ts` just to satisfy ordering.
- Keep types shared by multiple modules in the closest owning `types.ts`, following the existing scope rules.

## Props and parameter types

- Declare component props and function/hook parameter objects as named types or interfaces instead of writing inline object types in signatures. Prefer descriptive names such as `ArticleHeaderProps` or `UseGenerateArticleQuizMutationParams`.
- Keep types used by one module near its top, after imports. Move them to the closest owning `types.ts` only when shared by multiple modules; a named type does not require a separate file.
- Functions and hooks with one or two simple parameters may use positional arguments. With more than three parameters, use one object with named properties and a named parameter type.
- For exactly three parameters, choose based on readability; prefer an object when callbacks, options, or similar argument types make the signature or call site difficult to scan.
- Keep callback signatures inside the owning props/parameter type unless the callback type itself is meaningfully reused. Do not introduce aliases for individual primitive parameters solely to satisfy this rule.

## Utility documentation

- Document every independent utility function with JSDoc immediately above its implementation, including utilities created or moved during refactoring.
- Describe what the utility does, document each input with `@param`, explain the output with `@returns`, and include at least one concrete `@example` with the expected result.
- For parameterless utilities, omit `@param`. For utilities returning `void`, describe their effect in `@returns`.
- Explain relevant edge cases, fallback behavior, input mutation, or side effects when they affect how callers should use the utility.
- Add inline comments for non-obvious implementation choices or invariants. Explain why the code works that way rather than narrating obvious statements.
- Keep descriptions concise and consistent with the implementation. Private implementation helpers need additional documentation only when their behavior is not clear from their name and code.

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

## Utility tests

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

## Component utilities

- Keep component entry files focused on React state, effects, event wiring, and rendering.
- Extract pure calculation, formatting, mapping, and `resolve*` helpers from component files into a colocated `utils` directory when they form an independently understandable operation or obscure the component flow.
- Give each independently reusable or testable utility its own named directory with an `index.ts` entry point, for example `utils/resolveResultTier/index.ts`.
- Helpers used only to implement one utility may remain private in that utility's `index.ts`; do not create separate modules for them.
- Keep utilities as close as possible to their usage: component-only utilities belong in the component's `utils`; utilities used by multiple components of one feature belong in that feature; only domain-agnostic, cross-feature utilities belong in shared frontend locations.
- Before adding a utility, search for an existing equivalent and reuse it only when its semantics genuinely match.
- Do not extract trivial inline callbacks or functions tightly coupled to component state merely to reduce the component's line count.
- Put types shared by sibling component utilities in the component's colocated `types.ts`. Do not export utility-private types.

## Subcomponents

- Extract a JSX block into a colocated subcomponent when it has a clear visual or behavioral responsibility, owns meaningful state or effects, has substantial dedicated markup or styles, or can be described through a small cohesive props interface.
- Put component-specific subcomponents under the parent component's `components/<subcomponentName>/index.tsx` and keep their styles, private types, and private utilities with the closest owning subcomponent.
- After extracting a subcomponent, move the utilities and styles used only by that block with it instead of leaving them in the parent module.
- Keep the parent component responsible for orchestration and composition; keep implementation details inside the subcomponent that owns them.
- Do not extract trivial wrappers, one-line conditional blocks, or tightly coupled fragments solely to reduce line count.
- Promote a subcomponent outside its parent only when it is genuinely reused and its API is not coupled to the parent's implementation details.

## Constants and magic values

- Replace non-obvious literals that encode behavior or design decisions—such as thresholds, limits, durations, dimensions, opacity levels, and repeated identifiers—with semantically named constants.
- Prefer an existing theme or design token for shared colors, spacing, typography, and sizing before introducing a new constant.
- Keep a value used by only one component local to that component; promote it to feature or shared constants only when multiple owners genuinely use the same concept.
- Do not introduce constants for self-explanatory values such as `0`, `1`, `true`, or `false` when the surrounding expression already makes their meaning clear.
- Name constants after their meaning rather than their raw value, for example `READY_VIDEO_OPACITY` instead of `OPACITY_094`.
- Values inside a `StyleSheet` are not automatically magic values when the style name and property already explain their purpose; extract them only when they are reused, encode a non-obvious invariant, or belong in a design token.

## Data layer example

```text
features/articles/
  api/
    requests/fetchWikipediaArticleDetail/index.ts
    queries/useArticleDetailQuery/index.ts
    mutations/useSimplifyArticleMutation/index.ts
    utils/generateArticleQuizRequest/
      index.ts
      index.spec.ts
    requests/index.ts
    queries/index.ts
    mutations/index.ts
    types.ts
    index.ts
  screens/ArticleScreen/
    hooks/useArticleTransformations/index.ts
  index.ts
```

HTTP requests handle transport. Query/mutation hooks own cache behavior. Screen
hooks coordinate UI state and navigation. Internal API modules import requests,
types, and sibling group barrels directly to avoid importing their own aggregate
API barrel. A cross-feature consumer uses the owning feature's root `index.ts`.

## Named parameter example

```ts
type UseGenerateArticleQuizMutationParams = {
  article: WikipediaArticleDetail;
  selectedLevel: SimplifyArticleLevel;
  onSuccess: (
    mode: ArticleQuizMode,
    resolvedLevel: SimplifyArticleLevel,
  ) => void;
};

export function useGenerateArticleQuizMutation({
  article,
  selectedLevel,
  onSuccess,
}: UseGenerateArticleQuizMutationParams) {
  // Request/cache behavior belongs here; the caller owns navigation.
}
```

The type stays in this module unless another module needs it. One or two simple
positional arguments are acceptable. More than three arguments require an object;
for exactly three, prefer an object when callbacks or options obscure the call.

## Automated checks and review responsibilities

| Tool       | Responsibility                                                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript | Strict typing, unused locals and parameters, consistent file-name casing, switch fallthrough.                                                                                                                                                                             |
| ESLint     | Expo/React rules, shared-to-feature and cross-feature import boundaries, API-to-screen dependencies, API self-barrel imports, direct React/React Query imports in `api/requests`, and named parameter objects/at most three positional parameters in migrated API groups. |
| Prettier   | Source and instruction/documentation formatting.                                                                                                                                                                                                                          |
| Jest       | Utility contracts and regression tests, including lint-configuration regression cases.                                                                                                                                                                                    |
| CI         | Run the same TypeScript, ESLint, Prettier, documentation, and Jest checks on pull requests and pushes to `main`.                                                                                                                                                          |

Import boundaries resolve actual files, including relative imports and the `@/`
alias. An unresolved import cannot be classified by the boundary rule; TypeScript
checks module resolution for typed code. HTTP dependency restrictions check static
imports/re-exports, and are not a guarantee that a transitive dependency never
loads React.

Signature lint rules currently cover `api/requests`, `api/queries`, and
`api/mutations`; screen/component signatures retain the same convention through
review while legacy code migrates gradually.

Review still decides feature ownership, meaningful reuse, extraction boundaries,
parameter readability, constants, JSDoc accuracy, and test quality. Do not
replace those decisions with line-count limits or blanket magic-number rules.
Existing modules outside the touched implementation migrate when they are next
changed; do not turn an import-path update into a repository-wide refactor.

From the repository root:

```sh
npm run ci:frontend
```

For documentation-only edits:

```sh
npm --prefix frontend run docs:check
```

CI and the existing pre-commit hook already run TypeScript, linting, formatting,
and tests for code changes. Instruction and convention-guide changes also run formatting in CI.
