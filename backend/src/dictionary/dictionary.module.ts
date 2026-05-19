import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DictionaryEmbeddingService } from './dictionary-embedding.service';
import { DictionaryController } from './dictionary.controller';
import { DictionaryRepository } from './dictionary.repository';
import { DictionaryService } from './dictionary.service';

@Module({
  imports: [AuthModule],
  controllers: [DictionaryController],
  providers: [
    DictionaryEmbeddingService,
    DictionaryRepository,
    DictionaryService,
  ],
})
export class DictionaryModule {}
