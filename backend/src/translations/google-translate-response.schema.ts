import { z } from 'zod';

// Only the first translation is consumed; additional entries and metadata
// must not invalidate an otherwise usable provider response.
export const GoogleTranslateResponseSchema = z.object({
  data: z.object({
    translations: z
      .tuple([z.object({ translatedText: z.string().trim().min(1) })])
      .rest(z.unknown()),
  }),
});
