import { Injectable } from '@nestjs/common';

const DEFAULT_TPM_LIMIT = 8_000;
const DEFAULT_RESET_MS = 60_000;
const MAX_BUDGET_UTILIZATION = 0.9;

type RateLimitState = {
  limit: number;
  remaining: number;
  resetAt: number;
};

@Injectable()
export class AiRateLimitCoordinator {
  private readonly states = new Map<string, RateLimitState>();
  private reservationQueue = Promise.resolve();

  acquire(params: { estimatedTokens: number; model: string }): Promise<void> {
    const reservation = this.reservationQueue.then(() =>
      this.reserve(params.model, Math.ceil(params.estimatedTokens)),
    );
    this.reservationQueue = reservation.catch(() => undefined);
    return reservation;
  }

  getMaximumRequestTokens(): number {
    return this.getSafeCapacity(this.getConfiguredLimit());
  }

  updateFromHeaders(model: string, headers: Headers): void {
    const previous = this.getState(model);
    const limit = this.parsePositiveInteger(
      headers.get('x-ratelimit-limit-tokens'),
      previous.limit,
    );
    const capacity = this.getSafeCapacity(limit);
    const remaining = Math.min(
      this.parsePositiveInteger(
        headers.get('x-ratelimit-remaining-tokens'),
        previous.remaining,
        true,
      ),
      capacity,
    );
    const resetMs = this.parseDuration(headers.get('x-ratelimit-reset-tokens'));

    this.states.set(model, {
      limit,
      remaining,
      resetAt: Date.now() + (resetMs ?? DEFAULT_RESET_MS),
    });
  }

  private async reserve(model: string, requestedTokens: number): Promise<void> {
    let state = this.getState(model);
    const capacity = this.getSafeCapacity(state.limit);

    if (requestedTokens > capacity) {
      throw new AiRequestTokenBudgetError(requestedTokens, capacity);
    }

    if (Date.now() >= state.resetAt) {
      state = this.resetState(state);
    }

    if (requestedTokens > state.remaining) {
      await this.sleep(Math.max(0, state.resetAt - Date.now()));
      state = this.resetState(state);
    }

    state.remaining -= requestedTokens;
    this.states.set(model, state);
  }

  private getState(model: string): RateLimitState {
    const existing = this.states.get(model);
    if (existing) return existing;

    const limit = this.getConfiguredLimit();
    const state = {
      limit,
      remaining: this.getSafeCapacity(limit),
      resetAt: Date.now() + DEFAULT_RESET_MS,
    };
    this.states.set(model, state);
    return state;
  }

  private resetState(state: RateLimitState): RateLimitState {
    return {
      ...state,
      remaining: this.getSafeCapacity(state.limit),
      resetAt: Date.now() + DEFAULT_RESET_MS,
    };
  }

  private getConfiguredLimit(): number {
    return this.parsePositiveInteger(
      process.env.GROQ_TPM_LIMIT,
      DEFAULT_TPM_LIMIT,
    );
  }

  private getSafeCapacity(limit: number): number {
    return Math.floor(limit * MAX_BUDGET_UTILIZATION);
  }

  private parsePositiveInteger(
    value: string | null | undefined,
    fallback: number,
    allowZero = false,
  ): number {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && (allowZero ? parsed >= 0 : parsed > 0)
      ? parsed
      : fallback;
  }

  private parseDuration(value: string | null): number | null {
    if (!value) return null;

    const unitMilliseconds: Record<string, number> = {
      h: 3_600_000,
      m: 60_000,
      ms: 1,
      s: 1_000,
    };
    let total = 0;
    let matchedLength = 0;

    for (const match of value.matchAll(/(\d+(?:\.\d+)?)(ms|h|m|s)/g)) {
      const amount = Number.parseFloat(match[1] ?? '');
      const multiplier = unitMilliseconds[match[2] ?? ''];
      if (!Number.isFinite(amount) || multiplier === undefined) return null;

      total += amount * multiplier;
      matchedLength += match[0].length;
    }

    return matchedLength === value.length && total >= 0 ? total : null;
  }

  private sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}

export class AiRequestTokenBudgetError extends Error {
  constructor(
    readonly requestedTokens: number,
    readonly maximumTokens: number,
  ) {
    super(
      `AI request requires an estimated ${requestedTokens} tokens, exceeding the safe per-request budget of ${maximumTokens}.`,
    );
    this.name = AiRequestTokenBudgetError.name;
  }
}
