import { type InlineNode } from '@/api/wikipedia';

import {
  getContextSentence,
  getWordContext,
  splitTextToTouchableParts,
  type TouchableTextPart,
} from './textParts';

type TouchableWordPart = Extract<TouchableTextPart, { type: 'word' }>;

const BROKEN_SCREENSHOT_PARAGRAPH =
  '3D printing, also called additive manufacturing, is the construction of ' +
  'a three-dimensional object from a CAD model or a digital 3D model. ' +
  'It can be done in a variety of processes in which material is deposited, ' +
  'joined or solidified under computer control, with the material being added ' +
  'together (e.g. plastics, liquids, or powder grains being fused), typically ' +
  'layer by layer.';

const EXPECTED_COMPUTER_CONTEXT =
  'It can be done in a variety of processes in which material is deposited, ' +
  'joined or solidified under computer control, with the material being added ' +
  'together (e.g. plastics, liquids, or powder grains being fused), typically ' +
  'layer by layer.';

describe('article touchable text context', () => {
  it('keeps the full sentence context for a word before e.g. in the reported paragraph', () => {
    const computerPart = getWordPart(BROKEN_SCREENSHOT_PARAGRAPH, 'computer');

    expect(computerPart?.contextSentence).toBe(EXPECTED_COMPUTER_CONTEXT);
  });

  it('keeps the full sentence context for a word after e.g. in the reported paragraph', () => {
    const plasticsPart = getWordPart(BROKEN_SCREENSHOT_PARAGRAPH, 'plastics');

    expect(plasticsPart?.contextSentence).toBe(EXPECTED_COMPUTER_CONTEXT);
  });

  it('keeps the full sentence context for together in the reported paragraph', () => {
    const togetherPart = getWordPart(BROKEN_SCREENSHOT_PARAGRAPH, 'together');

    expect(togetherPart?.contextSentence).toBe(EXPECTED_COMPUTER_CONTEXT);
  });

  it('never assigns the e.g. fragment as context to words in the reported sentence', () => {
    const parts = splitTextToTouchableParts(
      createInlineNodesFromPlainText(BROKEN_SCREENSHOT_PARAGRAPH),
      'test',
    ).filter((part): part is TouchableWordPart => part.type === 'word');
    const reportedSentenceWords = parts.filter((part) =>
      EXPECTED_COMPUTER_CONTEXT.toLowerCase().includes(part.word),
    );

    expect(reportedSentenceWords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ word: 'together' }),
        expect.objectContaining({ word: 'computer' }),
        expect.objectContaining({ word: 'plastics' }),
      ]),
    );
    reportedSentenceWords.forEach((part) => {
      expect(part.contextSentence).not.toBe('g.');
    });
  });

  it('does not treat i.e. as a sentence boundary', () => {
    const text = 'Some printers use material extrusion, i.e. melted filament, for simple parts.';
    const filamentPart = getWordPart(text, 'filament');

    expect(filamentPart?.contextSentence).toBe(text);
  });

  it('does not treat common title abbreviations as sentence boundaries', () => {
    const text = 'Dr. Smith studied the process. It became popular later.';
    const smithPart = getWordPart(text, 'Smith');
    const laterPart = getWordPart(text, 'later');

    expect(smithPart?.contextSentence).toBe('Dr. Smith studied the process.');
    expect(laterPart?.contextSentence).toBe('It became popular later.');
  });

  it('still splits real sentence boundaries around the reported paragraph', () => {
    const firstItIndex = BROKEN_SCREENSHOT_PARAGRAPH.indexOf('It');
    const context = getContextSentence(
      BROKEN_SCREENSHOT_PARAGRAPH,
      firstItIndex,
      firstItIndex + 'It'.length,
    );

    expect(context).toBe(EXPECTED_COMPUTER_CONTEXT);
  });

  it('splits context on newlines', () => {
    const text = 'First line has a word.\nSecond line has another word.';
    const anotherPart = getWordPart(text, 'another');

    expect(anotherPart?.contextSentence).toBe('Second line has another word.');
  });

  it('does not send a tiny fragment as context when sentence detection returns one', () => {
    const text = 'g. computer control keeps enough surrounding words for translation.';
    const context = getWordContext(text, 0, 'g'.length);

    expect(context).not.toBe('g.');
    expect(context).toContain('computer control');
  });

  it('keeps context across e.g. when the selected word appears immediately after it', () => {
    const text = 'Materials include e.g. plastics, liquids, and powder grains.';
    const plasticsPart = getWordPart(text, 'plastics');

    expect(plasticsPart?.contextSentence).toBe(text);
  });

  it('keeps context when e.g. is split into separate inline nodes', () => {
    const nodes: InlineNode[] = [
      { text: 'The material is added ', type: 'text' },
      { text: 'together', type: 'word' },
      { text: ' (', type: 'text' },
      { text: 'e', type: 'word' },
      { text: '.', type: 'text' },
      { text: 'g', type: 'word' },
      { text: '. plastics, liquids, or powder grains), typically layer by layer.', type: 'text' },
    ];
    const togetherPart = splitTextToTouchableParts(nodes, 'test').find(
      (part): part is TouchableWordPart => part.type === 'word' && part.word === 'together',
    );

    expect(togetherPart?.contextSentence).toBe(
      'The material is added together (e.g. plastics, liquids, or powder grains), typically layer by layer.',
    );
  });

  it('falls back to a wider context if a spaced abbreviation leaves an open parenthesis', () => {
    const text =
      'The material is added together (e. g. plastics, liquids, or powder grains), typically layer by layer.';
    const togetherPart = getWordPart(text, 'together');

    expect(togetherPart?.contextSentence).not.toBe('The material is added together (e.');
    expect(togetherPart?.contextSentence).toContain('plastics, liquids');
    expect(togetherPart?.contextSentence).toContain('layer by layer');
  });

  it('keeps context across etc. inside the same sentence', () => {
    const text = 'Printers can use plastics, liquids, powder grains, etc. for layer-based fabrication.';
    const fabricationPart = getWordPart(text, 'fabrication');

    expect(fabricationPart?.contextSentence).toBe(text);
  });

  it('keeps context across approx. inside measurements', () => {
    const text = 'The nozzle stayed approx. 2 mm above the surface during calibration.';
    const surfacePart = getWordPart(text, 'surface');

    expect(surfacePart?.contextSentence).toBe(text);
  });

  it('keeps context across vs. inside a comparison', () => {
    const text = 'Researchers compared additive vs. subtractive manufacturing in the same study.';
    const subtractivePart = getWordPart(text, 'subtractive');

    expect(subtractivePart?.contextSentence).toBe(text);
  });
});

function getWordPart(text: string, word: string) {
  return splitTextToTouchableParts(createInlineNodesFromPlainText(text), 'test').find(
    (part): part is TouchableWordPart =>
      part.type === 'word' && part.word === word.toLowerCase(),
  );
}

function createInlineNodesFromPlainText(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(/[A-Za-z]+(?:['\u2019-][A-Za-z]+)*/g)) {
    const matchedWord = match[0];
    const start = match.index ?? 0;

    if (cursor < start) {
      nodes.push({
        text: text.slice(cursor, start),
        type: 'text',
      });
    }

    nodes.push({
      text: matchedWord,
      type: 'word',
    });
    cursor = start + matchedWord.length;
  }

  if (cursor < text.length) {
    nodes.push({
      text: text.slice(cursor),
      type: 'text',
    });
  }

  return nodes;
}
