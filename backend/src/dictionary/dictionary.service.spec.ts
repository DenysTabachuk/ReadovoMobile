import { Test, type TestingModule } from '@nestjs/testing';

import { DictionaryRepository } from './dictionary.repository';
import { DictionaryService } from './dictionary.service';
import { DictionaryEmbeddingService } from './dictionary-embedding.service';

describe('DictionaryService', () => {
  let module: TestingModule;
  let service: DictionaryService;
  let repository: jest.Mocked<Pick<DictionaryRepository, 'create'>>;

  beforeEach(async () => {
    repository = { create: jest.fn() };
    module = await Test.createTestingModule({
      providers: [
        DictionaryService,
        { provide: DictionaryEmbeddingService, useValue: {} },
        { provide: DictionaryRepository, useValue: repository },
      ],
    }).compile();
    service = module.get(DictionaryService);
  });
  afterEach(async () => {
    await module.close();
  });

  it('keeps the maximum phrase length as a domain rule', async () => {
    await expect(
      service.createWord('user-1', {
        context: 'Context',
        translation: 'Translation',
        word: 'one two three four five six',
      }),
    ).rejects.toMatchObject({
      response: { statusCode: 400, code: 'DICTIONARY_WORD_TOO_LONG' },
    });

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
    ).rejects.toMatchObject({
      response: { statusCode: 400, code: 'DICTIONARY_WORD_ALREADY_EXISTS' },
    });

    expect(repository.create).toHaveBeenCalledTimes(1);
  });
});
