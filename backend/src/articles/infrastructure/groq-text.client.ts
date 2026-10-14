import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';
import { z } from 'zod';

import { AiResponseContractError } from './ai.errors';
import { AiRateLimitCoordinator } from './ai-rate-limit.coordinator';
import { AiTelemetry } from './ai.telemetry';
import { AiTokenCounter } from './ai-token-counter';

const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const REQUEST_TIMEOUT_MS = 180_000;

type StructuredCompletionParams<TSchema extends z.ZodType> = {
  apiKey: string;
  maxCompletionTokens: number;
  operation: string;
  prompt: string;
  schema: TSchema;
  schemaName: string;
  systemMessage: string;
};

@Injectable()
export class GroqTextClient {
  private readonly clientsByApiKey = new Map<string, Groq>();

  constructor(
    private readonly telemetry: AiTelemetry,
    private readonly rateLimitCoordinator: AiRateLimitCoordinator,
    private readonly tokenCounter: AiTokenCounter,
  ) {}

  get model(): string {
    return process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
  }

  async completeStructured<TSchema extends z.ZodType>(
    params: StructuredCompletionParams<TSchema>,
  ): Promise<z.infer<TSchema>> {
    const metadata = {
      model: this.model,
      operation: params.operation,
      schemaName: params.schemaName,
    };
    const jsonSchema = z.toJSONSchema(params.schema);
    const inputTokens = this.tokenCounter.countStructuredInput({
      prompt: params.prompt,
      schema: jsonSchema,
      systemMessage: params.systemMessage,
    });

    await this.rateLimitCoordinator.acquire({
      estimatedTokens: inputTokens + params.maxCompletionTokens,
      model: this.model,
    });

    return this.telemetry.traceRequest(metadata, async () => {
      try {
        const { data: completion, response } = await this.getClient(
          params.apiKey,
        )
          .chat.completions.create({
            max_completion_tokens: params.maxCompletionTokens,
            messages: [
              { content: params.systemMessage, role: 'system' },
              { content: params.prompt, role: 'user' },
            ],
            model: this.model,
            reasoning_effort: 'low',
            response_format: {
              json_schema: {
                name: params.schemaName,
                schema: jsonSchema,
                strict: true,
              },
              type: 'json_schema',
            },
            temperature: 0.2,
          })
          .withResponse();
        const choice = completion.choices[0];
        const content = choice?.message?.content;

        this.rateLimitCoordinator.updateFromHeaders(
          this.model,
          response.headers,
        );
        this.telemetry.recordTokenUsage(metadata, {
          completionTokens: completion.usage?.completion_tokens,
          promptTokens: completion.usage?.prompt_tokens,
          totalTokens: completion.usage?.total_tokens,
        });

        if (choice?.finish_reason === 'length') {
          throw new AiResponseContractError(
            `Groq response for schema "${params.schemaName}" reached the completion token limit.`,
          );
        }

        if (!content) {
          throw new AiResponseContractError(
            `Groq returned an empty response for schema "${params.schemaName}".`,
          );
        }

        return this.parseStructuredOutput(
          content,
          params.schema,
          params.schemaName,
        );
      } catch (error) {
        const headers = this.getErrorHeaders(error);
        if (headers) {
          this.rateLimitCoordinator.updateFromHeaders(this.model, headers);
        }
        throw error;
      }
    });
  }

  private getClient(apiKey: string): Groq {
    const existingClient = this.clientsByApiKey.get(apiKey);
    if (existingClient) return existingClient;

    const client = new Groq({
      apiKey,
      maxRetries: 2,
      timeout: REQUEST_TIMEOUT_MS,
    });
    this.clientsByApiKey.set(apiKey, client);
    return client;
  }

  private parseStructuredOutput<TSchema extends z.ZodType>(
    content: string,
    schema: TSchema,
    schemaName: string,
  ): z.infer<TSchema> {
    let value: unknown;

    try {
      value = JSON.parse(content);
    } catch (error) {
      throw new AiResponseContractError(
        `Groq response did not contain valid JSON for schema "${schemaName}".`,
        { cause: error },
      );
    }

    const result = schema.safeParse(value);
    if (!result.success) {
      const paths = Array.from(
        new Set(
          result.error.issues.map((issue) => issue.path.join('.') || '<root>'),
        ),
      ).join(', ');
      throw new AiResponseContractError(
        `Groq response did not match schema "${schemaName}" at: ${paths}.`,
        { cause: result.error },
      );
    }

    return result.data;
  }

  private getErrorHeaders(error: unknown): Headers | null {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('headers' in error) ||
      !(error.headers instanceof Headers)
    ) {
      return null;
    }

    return error.headers;
  }
}
