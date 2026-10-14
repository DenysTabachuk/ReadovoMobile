import { z } from 'zod';

import { AiRateLimitCoordinator } from './ai-rate-limit.coordinator';
import { AiTelemetry } from './ai.telemetry';
import { AiTokenCounter } from './ai-token-counter';
import { GroqTextClient } from './groq-text.client';

const createChatCompletionMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

type GroqStructuredRequest = {
  response_format: {
    json_schema: {
      name: string;
      strict: boolean;
    };
    type: string;
  };
};

jest.mock('groq-sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: (...args: unknown[]) => ({
          withResponse: async () => ({
            data: (await createChatCompletionMock(...args)) as unknown,
            response: new Response(null, {
              headers: {
                'x-ratelimit-limit-tokens': '8000',
                'x-ratelimit-remaining-tokens': '7000',
                'x-ratelimit-reset-tokens': '1s',
              },
            }),
          }),
        }),
      },
    },
  })),
}));

const TestOutputSchema = z.object({ answer: z.string() });

describe('GroqTextClient', () => {
  let rateLimitCoordinator: AiRateLimitCoordinator;
  let tokenCounter: AiTokenCounter;

  beforeEach(() => {
    createChatCompletionMock.mockReset();
    rateLimitCoordinator = new AiRateLimitCoordinator();
    tokenCounter = new AiTokenCounter();
  });

  afterEach(() => {
    tokenCounter.onModuleDestroy();
  });

  it('requests strict structured output and validates it at runtime', async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [{ message: { content: '{"answer":"ok"}' } }],
      usage: { completion_tokens: 4, prompt_tokens: 8, total_tokens: 12 },
    });
    const acquireSpy = jest.spyOn(rateLimitCoordinator, 'acquire');
    const client = new GroqTextClient(
      new AiTelemetry(),
      rateLimitCoordinator,
      tokenCounter,
    );

    await expect(
      client.completeStructured({
        apiKey: 'test-key',
        maxCompletionTokens: 100,
        operation: 'test',
        prompt: 'Return an answer.',
        schema: TestOutputSchema,
        schemaName: 'test_output_v1',
        systemMessage: 'Test system message.',
      }),
    ).resolves.toEqual({ answer: 'ok' });
    const requests = createChatCompletionMock.mock.calls as Array<
      [GroqStructuredRequest]
    >;
    const responseFormat = requests[0]?.[0].response_format;

    expect(responseFormat?.type).toBe('json_schema');
    expect(responseFormat?.json_schema.name).toBe('test_output_v1');
    expect(responseFormat?.json_schema.strict).toBe(true);
    expect(acquireSpy).toHaveBeenCalledWith({
      estimatedTokens: expect.any(Number) as number,
      model: 'openai/gpt-oss-120b',
    });
  });

  it('fails closed when a provider response violates the runtime schema', async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [{ message: { content: '{"answer":42}' } }],
    });
    const client = new GroqTextClient(
      new AiTelemetry(),
      rateLimitCoordinator,
      tokenCounter,
    );

    await expect(
      client.completeStructured({
        apiKey: 'test-key',
        maxCompletionTokens: 100,
        operation: 'test',
        prompt: 'Return an answer.',
        schema: TestOutputSchema,
        schemaName: 'test_output_v1',
        systemMessage: 'Test system message.',
      }),
    ).rejects.toThrow('did not match schema "test_output_v1"');
  });

  it('reports a token-limit truncation as a contract error', async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          finish_reason: 'length',
          message: { content: '{"answer":"unfinished' },
        },
      ],
    });
    const client = new GroqTextClient(
      new AiTelemetry(),
      rateLimitCoordinator,
      tokenCounter,
    );

    await expect(
      client.completeStructured({
        apiKey: 'test-key',
        maxCompletionTokens: 100,
        operation: 'test',
        prompt: 'Return an answer.',
        schema: TestOutputSchema,
        schemaName: 'test_output_v1',
        systemMessage: 'Test system message.',
      }),
    ).rejects.toThrow('reached the completion token limit');
  });
});
