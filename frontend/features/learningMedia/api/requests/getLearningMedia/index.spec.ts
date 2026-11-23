import { api } from '@/features/auth';
import { getLearningMedia } from '.';

jest.mock('@/features/auth', () => ({ api: { get: jest.fn() } }));

const IMAGE_URL = '/learning/media?key=learning%2Ftopics%2Fexample%2Fv1.png';
const WEBP_BYTES = [82, 73, 70, 70, 54, 0, 0, 0, 87, 69, 66, 80];
const signal = new AbortController().signal;

it('uses the authenticated API and converts PNG bytes to an image URI', async () => {
  const bytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1]);
  jest.mocked(api.get).mockResolvedValue({
    data: bytes.buffer,
    headers: { 'content-type': 'image/png' },
  });
  await expect(getLearningMedia(IMAGE_URL, signal)).resolves.toBe(
    'data:image/png;base64,iVBORw0KGgoB',
  );
  expect(api.get).toHaveBeenCalledWith(
    IMAGE_URL,
    expect.objectContaining({
      responseType: 'arraybuffer',
      signal,
    }),
  );
});

it('uses the WebP content type when building the image URI', async () => {
  jest.mocked(api.get).mockResolvedValue({
    data: Uint8Array.from(WEBP_BYTES).buffer,
    headers: { 'content-type': 'image/webp' },
  });
  await expect(getLearningMedia(IMAGE_URL, signal)).resolves.toBe(
    'data:image/webp;base64,UklGRjYAAABXRUJQ',
  );
});

it('rejects image bytes that do not match the declared content type', async () => {
  jest.mocked(api.get).mockResolvedValue({
    data: Uint8Array.from(WEBP_BYTES).buffer,
    headers: { 'content-type': 'image/png' },
  });
  await expect(getLearningMedia(IMAGE_URL, signal)).rejects.toThrow(
    'Invalid learning image response',
  );
});
