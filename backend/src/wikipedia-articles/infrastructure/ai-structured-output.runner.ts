import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { type SemanticValidationResult } from '../contracts/semantic-validation';
import { AiSemanticValidationError } from './ai.errors';
import { AiTelemetry } from './ai.telemetry';
import { GroqTextClient } from './groq-text.client';

const MAX_SEMANTIC_ATTEMPTS = 2;
const MAX_REPORTED_ISSUES = 8;
const MAX_ISSUE_LENGTH = 240;

type StructuredGenerationParams<TSchema extends z.ZodType, TResult> = {
  apiKey: string;
  maxCompletionTokens: number;
  operation: string;
  prompt: string;
  schema: TSchema;
  schemaName: string;
  systemMessage: string;
  validate: (output: z.infer<TSchema>) => SemanticValidationResult<TResult>;
};

@Injectable()
export class AiStructuredOutputRunner {
  constructor(
    private readonly client: GroqTextClient,
    private readonly telemetry: AiTelemetry,
  ) {}

  get model(): string {
    return this.client.model;
  }

  async generate<TSchema extends z.ZodType, TResult>(
    params: StructuredGenerationParams<TSchema, TResult>,
  ): Promise<TResult> {
    let prompt = params.prompt;
    let lastIssues: string[] = [];

    for (let attempt = 1; attempt <= MAX_SEMANTIC_ATTEMPTS; attempt += 1) {
      const output = await this.client.completeStructured({
        apiKey: params.apiKey,
        maxCompletionTokens: params.maxCompletionTokens,
        operation: params.operation,
        prompt,
        schema: params.schema,
        schemaName: params.schemaName,
        systemMessage: params.systemMessage,
      });
      const validation = params.validate(output);

      if (validation.success) return validation.data;

      lastIssues = validation.issues;
      if (attempt < MAX_SEMANTIC_ATTEMPTS) {
        this.telemetry.recordSemanticRetry({
          model: this.model,
          operation: params.operation,
          schemaName: params.schemaName,
        });
        prompt = this.createRetryPrompt(params.prompt, lastIssues);
      }
    }

    this.telemetry.recordSemanticFailure({
      model: this.model,
      operation: params.operation,
      schemaName: params.schemaName,
    });

    throw new AiSemanticValidationError(params.operation, lastIssues);
  }

  private createRetryPrompt(originalPrompt: string, issues: string[]): string {
    const feedback = issues
      .slice(0, MAX_REPORTED_ISSUES)
      .map(
        (issue) =>
          `- ${issue.replace(/[\r\n]+/g, ' ').slice(0, MAX_ISSUE_LENGTH)}`,
      )
      .join('\n');

    return `${originalPrompt}\n\nThe previous structured response failed semantic validation. Correct every issue below without changing the requested JSON contract:\n${feedback}`;
  }
}
