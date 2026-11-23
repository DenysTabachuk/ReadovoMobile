import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { getLearningMedia } from '../../requests/getLearningMedia';
import { learningMediaQueryOptions } from '../useLearningMediaQuery';
import { usePrefetchLearningMedia } from '.';

jest.mock('@/features/auth', () => ({
  getAuthSessionVersion: () => 1,
  useAuthenticatedUser: () => ({ id: 'learner' }),
}));
jest.mock('../../requests/getLearningMedia', () => ({
  getLearningMedia: jest.fn(),
}));

const imageUrls = ['/first-a', '/first-b', '/first-c', '/later'];

function Practice() {
  usePrefetchLearningMedia(imageUrls, true);
  return null;
}

it('prioritizes the first choices, limits parallel requests and retains results through practice', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.useFakeTimers();
  const root = createRoot();
  const client = new QueryClient();
  const firstImage = Promise.withResolvers<string>();
  const otherImages = Promise.withResolvers<string>();
  const mediaRequest = jest.mocked(getLearningMedia);
  mediaRequest.mockImplementation((url) =>
    url === imageUrls[0] ? firstImage.promise : otherImages.promise,
  );
  let mounted = true;

  try {
    await act(async () => {
      root.render(
        createElement(QueryClientProvider, { client }, createElement(Practice)),
      );
    });
    expect(mediaRequest.mock.calls.map(([url]) => url)).toEqual(
      imageUrls.slice(0, 3),
    );

    await act(async () => {
      firstImage.resolve('first image data');
    });
    expect(mediaRequest.mock.calls.map(([url]) => url)).toEqual(imageUrls);
    await act(async () => {
      otherImages.resolve('other image data');
      await jest.advanceTimersByTimeAsync(61_000);
    });
    const firstImageQuery = learningMediaQueryOptions('learner', imageUrls[0]);
    await expect(client.fetchQuery(firstImageQuery)).resolves.toBe(
      'first image data',
    );
    expect(mediaRequest).toHaveBeenCalledTimes(imageUrls.length);

    await act(async () => root.unmount());
    mounted = false;
    await jest.advanceTimersByTimeAsync(61_000);
    expect(client.getQueryData(firstImageQuery.queryKey)).toBeUndefined();
  } finally {
    if (mounted) await act(async () => root.unmount());
    client.clear();
    jest.useRealTimers();
  }
});
