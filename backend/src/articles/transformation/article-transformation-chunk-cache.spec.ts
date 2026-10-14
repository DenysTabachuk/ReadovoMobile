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
      level: 'A2' as const,
      source: 'Source chunk.',
      title: 'Fashion',
      transformationType: 'summary' as const,
    };

    expect(cache.createKey(params)).toBe(cache.createKey(params));
    expect(cache.createKey(params)).not.toBe(
      cache.createKey({ ...params, level: 'B1' }),
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

    expect(storeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ cacheKey: 'chunk-key' }),
        update: expect.objectContaining({ adaptedBlocks }),
        where: { cacheKey: 'chunk-key' },
      }),
    );
  });
});
