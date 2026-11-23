import {
  AiRateLimitCoordinator,
  AiRequestTokenBudgetError,
} from './ai-rate-limit.coordinator';

describe('AiRateLimitCoordinator', () => {
  const originalLimit = process.env.GROQ_TPM_LIMIT;

  beforeEach(() => {
    jest.useFakeTimers();
    process.env.GROQ_TPM_LIMIT = '1000';
  });

  afterEach(() => {
    jest.useRealTimers();
    if (originalLimit === undefined) delete process.env.GROQ_TPM_LIMIT;
    else process.env.GROQ_TPM_LIMIT = originalLimit;
  });

  it('waits for the provider token reset before reserving more tokens', async () => {
    const coordinator = new AiRateLimitCoordinator();
    coordinator.updateFromHeaders(
      'test-model',
      new Headers({
        'x-ratelimit-limit-tokens': '1000',
        'x-ratelimit-remaining-tokens': '100',
        'x-ratelimit-reset-tokens': '250ms',
      }),
    );

    const reservation = coordinator.acquire({
      estimatedTokens: 200,
      model: 'test-model',
    });
    let resolved = false;
    void reservation.then(() => {
      resolved = true;
    });

    await jest.advanceTimersByTimeAsync(249);
    expect(resolved).toBe(false);

    await jest.advanceTimersByTimeAsync(2);
    await expect(reservation).resolves.toBeUndefined();
  });

  it('rejects a request that can never fit inside the configured TPM budget', async () => {
    const coordinator = new AiRateLimitCoordinator();

    await expect(
      coordinator.acquire({ estimatedTokens: 901, model: 'test-model' }),
    ).rejects.toBeInstanceOf(AiRequestTokenBudgetError);
  });

  it('exposes the safe per-request capacity for token-aware planning', () => {
    const coordinator = new AiRateLimitCoordinator();

    expect(coordinator.getMaximumRequestTokens()).toBe(900);
  });
});
