import { PrismaService } from '../../prisma/prisma.service';
import { ArticleTransformationChunkCache } from './article-transformation-chunk-cache';

describe('ArticleTransformationChunkCache', () => {
  const adaptedBlocks = [
    {
      children: [{ text: 'Cached summary.', type: 'text' as const }],
      type: 'paragraph' as const,
    },
  ];
  let deleteMock: jest.Mock;
  let findUniqueMock: jest.Mock;
  let storeMock: jest.Mock;
  let cache: ArticleTransformationChunkCache;

  beforeEach(() => {
    deleteMock = jest.fn();
    findUniqueMock = jest.fn();
    storeMock = jest.fn();
    const prisma = {
      articleTransformationChunk: {
        delete: deleteMock,
        findUnique: findUniqueMock,
        upsert: storeMock,
      },
    } as unknown as PrismaService;
    cache = new ArticleTransformationChunkCache(prisma);
  });

  it('creates stable versioned keys from all output-affecting input', () => {
    const params = {
      chunkIndex: 1,
      chunkTotal: 2,
      level: 'A2' as const,
      source: 'Source chunk.',
      sourceWordCount: 4_000,
      title: 'Fashion',
      transformationType: 'summary' as const,
    };

    expect(cache.createKey(params)).toBe(cache.createKey(params));
    expect(cache.createKey(params)).not.toBe(
      cache.createKey({ ...params, level: 'B1' }),
    );
    expect(cache.createKey(params)).not.toBe(
      cache.createKey({ ...params, sourceWordCount: 2_000 }),
    );
    expect(cache.createKey(params)).not.toBe(
      cache.createKey({ ...params, chunkIndex: 2 }),
    );
  });

  it('returns a valid persisted chunk', async () => {
    findUniqueMock.mockResolvedValue({
      adaptedBlocks,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(cache.get('chunk-key')).resolves.toEqual(adaptedBlocks);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('removes an expired persisted chunk', async () => {
    findUniqueMock.mockResolvedValue({
      adaptedBlocks,
      expiresAt: new Date(Date.now() - 1),
    });

    await expect(cache.get('chunk-key')).resolves.toBeNull();
    expect(deleteMock).toHaveBeenCalledWith({
      where: { cacheKey: 'chunk-key' },
    });
  });

  it('upserts validated chunk blocks', async () => {
    storeMock.mockResolvedValue({});

    await cache.store({ adaptedBlocks, cacheKey: 'chunk-key' });
    const expiresAt = expect.any(Date) as unknown as Date;

    expect(storeMock).toHaveBeenCalledWith({
      create: { adaptedBlocks, cacheKey: 'chunk-key', expiresAt },
      update: { adaptedBlocks, expiresAt },
      where: { cacheKey: 'chunk-key' },
    });
  });
});
