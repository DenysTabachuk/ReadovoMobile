import {
  extractPlainTextFromBlocks,
  parseHtmlToBlocks,
} from './article-html-parser';

describe('articleHtmlParser', () => {
  it('parses supported Wikipedia HTML blocks and ignores metadata noise', () => {
    const blocks = parseHtmlToBlocks(`
      <html>
        <body>
          <section>
            <h2>History</h2>
            <p><b>France</b> is a <i>country</i>.</p>
            <ul>
              <li>First item</li>
              <li>Second item <sup class="reference">[1]</sup></li>
            </ul>
            <table>
              <tr>
                <th>Year</th>
                <th>Event</th>
              </tr>
              <tr>
                <td>1789</td>
                <td>Revolution</td>
              </tr>
            </table>
            <figure class="thumb">
              <img src="//upload.wikimedia.org/example.jpg" alt="Example image" />
              <figcaption>Example caption</figcaption>
            </figure>
            <div class="mw-editsection">edit</div>
            <div class="navbox">ignore me</div>
          </section>
        </body>
      </html>
    `);

    expect(blocks).toHaveLength(5);
    expect(blocks[0]).toEqual({
      level: 2,
      text: 'History',
      type: 'heading',
    });
    expect(blocks[1]).toMatchObject({
      children: [
        {
          bold: true,
          text: 'France',
          type: 'word',
        },
        {
          text: ' ',
          type: 'text',
        },
        {
          text: 'is',
          type: 'word',
        },
        {
          text: ' ',
          type: 'text',
        },
        {
          text: 'a',
          type: 'word',
        },
        {
          text: ' ',
          type: 'text',
        },
        {
          italic: true,
          text: 'country',
          type: 'word',
        },
        {
          text: '.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    });
    expect(blocks[2]).toMatchObject({
      ordered: false,
      type: 'list',
    });
    expect(blocks[2]?.type === 'list' ? blocks[2].items.length : 0).toBe(2);
    expect(
      blocks[2]?.type === 'list'
        ? blocks[2].items.map((item) => item.map((node) => node.text).join('').trim())
        : [],
    ).toEqual(['First item', 'Second item']);
    expect(blocks[3]).toMatchObject({
      rows: [
        [
          {
            header: true,
            text: 'Year',
          },
          {
            header: true,
            text: 'Event',
          },
        ],
        [
          {
            text: '1789',
          },
          {
            text: 'Revolution',
          },
        ],
      ],
      type: 'table',
    });
    expect(blocks[4]).toEqual({
      alt: 'Example image',
      caption: 'Example caption',
      src: 'https://upload.wikimedia.org/example.jpg',
      type: 'image',
    });
  });

  it('creates plain text output from parsed blocks for simplification fallback', () => {
    const blocks = parseHtmlToBlocks('<p>France is a country.</p><p>Paris is its capital.</p>');

    expect(extractPlainTextFromBlocks(blocks)).toBe(
      'France is a country.\n\nParis is its capital.',
    );
  });

  it('skips non-informative sections like external links and sources', () => {
    const blocks = parseHtmlToBlocks(`
      <section>
        <h2>History</h2>
        <p>Useful content.</p>
        <h2>External links</h2>
        <ul>
          <li>Official website</li>
        </ul>
        <h2>Sources</h2>
        <p>Book list.</p>
        <h2>Culture</h2>
        <p>More useful content.</p>
      </section>
    `);

    expect(blocks).toEqual([
      {
        level: 2,
        text: 'History',
        type: 'heading',
      },
      {
        children: [
          { text: 'Useful', type: 'word' },
          { text: ' ', type: 'text' },
          { text: 'content', type: 'word' },
          { text: '.', type: 'text' },
        ],
        type: 'paragraph',
      },
      {
        level: 2,
        text: 'Culture',
        type: 'heading',
      },
      {
        children: [
          { text: 'More', type: 'word' },
          { text: ' ', type: 'text' },
          { text: 'useful', type: 'word' },
          { text: ' ', type: 'text' },
          { text: 'content', type: 'word' },
          { text: '.', type: 'text' },
        ],
        type: 'paragraph',
      },
    ]);
  });

  it('parses wikipedia infobox tables instead of dropping them', () => {
    const blocks = parseHtmlToBlocks(`
      <section>
        <table class="infobox vcard">
          <caption>Dame Pattie</caption>
          <tr>
            <td colspan="2">
              <img src="//upload.wikimedia.org/dame-pattie.jpg" alt="Dame Pattie yacht" />
              <div class="infobox-caption">12 Metre yacht</div>
            </td>
          </tr>
          <tr>
            <th scope="row">Nation</th>
            <td>Australia</td>
          </tr>
          <tr>
            <th scope="row">Class</th>
            <td>12 Metre</td>
          </tr>
        </table>
      </section>
    `);

    expect(blocks[0]).toEqual({
      alt: 'Dame Pattie yacht',
      caption: '12 Metre yacht',
      src: 'https://upload.wikimedia.org/dame-pattie.jpg',
      type: 'image',
    });
    expect(blocks[1]).toMatchObject({
      rows: [
        [
          {
            header: true,
            text: 'Dame Pattie',
          },
        ],
        [
          {
            header: true,
            text: 'Nation',
          },
          {
            text: 'Australia',
          },
        ],
        [
          {
            header: true,
            text: 'Class',
          },
          {
            text: '12 Metre',
          },
        ],
      ],
      type: 'table',
    });
  });

  it('skips unsupported interactive map blocks', () => {
    const blocks = parseHtmlToBlocks(`
      <section>
        <p>Intro paragraph.</p>
        <div class="mw-kartographer-container thumb tright">
          <mapframe latitude="48.8566" longitude="2.3522" zoom="10"></mapframe>
        </div>
        <div class="kartographer-map">Map preview</div>
        <maplink latitude="48.8566" longitude="2.3522"></maplink>
        <p>Outro paragraph.</p>
      </section>
    `);

    expect(blocks).toEqual([
      {
        children: [
          { text: 'Intro', type: 'word' },
          { text: ' ', type: 'text' },
          { text: 'paragraph', type: 'word' },
          { text: '.', type: 'text' },
        ],
        type: 'paragraph',
      },
      {
        children: [
          { text: 'Outro', type: 'word' },
          { text: ' ', type: 'text' },
          { text: 'paragraph', type: 'word' },
          { text: '.', type: 'text' },
        ],
        type: 'paragraph',
      },
    ]);
  });

  it('parses common wikipedia thumb wrappers and falls back to srcset', () => {
    const blocks = parseHtmlToBlocks(`
      <section>
        <div class="thumb tright">
          <div class="thumbinner">
            <span typeof="mw:File/Thumb">
              <a href="./File:Example.jpg">
                <img
                  alt="Example thumb"
                  data-file-height="900"
                  data-file-width="1200"
                  srcset="//upload.wikimedia.org/example-320.jpg 1x, //upload.wikimedia.org/example-640.jpg 2x"
                />
              </a>
            </span>
            <div class="thumbcaption">Example thumbnail caption</div>
          </div>
        </div>
      </section>
    `);

    expect(blocks).toEqual([
      {
        alt: 'Example thumb',
        caption: 'Example thumbnail caption',
        src: 'https://upload.wikimedia.org/example-320.jpg',
        type: 'image',
      },
    ]);
  });
});
