# Task: Centralize theme colors and make theme behavior consistent

Status: stage 1 committed as `6bd207e` on `feat/theme-foundation`, based on
`origin/main` at `9c6a069`. Stage 2 is implemented and awaiting review. Stage 3
remains outstanding; do not begin it before the stage 2 review.
The user's revised three-stage scope supersedes the original review batches.
Stop after each stage for review. Do not start stage 2 during stage 1.

## Goal

Give application UI a single theme API with semantic light/dark color palettes,
while preserving the user's explicit preference and the existing system-following
mode. Components should consume resolved colors through `useTheme()` instead of
repeating palette selection and raw color values throughout the repository.

Complete the migration without redesigning the application or replacing its
styling framework. Keep existing spacing, typography and feature ownership.

## Initial audit (before stage 1)

- `PreferencesProvider` owns persisted `system | light | dark` preferences and
  derives a resolved `light | dark` scheme. System changes are observed through
  React Native's `useColorScheme`. Stored theme values are validated on read.
- Application `useColorScheme` hooks already read the provider, including on web.
  A new theme hook must retain that behavior instead of reading the system scheme
  directly and bypassing the saved preference.
- `Colors` contains basic light/dark values, but many surfaces, borders, focus,
  selection and feedback colors are defined independently by components.
- `Spacing` and `Typography` already exist. Local StyleSheet measurements are
  not inherently defects and do not all need token extraction.
- React Navigation receives its stock palettes, while application views use
  `Colors`. Their color roles currently have different values.
- Settings exposes a light/dark switch. After a manual selection, the UI provides
  no way to return to `system`, despite provider support for that preference.
- Theme state updates after the storage write. The settings caller does not
  handle a rejected theme write. Rapid-change behavior also needs verification.
- Some consumers select `Colors.light` directly. Others repeat identical
  light/dark pairs, including the shared time and option picker fields.
- Existing storage tests cover theme parsing/persistence. Provider theme
  transitions, navigation palette consistency and component theme updates need
  focused coverage. Native control behavior has not been verified on a device.

## Intended architecture

- Keep raw hex/RGB values in a small centralized base palette (`palette.blue100`,
  `palette.gray100`, etc.). Do not create unused shade families or merge nearby
  shades mechanically. Use hundred-step shade names and consolidate close legacy
  values when they serve the same purpose. Semantic tokens reference this palette;
  direct palette use is allowed for justified decorations and brand colors.
  Keep the base palette opaque; compose alpha in semantic overlay tokens or
  narrowly owned decorative effects rather than adding alpha palette entries.
- Maintain one canonical set of semantic color palettes with matching keys and
  checked TypeScript types for light and dark in `constants/theme.ts`. Components
  consume resolved semantic colors; do not introduce feature-specific theme
  catalogues or local light/dark style tables.
- Expose `useTheme()` returning `theme`, `colors` and `isDark`. Here `theme` is the
  resolved `light | dark` scheme. Keep the user's `system | light | dark` preference
  distinct and owned by `PreferencesProvider`.
- Derive the hook from the existing preferences mechanism. Do not introduce a
  second theme provider or a separate system-theme subscription in each consumer.
- Define tokens by UI responsibility: background, surface, text, secondary text,
  primary action, text on a primary action, border, focus, selected state, disabled
  state and feedback roles where real consumers require them. Confirm the initial
  token set from usage; this list is not a mandatory catalogue of unused tokens.
- Equal hex values do not automatically mean equal roles. Keep distinct tokens
  when their meanings and future changes differ. Decorative effects, mascot assets
  and gradients stay with their actual owner unless multiple consumers demonstrate
  shared ownership. These exceptions do not justify a parallel feature theme.
- Pure utilities and StyleSheet factories outside React receive a palette or
  relevant token explicitly. They must not call hooks or silently select a fixed
  scheme. Keep static layout styles separate from theme-dependent values when
  that makes their ownership clearer.
- Derive React Navigation's colors from the same resolved palette, preserving
  required navigation theme fields and fonts. Keep status bar and Android system
  bar presentation aligned with the resolved application theme.
- Temporary adapters for existing `Colors`, `useColorScheme` and `useThemeColor`
  consumers may support incremental migration. Do not remove intentional public
  overrides without checking callers. Remove adapters that have no consumers
  after migration; document any API that remains intentionally supported.

