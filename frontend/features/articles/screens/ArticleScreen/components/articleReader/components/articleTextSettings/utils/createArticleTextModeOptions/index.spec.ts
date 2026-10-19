import type { TFunction } from 'i18next';
import { createArticleTextModeOptions } from './index';

const t = ((key: string) => key) as TFunction;

describe('createArticleTextModeOptions', () => {
  it.each([
    [false, false, ['original']],
    [true, false, ['original', 'adaptation']],
    [false, true, ['original', 'summary']],
    [true, true, ['original', 'adaptation', 'summary']],
  ] as const)(
    'selects modes for adaptation=%s, summary=%s',
    (adaptation, summary, expected) => {
      expect(
        createArticleTextModeOptions({ adaptation, summary }, t).map(
          (option) => option.value,
        ),
      ).toEqual(expected);
    },
  );

  it('translates each label with the corresponding key', () => {
    expect(
      createArticleTextModeOptions({ adaptation: true, summary: true }, t).map(
        (option) => option.label,
      ),
    ).toEqual([
      'article.textModeShort.original',
      'article.textModeShort.adapted',
      'article.textModeShort.summary',
    ]);
  });
});
