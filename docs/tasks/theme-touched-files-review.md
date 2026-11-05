# Theme migration: touched-file review

This is a read-only review requested during stage 2. The findings below have not
been implemented as part of the palette refinement.

## User-visible issues

- `features/streak/components/streakAchievementCard/index.tsx` renders Ukrainian
  milestone, status and reward copy directly. It is used by ProfileStreak, so an
  English profile can display mixed languages. Use translation keys with count
  interpolation/pluralization in both supported locales.
- `features/streak/components/streakCard/index.tsx` also has hardcoded Ukrainian
  copy, but repository searches found no callers. Decide whether to retain this
  dormant component before translating it and its weekday labels.
- Raw TextInput instances in VerificationCodeModal and the articles toolbar do
  not set `keyboardAppearance`, unlike FormTextInput. Verify iOS behavior with an
  app theme opposite to the OS theme before choosing the correction.
- LanguageOption discards the promise returned by language selection. The
  preferences provider changes i18n before persisting the language. A storage
  failure can therefore leave language state/storage inconsistent and produce an
  unhandled rejection. This predates the theme changes and needs a separate fix.

## Component structure

- VerificationCodeModal accepts 22 props. Its Register/ForgotPassword callers
  repeat shared translated labels, and `isBusy` duplicates the combination of
  `isResending` and `isVerifying`. Derive busy state inside the component and own
  shared translations there; retain flow-specific copy/configuration and actions
  in callers. Do not merely move all props into an equally large labels object.
  The expiration sentence should use translation interpolation.
- `components/banner/index.ts` is an intentional public barrel for the provider,
  hook and types. The visual Banner is private to the provider. A suitable future
  location is `components/banner/components/banner/index.tsx`, with its owned
  styles moved alongside it. Replacing the public barrel with the visual component
  would obscure the existing module boundary.
- Several migrated components retain duplicated `useTheme()` calls, one for
  `theme` and one for `colors` (for example StreakAchievementCard). Destructure
  both from one call when doing the next focused cleanup. Theme-dependent asset
  choices such as filled/outline icons can still use `isDark`.

## Review boundary

The palette refinement removes local theme tables and merges their color rules
into the corresponding styles. It does not authorize a general localization,
component API or naming migration. Review the findings above before implementing
that additional work.
