import { ArticleQuizValidator } from './article-quiz.validator';

describe('ArticleQuizValidator', () => {
  const validator = new ArticleQuizValidator();

  it('rejects duplicate question ids', () => {
    const result = validator.validate([
      createQuestion('duplicate'),
      createQuestion('duplicate'),
    ]);

    expect(result.success).toBe(false);
    expect(result.issues).toContain('Question ids must be unique.');
  });
});

function createQuestion(id: string) {
  return {
    correctOptionIds: ['yes'],
    explanation: null,
    id,
    options: [
      { id: 'yes', text: 'True' },
      { id: 'no', text: 'False' },
    ],
    prompt: 'The statement is true.',
    type: 'true_false' as const,
  };
}
