import { BadRequestException } from '@nestjs/common';

import { DictionaryRepository } from './dictionary.repository';
import { DictionaryService } from './dictionary.service';
import { DictionaryEmbeddingService } from './dictionary-embedding.service';

describe('DictionaryService', () => {
  const repository = {
    create: jest.fn(),
  };
  const service = new DictionaryService(
    {} as DictionaryEmbeddingService,
    repository as unknown as DictionaryRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('keeps the maximum phrase length as a domain rule', async () => {
    await expect(
      service.createWord('user-1', {
        context: 'Context',
        translation: 'Translation',
        word: 'one two three four five six',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('relies on the atomic repository insert for duplicate detection', async () => {
    repository.create.mockResolvedValue(null);

    await expect(
      service.createWord('user-1', {
        context: 'Context',
        translation: 'Translation',
        word: 'example',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.create).toHaveBeenCalledTimes(1);
  });
});
