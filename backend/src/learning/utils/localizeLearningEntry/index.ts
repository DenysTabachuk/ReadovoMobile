import { DEFAULT_LEARNING_CONTENT_LOCALE } from '../../constants';

type Translation = { locale: string; title: string; description: string };

/**
 * Resolves a published entry's text, falling back to the default locale.
 * @param translations The stored translations.
 * @param locale The requested locale.
 * @returns The selected title and description.
 * @throws If the selected translation is missing or contains blank text.
 * @example
 * localizeLearningEntry([{ locale: 'en', title: 'Weather', description: 'Forecasts' }], 'uk');
 * // => { title: 'Weather', description: 'Forecasts' }
 */
export function localizeLearningEntry(
  translations: Translation[],
  locale: string,
) {
  const copy =
    translations.find((candidate) => candidate.locale === locale) ??
    translations.find(
      (candidate) => candidate.locale === DEFAULT_LEARNING_CONTENT_LOCALE,
    );
  if (!copy || !copy.title.trim() || !copy.description.trim())
    throw new Error('Learning catalogue translation is missing.');
  return { title: copy.title, description: copy.description };
}
