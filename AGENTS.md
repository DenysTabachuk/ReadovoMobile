# Project Rules

## Styling
- Do not define `StyleSheet.create(...)` inside component files.
- Keep component styles in a separate `styles.ts` file next to `index.tsx`.
- Import component styles with `import { styles } from './styles';`.
- For shared components, use this structure:
  - `components/componentName/index.tsx`
  - `components/componentName/styles.ts`
- Prefer reusing existing spacing, typography, and theme constants instead of hardcoding new values.

## Components
- Extract repeated UI patterns into shared components when the pattern appears more than once or is likely to be reused.
- Keep screen files focused on composition and behavior, not low-level styling details.

## Localization
- Keep translation values human-readable in their target language.
- Do not write normal text as Unicode escape sequences like `\u0421\u0442...` unless the escape is technically required.
