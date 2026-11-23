import { Injectable } from '@nestjs/common';
import {
  metrics,
  SpanStatusCode,
  trace,
  type Attributes,
} from '@opentelemetry/api';

import { AiResponseContractError } from './ai.errors';

type AiOperationMetadata = {
  model: string;
  operation: string;
  schemaName: string;
};

type AiTokenUsage = {
  completionTokens?: number;
  promptTokens?: number;
  totalTokens?: number;
};

@Injectable()
export class AiTelemetry {
  private readonly tracer = trace.getTracer('readovo.ai');
  private readonly meter = metrics.getMeter('readovo.ai');
  private readonly requestCounter =
    this.meter.createCounter('ai.request.total');
  private readonly requestDuration = this.meter.createHistogram(
    'ai.request.duration',
    { unit: 'ms' },
  );
  private readonly tokenCounter = this.meter.createCounter('ai.token.total');
  private readonly semanticRetryCounter = this.meter.createCounter(
    'ai.semantic_retry.total',
  );
  private readonly semanticFailureCounter = this.meter.createCounter(
    'ai.semantic_validation_failure.total',
  );

  /**
   * Traces one AI request without copying provider diagnostics into telemetry.
   * @param metadata - Internal operation, model and schema identifiers, not prompts.
   * @param request - Async operation to execute once inside the span.
   * @returns The original result, or rethrows the original rejection after recording
   * a fixed failure category. The span always ends; raw messages/stacks are omitted.
   * @example
   * await telemetry.traceRequest(
   *   { model: 'test-model', operation: 'reading_quiz', schemaName: 'quiz' },
   *   async () => 'quiz output',
   * ); // 'quiz output'
   */
  traceRequest<T>(
    metadata: AiOperationMetadata,
    request: () => Promise<T>,
  ): Promise<T> {
    const attributes = this.createAttributes(metadata);

    return this.tracer.startActiveSpan(
      `ai.${metadata.operation}`,
      { attributes },
      async (span) => {
        const startedAt = performance.now();

        try {
          const result = await request();
          this.requestCounter.add(1, { ...attributes, outcome: 'success' });
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          const outcome =
            error instanceof AiResponseContractError
              ? 'contract_error'
              : 'provider_error';
          this.requestCounter.add(1, { ...attributes, outcome });
          span.setAttribute('ai.outcome', outcome);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: outcome,
          });

          span.recordException({
            name: outcome,
            message: 'AI request failed.',
          });
          throw error;
        } finally {
          this.requestDuration.record(
            performance.now() - startedAt,
            attributes,
          );
          span.end();
        }
      },
    );
  }

  recordTokenUsage(metadata: AiOperationMetadata, usage: AiTokenUsage): void {
    const attributes = this.createAttributes(metadata);

    this.addTokens(usage.promptTokens, { ...attributes, tokenType: 'prompt' });
    this.addTokens(usage.completionTokens, {
      ...attributes,
      tokenType: 'completion',
    });
    this.addTokens(usage.totalTokens, { ...attributes, tokenType: 'total' });
  }

  recordSemanticRetry(metadata: AiOperationMetadata): void {
    this.semanticRetryCounter.add(1, this.createAttributes(metadata));
  }

  recordSemanticFailure(metadata: AiOperationMetadata): void {
    this.semanticFailureCounter.add(1, this.createAttributes(metadata));
  }

  private createAttributes(metadata: AiOperationMetadata): Attributes {
    return {
      'ai.model': metadata.model,
      'ai.operation': metadata.operation,
      'ai.provider': 'groq',
      'ai.schema': metadata.schemaName,
    };
  }

  private addTokens(value: number | undefined, attributes: Attributes): void {
    if (value !== undefined) this.tokenCounter.add(value, attributes);
  }
}
