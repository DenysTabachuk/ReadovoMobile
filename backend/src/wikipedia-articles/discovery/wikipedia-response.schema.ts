import { z } from 'zod';

const WikipediaPageSchema = z.object({
  extract: z.string().optional(),
  fullurl: z.string().optional(),
  length: z.number().optional(),
  pageid: z.number().int(),
  thumbnail: z.object({ source: z.string().optional() }).optional(),
  title: z.string(),
});

// Missing query/pages is a valid empty result; unrelated API metadata is ignored.
export const WikipediaResponseSchema = z.object({
  query: z
    .object({
      pages: z.record(z.string(), WikipediaPageSchema).nullish(),
    })
    .nullish(),
});

export type WikipediaApiResponse = z.infer<typeof WikipediaResponseSchema>;
export type WikipediaPage = z.infer<typeof WikipediaPageSchema>;
