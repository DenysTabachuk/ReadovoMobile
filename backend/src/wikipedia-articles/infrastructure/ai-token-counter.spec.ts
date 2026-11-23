import { z } from 'zod';

import { AiTokenCounter } from './ai-token-counter';

describe('AiTokenCounter', () => {
  it('counts prompt, system message, schema, and message framing', () => {
    const counter = new AiTokenCounter();
    const schema = z.toJSONSchema(z.object({ answer: z.string() }));

    const requestTokens = counter.countStructuredInput({
      prompt: 'Return a concise answer.',
      schema,
      systemMessage: 'You answer questions.',
    });

    expect(requestTokens).toBeGreaterThan(
      counter.countText('Return a concise answer.'),
    );
    counter.onModuleDestroy();
  });
});