## Scope and constraints

- Inventory theme-dependent colors in shared components, feature screens, hooks,
  local styles and utilities, including fixed light-palette accesses.
- Migrate application UI colors to the canonical palette or an explicitly owned
  feature palette. Review exceptions by meaning rather than banning every literal.
- Prefer semantic tokens over local `isDark` color branches. Scheme checks remain
  appropriate for different assets, native appearance options and other actual
  behavioral differences between themes.
- Preserve layout, spacing, typography, interactions, authentication/session
  boundaries and API behavior. Keep existing colors initially where they express
  the intended role. The approved compact palette may consolidate close shades;
  review necessary contrast or inconsistency corrections as
  explicit visual changes instead of performing a new brand/color redesign.
- Settings must offer System, Light and Dark selections with localized text in
  every supported locale and accessible selected/disabled states.
- Define persistence behavior for pending, failed and rapid theme changes. UI and
  storage must not finish with different selections or let an older write replace
  a newer accepted choice. Present failures through the existing feedback pattern;
  do not leave rejected promises unhandled.
- Preserve hydration gating for application content. Assess startup transitions
  separately from the native splash screen, which may appear before JavaScript
  can read the stored app preference. Do not promise that palette tokens alone
  can synchronize the native launch screen with AsyncStorage.
- Verify keyboard, native time picker, modal and system bar appearance when app
  and OS themes differ. Use capabilities supported by the installed platform
  versions. A global native appearance override must not accidentally turn
  system-following mode into a manually pinned theme.
- Do not add NativeWind, Tamagui, another styling framework or a broad dependency
  upgrade. Do not reorganize unrelated providers or extract every numeric style
  value into a constant.

## Review stages

1. **Foundation and shared controls.** Audit and implement a small base palette,
   semantic light/dark tokens and `useTheme()` backed by PreferencesProvider.
   Align navigation and migrate themed text/views, buttons, fields, pickers,
   modal sheets and closely related shared controls. Preserve caller overrides
   and temporary compatibility adapters. Add focused tests. Stop for review.
2. **Preference behavior and feature screens.** Add System, Light and Dark settings,
   localized labels, persistence error handling and rapid-change consistency.
   Migrate remaining feature screens, banners, quiz states and local color utilities.
   Remove unjustified fixed palette access and repeated color branches. Stop for review.
3. **Completion.** Audit remaining literals, legacy APIs and duplication; remove
   unused adapters and document justified exceptions. Update frontend instructions
   and lasting conventions, run final checks and delete this temporary document
   only when the entire task is complete.

## Stage 1 implementation and review notes

- `constants/palette.ts` owns raw hex/RGB shades. It contains existing shared-control
  shades and one lighter dark-theme error shade; nearby colors are not merged.
- `constants/theme.ts` owns matching semantic light/dark roles and the temporary
  `Colors` adapter. `hooks/use-theme.ts` returns resolved `theme`, `colors`, `isDark`
  directly from PreferencesProvider, with no new provider or OS subscription.
- `constants/navigationTheme.ts` preserves stock navigation fonts/fields and replaces
  navigation colors with application roles. Root layout and tabs consume these roles.
- Shared controls use semantic roles; layout, opacity-based disabled/pressed states,
  public style/accessory overrides remain supported. Unused ScreenContainer
  light/dark color props were removed during review. ThemedText callers now
  override color through styles; ThemedView now uses the same style-only override
  API, with its existing image-fallback caller migrated without changing colors.
  Static black shadows use the base palette. Parallax header colors remain caller-owned.
- Review follow-up: theme-dependent StyleSheet rules now live in each touched
  control's `styles.ts` factory, memoized by colors.
  Components select state styles. Animation values, safe-area/caller dimensions,
  native color props and navigation options remain at their actual runtime owner.
  No visual or interaction changes are intended by this style-ownership adjustment.
- Temporary `useColorScheme` and `useThemeColor` adapters remain for features.
  Banners, feature colors and settings/persistence changes are explicitly stage 2.
- Visible changes: navigation uses application backgrounds/text/borders; tab dividers
  use the shared subtle border. Dark secondary buttons and links use light cyan,
  and dark input errors use light red for readability. Primary filled buttons keep
  their existing blue/white pair. No measured contrast or native rendering claim.
