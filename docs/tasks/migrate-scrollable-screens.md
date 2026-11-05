# Adopt ScrollableScreen on existing screens

Status: pending. Learning already uses the shared component.

## Purpose

Use `frontend/components/scrollableScreen` for ordinary scrolling screens to keep
safe-area handling and default screen padding in one place. The component has no
default width limit. Screens may override `contentContainerStyle` when needed.
Keep section spacing and screen-specific layout in each screen's styles.

## Scope

- Review Profile, Settings, Wardrobe and Notification Test as migration candidates.
- Preserve each screen's current header placement, safe-area edges, scroll
  behavior, keyboard handling and content spacing. Remove only padding overrides
  that become redundant after migration.
- Preserve screen-specific text and control width limits where still appropriate;
  do not introduce a shared maximum width.
- Keep virtualized lists and the article reader out of a mechanical migration.
  They have their own scrolling responsibilities and need a separate assessment.

## Verification

- Check scrolling, bottom spacing and navigation in the Android emulator.
- Verify light and dark themes, both interface languages and larger text sizes.
- Run `npm run ci:frontend` and, when changes are staged, `npm run check:staged`
  against the actual staged snapshot without staging unrelated changes.
- Delete this task document once the migration is completed or its scope has been
  reviewed and resolved.
