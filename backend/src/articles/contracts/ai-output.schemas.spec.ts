import { z } from 'zod';

import {
  ArticleTransformationOutputSchema,
  ReadingQuizOutputSchema,
  VocabularyQuizOutputSchema,
} from './ai-output.schemas';

describe('AI output schemas', () => {
  it('accepts the strict reading quiz contract', () => {
    expect(
      ReadingQuizOutputSchema.parse({
        questions: [
          {
            correctOptionIds: ['a'],
            explanation: null,
            id: 'q-1',
            options: [
              { id: 'a', text: 'True' },
              { id: 'b', text: 'False' },
            ],
            prompt: 'The Sun is a star.',
            type: 'true_false',
          },
        ],
      }),
    ).toBeDefined();
  });

  it('rejects responses that omit fields required by strict mode', () => {
    expect(() =>
      ReadingQuizOutputSchema.parse({
        questions: [
          {
            correctOptionIds: ['a'],
            id: 'q-1',
            options: [
              { id: 'a', text: 'True' },
              { id: 'b', text: 'False' },
            ],
            prompt: 'The Sun is a star.',
            type: 'true_false',
          },
        ],
      }),
    ).toThrow();
  });

  it('supports every structured article block without loose properties', () => {
    const parsed = ArticleTransformationOutputSchema.parse({
      adaptedBlocks: [
        { level: 1, text: 'Heading', type: 'heading' },
        {
          children: [
            {
              bold: false,
              italic: false,
              text: 'Text',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
        {
          alt: null,
          caption: null,
          src: 'https://upload.wikimedia.org/example.jpg',
          type: 'image',
        },
      ],
      questions: null,
    });

    expect(parsed.adaptedBlocks).toHaveLength(3);
  });

  it('generates Groq-compatible closed JSON schemas', () => {
    for (const schema of [
      ArticleTransformationOutputSchema,
      ReadingQuizOutputSchema,
      VocabularyQuizOutputSchema,
    ]) {
      assertClosedObjects(z.toJSONSchema(schema));
    }
  });
});

function assertClosedObjects(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertClosedObjects);
    return;
  }

  if (!value || typeof value !== 'object') return;

  const node = value as Record<string, unknown>;
  if (node.type === 'object') {
    const properties = (node.properties ?? {}) as Record<string, unknown>;
    expect(node.additionalProperties).toBe(false);
    expect(node.required).toEqual(Object.keys(properties));
  }

  Object.values(node).forEach(assertClosedObjects);
}
