# Frontend review follow-ups

These remaining findings came from the read-only review during theme migration.
They are separate work; the theme implementation does not depend on this cleanup.

## User-visible issues

- `features/streak/components/streakAchievementCard/index.tsx` renders Ukrainian
  milestone, status and reward copy directly. It is used by ProfileStreak, so an
  English profile can display mixed languages. Use translation keys with count
  interpolation/pluralization in both supported locales.
- `features/streak/components/streakCard/index.tsx` also has hardcoded Ukrainian
  copy, but repository searches found no callers. Decide whether to retain this
  dormant component before translating it and its weekday labels.
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

## Review boundary

Stage 3 addressed raw verification/search keyboard appearance and duplicated theme
hook calls. Native keyboard rendering still needs device review. The findings
above remain open and do not authorize a general localization, component API or
naming migration. Keep this follow-up document until that separate work is done.