- Form input text style overrides now take final precedence, matching other shared
  controls. iOS time picker receives the resolved appearance; Android native picker
  appearance still requires device verification when app and OS themes differ.
- Suggested device review: login/register input focus/error and primary/secondary
  buttons; settings option/time pickers; selected/disabled options and badge colors;
  a modal sheet with footer/handle; tabs and navigation headers in both themes.
- Verification: `npm run ci:frontend` passes (TypeScript, ESLint, source formatting,
  documentation formatting, all 142 Jest suites / 734 tests, generated transport
  freshness). The task document also passes an explicit Prettier check.
- Audit: no raw hex/RGB values or legacy theme API calls remain in shared controls
  outside `components/banner`, which is explicitly deferred to stage 2. Literal
  `transparent`, caller-owned decorative headers and base black shadows are intentional.
- Review changes are collected on `feat/theme-foundation`, based on `origin/main`
  at `9c6a069`. Its base tree matches the previous feature branch after the OpenAPI
  squash merge. The user authorized committing the complete stage 1 change.
  Earlier partial staged snapshots failed because new hooks and caller migrations
  were not staged together; the final complete snapshot is checked before commit.
  The complete snapshot passed the pre-commit checks and became `6bd207e`.
  Stages 2 and 3 remain separate review steps; naming migration is not included.
- The APK was installed on the user's emulator after resolving low disk space,
  but native visual review has not been performed. Jest verifies state/props, not native rendering
  or measured contrast. Native pickers, keyboards, modal/system bars and visual
  readability remain device review items. Existing theme-write failures and races
  remain known stage 2 work; no persistence behavior was changed in stage 1.

## Stage 2 implementation and review notes

- Settings now offers localized System, Light and Dark radio selections. The
  selected value is the last successfully persisted preference; a localized pending
  message explains the write interval. The theme selector is disabled during saving.
- PreferencesProvider saves one theme selection at a time, without a write queue.
  A synchronous in-progress guard ignores taps before React renders the disabled
  selector and also protects a remounted settings screen. Successful writes update
  the UI; failures retain the last saved choice and release the control for retry.
  Theme preference remains application-owned, with the existing hydration gate.
- `useThemePreferenceSelection` owns screen feedback: it catches storage failures,
  drops feedback after unmount, and has no request-version tracking. Persistence
  continues independently of that screen. No API/auth/session behavior was changed.
- Feature screens, filters, quiz feedback, banners, wardrobe, streak/profile cards,
  verification fields, reader controls and dictionary badge utilities now consume
  the resolved theme. No feature or banner imports legacy theme hooks or Colors.
  Pure badge calculation receives semantic colors; asset selection still uses theme.
- Theme-dependent StyleSheet rules live with their controls, including shared
  toolbar/filter rules. Business states select named styles. Native color props,
  caller-provided decorative colors, animated dimensions and offsets remain runtime
  values. File/directory naming migration remains a separate task.
- Review refinement: the base palette now has 51 opaque colors named in hundred
  steps, including only actively used family shades. The shared light/dark
  catalogue has 48 semantic roles. Close legacy shades with the same purpose were
  consolidated; exact preservation of every old hex is no longer the goal.
- Local light/dark style tables and the article-filter theme adapter were removed.
  Styles read resolved semantic colors. Category icons, Google brand blue,
  achievement gradients and decorative quiz glows retain direct palette references.
  `withOpacity` composes semantic overlays and narrowly owned decorative glows;
  alpha colors are not separate palette entries.
- Naming review: `background` is the screen canvas; `surface` is the background
  of cards, fields and panels placed on it. They can share a value in light mode
  while differing in dark mode. The former `secondary*` group was used by badges,
  highlighted cards, quotes and some actions, not specifically secondary buttons.
  It is now `accentSolid`, `accentSurface`, `accentBorder` and `onAccentSurface`.
  The former standalone `accent` is now `interactive`, for active controls,
  native text selection/caret and navigation highlights. This rename preserves
  every color value and does not introduce a component-specific token catalogue.
- Visible changes: shared surfaces, neutral text and feedback shades are more
  consistent across features. Success, warning and selection text pairs were
  adjusted for readability; the yellow reward banner now has dark text. Filled
  calendar states use their corresponding foreground roles. Layout and interaction
  changes are not intended.
