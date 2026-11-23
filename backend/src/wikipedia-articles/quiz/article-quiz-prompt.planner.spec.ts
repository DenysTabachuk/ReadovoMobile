import { z } from 'zod';

import {
  ReadingQuizOutputSchema,
  VocabularyQuizOutputSchema,
} from '../contracts/ai-output.schemas';
import { AiRateLimitCoordinator } from '../infrastructure/ai-rate-limit.coordinator';
import { AiTokenCounter } from '../infrastructure/ai-token-counter';
import { ArticleContentProcessor } from '../transformation/article-content.processor';
import { ArticlePromptFactory } from '../transformation/article-prompt.factory';
import { ArticleQuizPromptPlanner } from './article-quiz-prompt.planner';

describe('ArticleQuizPromptPlanner', () => {
  const originalLimit = process.env.GROQ_TPM_LIMIT;
  let tokenCounter: AiTokenCounter;

  beforeEach(() => {
    process.env.GROQ_TPM_LIMIT = '8000';
    tokenCounter = new AiTokenCounter();
  });

  afterEach(() => {
    tokenCounter.onModuleDestroy();
    if (originalLimit === undefined) delete process.env.GROQ_TPM_LIMIT;
    else process.env.GROQ_TPM_LIMIT = originalLimit;
  });

  it('uses representative complete sections when the full article exceeds the request budget', () => {
    const contentProcessor = new ArticleContentProcessor();
    const promptFactory = new ArticlePromptFactory(contentProcessor);
    const rateLimits = new AiRateLimitCoordinator();
    const planner = new ArticleQuizPromptPlanner(
      contentProcessor,
      rateLimits,
      tokenCounter,
    );
    const paragraphs = Array.from({ length: 80 }, (_, index) =>
      `Section ${index + 1}. ${'Computers process information and follow instructions. '.repeat(18)}`.trim(),
    );
    const text = paragraphs.join('\n\n');
    const maxCompletionTokens = 1_400;
    const systemMessage = 'Create an educational reading quiz.';
    const result = planner.createTokenSafePrompt({
      createPrompt: ({ sourceCoverage, text: sourceText }) =>
        promptFactory.createQuizPrompt({
          level: 'A2',
          sourceCoverage,
          targetLength: 'short',
          text: sourceText,
          title: 'Computer',
        }),
      maxCompletionTokens,
      schema: ReadingQuizOutputSchema,
      systemMessage,
      text,
    });
    const inputTokens = tokenCounter.countStructuredInput({
      prompt: result.prompt,
      schema: z.toJSONSchema(ReadingQuizOutputSchema),
      systemMessage,
    });

    expect(result.sourceCoverage).toBe('representative_excerpts');
    expect(result.sourceText.length).toBeLessThan(text.length);
    expect(result.sourceText).toContain('Section 1.');
    expect(result.sourceText).toContain('Section 80.');
    expect(inputTokens + maxCompletionTokens).toBeLessThanOrEqual(
      rateLimits.getMaximumRequestTokens(),
    );
  });

  it('also budgets large vocabulary quiz prompts including their larger completion allowance', () => {
    const contentProcessor = new ArticleContentProcessor();
    const promptFactory = new ArticlePromptFactory(contentProcessor);
    const rateLimits = new AiRateLimitCoordinator();
    const planner = new ArticleQuizPromptPlanner(
      contentProcessor,
      rateLimits,
      tokenCounter,
    );
    const text =
      `${'A computer executes algorithms and processes information. '.repeat(2_000)}`.trim();
    const maxCompletionTokens = 5_000;
    const systemMessage = 'Create an educational vocabulary quiz.';
    const result = planner.createTokenSafePrompt({
      createPrompt: ({ sourceCoverage, text: sourceText }) =>
        promptFactory.createVocabularyQuizPrompt({
          level: 'A2',
          sourceCoverage,
          targetQuestionCount: 16,
          text: sourceText,
          title: 'Computer',
        }),
      maxCompletionTokens,
      schema: VocabularyQuizOutputSchema,
      systemMessage,
      text,
    });
    const inputTokens = tokenCounter.countStructuredInput({
      prompt: result.prompt,
      schema: z.toJSONSchema(VocabularyQuizOutputSchema),
      systemMessage,
    });

    expect(result.sourceCoverage).toBe('representative_excerpts');
    expect(inputTokens + maxCompletionTokens).toBeLessThanOrEqual(
      rateLimits.getMaximumRequestTokens(),
    );
  });
});
