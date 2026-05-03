import { Module } from '@nestjs/common';

import { DictionaryEmbeddingService } from './dictionary-embedding.service';
import { DictionaryController } from './dictionary.controller';
import { DictionaryRepository } from './dictionary.repository';
import { DictionaryService } from './dictionary.service';

@Module({
  controllers: [DictionaryController],
  providers: [
    DictionaryEmbeddingService,
    DictionaryRepository,
    DictionaryService,
  ],
})
export class DictionaryModule {}
