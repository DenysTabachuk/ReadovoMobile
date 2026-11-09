import { act, createElement } from 'react';
import type { ImageProps } from 'expo-image';
import { createRoot, type Root } from 'test-renderer';
import { ImageWithFallback } from '.';

jest.mock('expo-image', () => ({
  Image: (props: ImageProps) => {
    mockImageProps.push(props);
    return createElement('image');
  },
}));
jest.mock('./components/defaultImageFallback', () => ({
  DefaultImageFallback: () => createElement('default-fallback'),
}));

const mockImageProps: ImageProps[] = [];
const fallback = createElement('fallback');
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
beforeEach(() => {
  root = createRoot();
  mockImageProps.length = 0;
});
afterEach(async () => {
  await act(async () => root.unmount());
});

it('uses the built-in fallback when no override is supplied', async () => {
  await act(async () =>
    root.render(
      createElement(ImageWithFallback, {
        source: 'https://example.com/book.png',
      }),
    ),
  );
  await act(async () => mockImageProps.at(-1)?.onError?.({ error: 'Failed' }));
  expect(
    root.container.queryAll((node) => node.type === 'default-fallback'),
  ).toHaveLength(1);
});

it('allows null to explicitly hide a failed image', async () => {
  await act(async () =>
    root.render(
      createElement(ImageWithFallback, { source: null, fallback: null }),
    ),
  );
  expect(root.container.children).toHaveLength(0);
});

it.each([undefined, null, ''])(
  'shows fallback immediately for missing source %s',
  async (source) => {
    await act(async () =>
      root.render(createElement(ImageWithFallback, { source, fallback })),
    );
    expect(mockImageProps).toHaveLength(0);
    expect(
      root.container.queryAll((node) => node.type === 'fallback'),
    ).toHaveLength(1);
  },
);

it('forwards asset, layout, cache and accessibility props', async () => {
  await act(async () =>
    root.render(
      createElement(ImageWithFallback, {
        source: 42,
        fallback,
        style: { width: 80, height: 80 },
        contentFit: 'contain',
        cachePolicy: 'disk',
        accessibilityLabel: 'Book',
        transition: 100,
      }),
    ),
  );
  expect(mockImageProps.at(-1)).toEqual(
    expect.objectContaining({
      source: 42,
      style: { width: 80, height: 80 },
      contentFit: 'contain',
      cachePolicy: 'disk',
      accessibilityLabel: 'Book',
      transition: 100,
    }),
  );
  expect(
    root.container.queryAll((node) => node.type === 'fallback'),
  ).toHaveLength(0);
});

it('shows the supplied fallback after a loading error', async () => {
  await act(async () =>
    root.render(
      createElement(ImageWithFallback, {
        source: 'https://example.com/book.png',
        fallback,
      }),
    ),
  );
  const error = { error: 'Image unavailable' };
  await act(async () => mockImageProps.at(-1)?.onError?.(error));
  expect(root.container.queryAll((node) => node.type === 'image')).toHaveLength(
    0,
  );
  expect(
    root.container.queryAll((node) => node.type === 'fallback'),
  ).toHaveLength(1);
});

it('keeps fallback for a new source object with the same definition', async () => {
  await act(async () =>
    root.render(
      createElement(ImageWithFallback, {
        source: { uri: 'https://example.com/book.png' },
        fallback,
      }),
    ),
  );
  await act(async () => mockImageProps.at(-1)?.onError?.({ error: 'Failed' }));
  await act(async () =>
    root.render(
      createElement(ImageWithFallback, {
        source: { uri: 'https://example.com/book.png' },
        fallback,
      }),
    ),
  );
  expect(root.container.queryAll((node) => node.type === 'image')).toHaveLength(
    0,
  );
  expect(
    root.container.queryAll((node) => node.type === 'fallback'),
  ).toHaveLength(1);
});

it('retries a changed source and ignores a late failure from the previous image', async () => {
  await act(async () =>
    root.render(
      createElement(ImageWithFallback, {
        source: 'https://example.com/old.png',
        fallback,
      }),
    ),
  );
  const oldError = mockImageProps.at(-1)?.onError;
  await act(async () => oldError?.({ error: 'Failed' }));
  await act(async () =>
    root.render(
      createElement(ImageWithFallback, {
        source: 'https://example.com/new.png',
        fallback,
      }),
    ),
  );
  await act(async () => oldError?.({ error: 'Late error' }));
  expect(root.container.queryAll((node) => node.type === 'image')).toHaveLength(
    1,
  );
  expect(
    root.container.queryAll((node) => node.type === 'fallback'),
  ).toHaveLength(0);
  expect(mockImageProps.at(-1)?.source).toBe('https://example.com/new.png');
});

it('starts a fresh attempt after clearing and restoring a failed source', async () => {
  await act(async () =>
    root.render(createElement(ImageWithFallback, { source: 42, fallback })),
  );
  await act(async () => mockImageProps.at(-1)?.onError?.({ error: 'Failed' }));
  await act(async () =>
    root.render(createElement(ImageWithFallback, { source: null, fallback })),
  );
  await act(async () =>
    root.render(createElement(ImageWithFallback, { source: 42, fallback })),
  );
  expect(root.container.queryAll((node) => node.type === 'image')).toHaveLength(
    1,
  );
});
