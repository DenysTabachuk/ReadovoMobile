import { z } from 'zod';

import { ArticleTransformationOutputSchema } from '../contracts/ai-output.schemas';
import { AiRateLimitCoordinator } from '../infrastructure/ai-rate-limit.coordinator';
import { AiTokenCounter } from '../infrastructure/ai-token-counter';
import { ArticleContentProcessor } from './article-content.processor';
import { ArticlePromptFactory } from './article-prompt.factory';
import { ArticleTransformationPlanner } from './article-transformation.planner';

describe('ArticleTransformationPlanner', () => {
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

  it('keeps every generated chunk within the complete request token budget', () => {
    const processor = new ArticleContentProcessor();
    const promptFactory = new ArticlePromptFactory(processor);
    const rateLimits = new AiRateLimitCoordinator();
    const planner = new ArticleTransformationPlanner(
      processor,
      promptFactory,
      rateLimits,
      tokenCounter,
    );
    const text =
      `${'Fashion changes over time and reflects society. '.repeat(1800)}`.trim();
    const maxCompletionTokens = 2_500;
    const systemMessage = 'Create a safe educational summary.';
    const chunks = planner.createTokenSafeChunks({
      level: 'A2',
      maxCompletionTokens,
      schema: ArticleTransformationOutputSchema,
      sourceWordCount: processor.countWords(text),
      systemMessage,
      text,
      title: 'Fashion',
      transformationType: 'summary',
    });
    const jsonSchema = z.toJSONSchema(ArticleTransformationOutputSchema);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      const prompt = promptFactory.createChunkSimplificationPrompt({
        chunk,
        level: 'A2',
        sourceWordCount: processor.countWords(text),
        title: 'Fashion',
        transformationType: 'summary',
      });
      const inputTokens = tokenCounter.countStructuredInput({
        prompt,
        schema: jsonSchema,
        systemMessage,
      });

      expect(inputTokens + maxCompletionTokens).toBeLessThanOrEqual(
        rateLimits.getMaximumRequestTokens(),
      );
    }
  });
});
