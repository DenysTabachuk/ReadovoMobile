import { ArticleQuizValidator } from '../quiz/article-quiz.validator';
import { ArticleTransformationValidator } from './article-transformation.validator';

describe('ArticleTransformationValidator', () => {
  const validator = new ArticleTransformationValidator(
    new ArticleQuizValidator(),
  );

  it('rejects empty list items instead of silently deleting them', () => {
    const result = validator.validate(
      {
        adaptedBlocks: [
          {
            items: [
              [
                {
                  bold: false,
                  italic: false,
                  text: 'Visible item',
                  type: 'text',
                },
              ],
              [],
            ],
            ordered: false,
            type: 'list',
          },
        ],
        questions: null,
      },
      { allowedImageSources: new Set(), questionPolicy: 'forbidden' },
    );

    expect(result.success).toBe(false);
    expect(result.issues).toContain(
      'Block 1: list items must contain visible text.',
    );
  });

  it('rejects empty table cells instead of silently deleting them', () => {
    const result = validator.validate(
      {
        adaptedBlocks: [
          {
            rows: [
              [
                { header: false, text: 'Value' },
                { header: false, text: '   ' },
              ],
            ],
            type: 'table',
          },
        ],
        questions: null,
      },
      { allowedImageSources: new Set(), questionPolicy: 'forbidden' },
    );

    expect(result.success).toBe(false);
    expect(result.issues).toContain(
      'Block 1: table cells must contain non-empty text.',
    );
  });
});
