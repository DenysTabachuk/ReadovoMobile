import { ArticleContentProcessor } from './article-content.processor';
import { ArticlePromptFactory } from './article-prompt.factory';

describe('ArticlePromptFactory', () => {
  const factory = new ArticlePromptFactory(new ArticleContentProcessor());

  it('includes structured chunk content exactly once', () => {
    const marker = 'UNIQUE SOURCE SENTENCE';
    const prompt = factory.createChunkSimplificationPrompt({
      chunk: {
        blocks: [
          {
            children: [{ text: marker, type: 'text' }],
            type: 'paragraph',
          },
        ],
        index: 1,
        text: marker,
        total: 1,
      },
      level: 'A2',
      sourceWordCount: 3,
      title: 'Test article',
      transformationType: 'summary',
    });

    expect(prompt.match(new RegExp(marker, 'g'))).toHaveLength(1);
    expect(prompt).toContain('Source blocks:');
    expect(prompt).not.toContain('Source text:');
  });

  it('uses plain source text when structured blocks are unavailable', () => {
    const prompt = factory.createChunkSimplificationPrompt({
      chunk: {
        index: 1,
        text: 'Plain source text.',
        total: 1,
      },
      level: 'A2',
      sourceWordCount: 3,
      title: 'Test article',
      transformationType: 'summary',
    });

    expect(prompt).toContain('Source text:\nPlain source text.');
    expect(prompt).not.toContain('Source blocks:');
  });
});
