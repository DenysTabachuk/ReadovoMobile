import { toPrismaJson } from './prisma-json';

describe('Prisma JSON serialization', () => {
  it('copies nested JSON-compatible values', () => {
    const source = {
      blocks: [
        { children: [{ text: 'Hello', type: 'text' }], type: 'paragraph' },
      ],
      count: 1,
      enabled: true,
    };

    expect(toPrismaJson(source)).toEqual(source);
  });

  it('omits undefined object properties', () => {
    expect(
      toPrismaJson({ caption: undefined, src: 'cover.jpg', type: 'image' }),
    ).toEqual({ src: 'cover.jpg', type: 'image' });
  });

  it.each([undefined, new Date(), Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects unsupported value %s',
    (value) => {
      expect(() => toPrismaJson(value)).toThrow(
        'Value cannot be stored in a Prisma JSON field.',
      );
    },
  );
});
