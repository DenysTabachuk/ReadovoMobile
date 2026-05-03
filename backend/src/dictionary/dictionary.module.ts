import { Module } from '@nestjs/common';

import { DictionaryController } from './dictionary.controller';
import { DictionaryRepository } from './dictionary.repository';
import { DictionaryService } from './dictionary.service';

@Module({
  controllers: [DictionaryController],
  providers: [DictionaryRepository, DictionaryService],
})
export class DictionaryModule {}
