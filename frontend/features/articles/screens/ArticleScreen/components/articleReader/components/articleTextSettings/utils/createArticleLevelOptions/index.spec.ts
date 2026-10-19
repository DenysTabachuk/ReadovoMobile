import type { TFunction } from 'i18next';
import { createArticleLevelOptions } from './index';

const t = ((key: string) => key) as TFunction;

describe('createArticleLevelOptions', () => {
  it('includes all supported levels without badges when no versions exist', () => {
    expect(createArticleLevelOptions([], t)).toEqual([
      { label: 'article.levels.A1', value: 'A1', statusIcons: undefined },
      { label: 'article.levels.A2', value: 'A2', statusIcons: undefined },
      { label: 'article.levels.B1', value: 'B1', statusIcons: undefined },
      { label: 'article.levels.B2', value: 'B2', statusIcons: undefined },
    ]);
  });

  it('matches both type and level and ignores duplicates', () => {
    const options = createArticleLevelOptions(
      [
        { level: 'A1', transformationType: 'summary' },
        { level: 'A2', transformationType: 'adaptation' },
        { level: 'A2', transformationType: 'adaptation' },
        { level: 'A2', transformationType: 'summary' },
        { level: 'B2', transformationType: 'adaptation' },
      ],
      t,
    );
    expect(
      options.map((option) => option.statusIcons?.map((icon) => icon.name)),
    ).toEqual([
      ['document-text-outline'],
      ['sparkles-outline', 'document-text-outline'],
      undefined,
      ['sparkles-outline'],
    ]);
    expect(
      options[1].statusIcons?.map((icon) => icon.accessibilityLabel),
    ).toEqual([
      'article.levelOptionReadyAdaptation',
      'article.levelOptionReadySummary',
    ]);
  });
});
