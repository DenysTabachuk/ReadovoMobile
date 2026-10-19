import { createSimplificationRequestBlocks } from '.';

describe('createSimplificationRequestBlocks', () => {
  it('strips formula rendering payloads while preserving non-formula references', () => {
    const formula = {
      type: 'formula' as const,
      altText: 'x squared',
      display: true,
      svg: '<svg />',
      latex: 'x^2',
      mathml: '<math />',
      widthEx: 4,
      heightEx: 2,
    };
    const heading = {
      type: 'heading' as const,
      level: 1 as const,
      text: 'Intro',
    };
    const blocks = [heading, formula];
    const result = createSimplificationRequestBlocks(blocks);
    expect(result).toEqual([
      heading,
      { type: 'formula', altText: 'x squared', display: true },
    ]);
    expect(result).not.toBe(blocks);
    expect(result[0]).toBe(heading);
    expect(formula.svg).toBe('<svg />');
    expect(createSimplificationRequestBlocks([])).toEqual([]);
  });
});
