import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { DictionaryRepository } from './dictionary.repository';
import {
  type CreateDictionaryWordRequest,
  type DictionaryWord,
} from './types';

@Injectable()
export class DictionaryService {
  constructor(private readonly dictionaryRepository: DictionaryRepository) {}

  async createWord(request: CreateDictionaryWordRequest): Promise<DictionaryWord> {
    const word = request.word?.trim();
    const translation = request.translation?.trim();
    const context = request.context?.trim();

    if (!word) {
      throw new BadRequestException('Word is required.');
    }

    if (!translation) {
      throw new BadRequestException('Translation is required.');
    }

    if (!context) {
      throw new BadRequestException('Context is required.');
    }

    return this.dictionaryRepository.createOrUpdate({
      context,
      createdAt: new Date().toISOString(),
      id: randomUUID(),
      progress: 'new',
      translation,
      word,
    });
  }

  findAll(): Promise<DictionaryWord[]> {
    return this.dictionaryRepository.findAll();
  }
}
