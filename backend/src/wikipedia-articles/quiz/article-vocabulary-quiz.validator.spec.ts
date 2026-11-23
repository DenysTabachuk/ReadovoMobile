import { ArticleQuizValidator } from './article-quiz.validator';
import { ArticleVocabularyQuizValidator } from './article-vocabulary-quiz.validator';

describe('ArticleVocabularyQuizValidator', () => {
  const validator = new ArticleVocabularyQuizValidator(
    new ArticleQuizValidator(),
  );

  it('rejects inconsistent term metadata and invented source excerpts', () => {
    const result = validator.validate(
      {
        questions: [
          {
            correctOptionIds: ['correct'],
            explanation: null,
            format: 'translation',
            id: 'vq-1',
            options: [
              { id: 'correct', text: 'лісовий полог' },
              { id: 'one', text: 'лісова стежка' },
              { id: 'two', text: 'нічний вітер' },
              { id: 'three', text: 'гірський схил' },
            ],
            prompt: 'Choose the translation of forest canopy.',
            sourceExcerpt: 'This excerpt was never in the article.',
            term: 'forest canopy',
            termKind: 'word',
            translation: 'лісовий полог',
            type: 'single_choice',
          },
        ],
        resolvedLevel: 'A2',
      },
      {
        sourceText: 'The forest canopy protects many insects.',
        targetQuestionCount: 6,
      },
    );

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('termKind'),
        expect.stringContaining('sourceExcerpt'),
      ]),
    );
  });
});