- A source audit compared 1,448 matching non-color layout properties against HEAD
  and found no differences. This does not cover every runtime composition or
  native rendering behavior. A separate sRGB calculation of selected semantic
  foreground/background pairs found ratios above 4.5:1; this checks the specified
  opaque pairs only, not every composited state, gradient or native control.
- Tests cover ignored concurrent selections, final persisted/UI agreement, failed
  saves, recovery after failure, hydration after remount, returning to System,
  unmounted settings feedback, disabled selector accessibility, accessible
  selection for all three modes, and selected/disabled/correct/wrong quiz states
  in both themes. Existing progress-badge tests retain concrete expected colors.
- Device review: check Settings mode changes/restart and rapid taps; quiz answer
  submission including incorrect answers; article filters/bookmarks/image fallback;
  profile streak/calendar/achievement banners; verification fields and wardrobe.
  Check both themes, including an OS appearance opposite to the app selection.
- iOS FormTextInput keyboard appearance follows the resolved app theme unless
  overridden. Raw verification/search TextInput callers still need review. Native
  Android picker appearance depends on platform capabilities. On the latest
  attempt ADB could not start its daemon, so native visual review was unavailable.
- Verification passed: `npm run ci:frontend` (149 suites / 769 tests), including
  TypeScript, lint, formatting, documentation and generated transport freshness.
  New tests cover opacity input boundaries, palette naming/opaque values and
  resolved quiz result styles. Jest does not verify native appearance or contrast.
- The user owns a partial staged snapshot. Preserve its exact contents; do not
  stage companion changes automatically. Its latest staged-check result is
  recorded separately below. Stage 2 remains uncommitted.
- Latest `npm run check:staged`: failed on frontend type errors in the partial
  snapshot (missing palette roles, style factory exports and accompanying caller
  changes). Lint-staged restored the original state; a binary index diff before
  and after matched exactly. The passing working-tree checks do not validate this
  incomplete commit snapshot.
- Additional review-only findings are in
  [the touched-file review](theme-touched-files-review.md). Localization,
  VerificationCodeModal API simplification and banner file organization are
  recommendations awaiting review; no broad cleanup was performed.
- Stage 3 still owns removal of the now-unused compatibility APIs, the final literal
  audit/exception documentation and lasting instruction/convention updates. Retain
  this temporary task document until the entire three-stage task is complete.

## Acceptance criteria

- `useTheme()` resolves the persisted explicit preference correctly and follows
  OS changes only while the preference is `system`; unsupported/missing system
  values retain a defined fallback.
- Components can read `colors.background`, `colors.surface`, `colors.text` and
  other agreed tokens without manually selecting light/dark colors. Both palettes
  expose the same checked keys. Theme changes update mounted consumers.
- Settings can enter and leave all three modes. Selection survives restart;
  failure and rapid-change handling preserve a coherent UI/storage outcome.
- Navigation and migrated UI use the same semantic palette. Headers, tabs, modals,
  fields, buttons, feedback, selections and disabled states remain readable in
  both themes, including when the OS uses the opposite theme.
- No unexplained fixed light/dark palette selection or duplicated shared color
  decisions remain after the final inventory audit. Intentional feature colors
  and external/user-authored content are treated according to their ownership.
- There is one documented theme API and clear rules for tokens, local layout
  values and palette exceptions. No unrelated refactoring is included.

## Verification

- Add behavior tests for preference hydration, explicit overrides, system changes,
  returning to system mode, mounted consumer updates and persistence failure/races.
  Mock storage/native boundaries while exercising the real provider and hooks.
- Add targeted shared-component/navigation regressions for theme-dependent states
  where they provide observable guarantees. Avoid snapshots of the entire palette
  or tests that merely repeat every token value.
- Perform visual checks on the supported target platforms. Record which devices,
  platforms and states were checked, and distinguish native rendering checks from
  Jest tests. If device access is unavailable, report the remaining visual checks.
- Run `npm run ci:frontend`, instruction/documentation formatting and formatting
  for all changed documentation. Run additional checks only where the changed
  files and repository instructions require them.
- If staged changes exist, run `npm run check:staged` against the actual snapshot,
  preserving the user's index. An empty index provides no commit snapshot to
  validate. Do not stage changes or create a commit automatically.
