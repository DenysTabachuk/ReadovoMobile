import { z } from 'zod';

import { AiStructuredOutputRunner } from './ai-structured-output.runner';
import { AiSemanticValidationError } from './ai.errors';
import { AiTelemetry } from './ai.telemetry';
import { GroqTextClient } from './groq-text.client';

const OutputSchema = z.object({ value: z.string() });

describe('AiStructuredOutputRunner', () => {
  it('retries one semantic failure with concise validation feedback', async () => {
    const completeStructured = jest
      .fn<Promise<{ value: string }>, [{ prompt: string }]>()
      .mockResolvedValueOnce({ value: '' })
      .mockResolvedValueOnce({ value: 'valid' });
    const client = {
      completeStructured,
    } as unknown as GroqTextClient;
    const recordSemanticRetry = jest.fn();
    const telemetry = {
      recordSemanticFailure: jest.fn(),
      recordSemanticRetry,
    } as unknown as AiTelemetry;
    const runner = new AiStructuredOutputRunner(client, telemetry);

    await expect(
      runner.generate({
        apiKey: 'test-key',
        maxCompletionTokens: 100,
        operation: 'test',
        prompt: 'Generate a value.',
        schema: OutputSchema,
        schemaName: 'test_output_v1',
        systemMessage: 'Test system message.',
        validate: (output) =>
          output.value
            ? { data: output.value, issues: [], success: true }
            : { issues: ['value must not be empty'], success: false },
      }),
    ).resolves.toBe('valid');

    expect(completeStructured).toHaveBeenCalledTimes(2);
    expect(completeStructured.mock.calls[1]?.[0].prompt).toContain(
      'value must not be empty',
    );
    expect(recordSemanticRetry).toHaveBeenCalledTimes(1);
  });

  it('fails after the single controlled semantic retry', async () => {
    const completeStructured = jest
      .fn<Promise<{ value: string }>, [{ prompt: string }]>()
      .mockResolvedValue({ value: '' });
    const client = {
      completeStructured,
    } as unknown as GroqTextClient;
    const recordSemanticFailure = jest.fn();
    const telemetry = {
      recordSemanticFailure,
      recordSemanticRetry: jest.fn(),
    } as unknown as AiTelemetry;
    const runner = new AiStructuredOutputRunner(client, telemetry);

    await expect(
      runner.generate({
        apiKey: 'test-key',
        maxCompletionTokens: 100,
        operation: 'test',
        prompt: 'Generate a value.',
        schema: OutputSchema,
        schemaName: 'test_output_v1',
        systemMessage: 'Test system message.',
        validate: () => ({
          issues: ['value must not be empty'],
          success: false,
        }),
      }),
    ).rejects.toBeInstanceOf(AiSemanticValidationError);
    expect(completeStructured).toHaveBeenCalledTimes(2);
    expect(recordSemanticFailure).toHaveBeenCalledTimes(1);
  });
});
