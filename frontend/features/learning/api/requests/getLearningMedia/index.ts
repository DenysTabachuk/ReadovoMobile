import { Buffer } from 'buffer';
import { api } from '@/features/auth';

const PNG_PREFIX = '89504e470d0a1a0a';

/** Fetches PNG or WebP artwork as a memory-only image URI. */
export async function getLearningMedia(imageUrl: string, signal: AbortSignal) {
  const { data, headers } = await api.get<unknown>(imageUrl, {
    signal,
    // Read the response body as raw bytes (an ArrayBuffer).
    responseType: 'arraybuffer',
    transformResponse: (value: unknown, headers) => {
      if (
        value instanceof ArrayBuffer &&
        String(headers['content-type']).startsWith('application/json')
      ) {
        // Decode the JSON error body so the auth client can read its error code.
        return JSON.parse(Buffer.from(value).toString('utf8'));
      }
      return value;
    },
  });

  if (!(data instanceof ArrayBuffer))
    throw new Error('Invalid learning image response.');

  const image = Buffer.from(data);
  const mimeType = headers['content-type'];
  // Check that the file signature matches the declared image type.
  const isPng =
    mimeType === 'image/png' && image.toString('hex', 0, 8) === PNG_PREFIX;
  const isWebp =
    mimeType === 'image/webp' &&
    image.toString('ascii', 0, 4) === 'RIFF' &&
    image.toString('ascii', 8, 12) === 'WEBP';
  if (!isPng && !isWebp) throw new Error('Invalid learning image response.');

  // Wrap the Base64 image in a data URI that expo-image can display.
  return `data:${mimeType};base64,${image.toString('base64')}`;
}
