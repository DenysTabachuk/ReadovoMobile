import { SpanStatusCode, type SpanStatus } from '@opentelemetry/api';

import { AiResponseContractError } from './ai.errors';
import { AiTelemetry } from './ai.telemetry';

/**
 * Creates fresh spies for the span operations exercised by AI telemetry.
 * @returns Span spies; no tracing provider or exporter is started.
 * @example
 * const span = createSpanMock();
 * span.end(); // span.end has one recorded call.
 */
function createSpanMock() {
  return {
    setStatus: jest.fn<void, [SpanStatus]>(),
    setAttribute: jest.fn(),
    recordException: jest.fn(),
    end: jest.fn(),
  };
}

let mockSpan: ReturnType<typeof createSpanMock>;

jest.mock('@opentelemetry/api', () => ({
  ...jest.requireActual<typeof import('@opentelemetry/api')>(
    '@opentelemetry/api',
  ),
  trace: {
    getTracer: () => ({
      startActiveSpan: (
        _name: string,
        _options: unknown,
        request: (span: ReturnType<typeof createSpanMock>) => Promise<unknown>,
      ) => request(mockSpan),
    }),
  },
}));

const metadata = {
  model: 'test-model',
  operation: 'reading_quiz',
  schemaName: 'quiz',
};

describe('AI telemetry redaction', () => {
  let telemetry: AiTelemetry;

  beforeEach(() => {
    mockSpan = createSpanMock();
    telemetry = new AiTelemetry();
  });

  it.each([
    {
      error: new Error('PRIVATE_PROVIDER_DIAGNOSTICS'),
      outcome: 'provider_error',
    },
    {
      error: new AiResponseContractError('PRIVATE_PROVIDER_DIAGNOSTICS'),
      outcome: 'contract_error',
    },
    {
      error: {
        message: 'PRIVATE_PROVIDER_DIAGNOSTICS',
        toString: () => {
          throw new Error('Must not stringify provider errors.');
        },
      },
      outcome: 'provider_error',
    },
  ])(
    'records a safe $outcome category and preserves the original rejection %#',
    async ({ error, outcome }) => {
      await expect(
        // SDK rejections may contain arbitrary data; this case verifies that boundary.
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        telemetry.traceRequest(metadata, () => Promise.reject(error)),
      ).rejects.toBe(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: outcome,
      });
      expect(mockSpan.recordException).toHaveBeenCalledWith({
        name: outcome,
        message: 'AI request failed.',
      });
      expect(JSON.stringify(mockSpan.setStatus.mock.calls)).not.toContain(
        'PRIVATE_PROVIDER_DIAGNOSTICS',
      );
      expect(JSON.stringify(mockSpan.recordException.mock.calls)).not.toContain(
        'PRIVATE_PROVIDER_DIAGNOSTICS',
      );
      expect(mockSpan.end).toHaveBeenCalledTimes(1);
    },
  );

  it('preserves the successful result and closes the span without an exception event', async () => {
    const output = { questions: [] };
    await expect(
      telemetry.traceRequest(metadata, () => Promise.resolve(output)),
    ).resolves.toBe(output);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.OK,
    });
    expect(mockSpan.recordException).not.toHaveBeenCalled();
    expect(mockSpan.end).toHaveBeenCalledTimes(1);
  });
});
