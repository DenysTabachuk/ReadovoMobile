import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';

const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const REQUEST_TIMEOUT_MS = 180_000;

type CompletionParams = {
  apiKey: string;
  maxCompletionTokens: number;
  prompt: string;
  systemMessage: string;
};

@Injectable()
export class GroqTextClient {
  private clientsByApiKey = new Map<string, Groq>();

  get model(): string {
    return process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
  }

  async complete(params: CompletionParams): Promise<string> {
    const completion = await this.withTimeout(
      this.getClient(params.apiKey).chat.completions.create({
        max_completion_tokens: params.maxCompletionTokens,
        messages: [
          { content: params.systemMessage, role: 'system' },
          { content: params.prompt, role: 'user' },
        ],
        model: this.model,
        temperature: 0.3,
      }),
      REQUEST_TIMEOUT_MS,
      `Groq request timed out after ${REQUEST_TIMEOUT_MS}ms.`,
    );

    return completion.choices[0]?.message?.content?.trim() ?? '';
  }

  private getClient(apiKey: string): Groq {
    const existingClient = this.clientsByApiKey.get(apiKey);
    if (existingClient) return existingClient;

    const client = new Groq({ apiKey });
    this.clientsByApiKey.set(apiKey, client);
    return client;
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    message: string,
  ): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
}
