import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { get_encoding, type Tiktoken } from 'tiktoken';

const STRUCTURED_REQUEST_OVERHEAD_TOKENS = 32;

@Injectable()
export class AiTokenCounter implements OnModuleDestroy {
  private readonly encoding: Tiktoken = get_encoding('o200k_base');

  countText(value: string): number {
    return this.encoding.encode(value).length;
  }

  countStructuredInput(params: {
    prompt: string;
    schema: unknown;
    systemMessage: string;
  }): number {
    return (
      this.countText(params.systemMessage) +
      this.countText(params.prompt) +
      this.countText(JSON.stringify(params.schema)) +
      STRUCTURED_REQUEST_OVERHEAD_TOKENS
    );
  }

  onModuleDestroy(): void {
    this.encoding.free();
  }
}
