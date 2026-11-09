import type { z } from 'zod';
import type { vocabularySeedSchema } from './schema';

export type VocabularySeedLesson = z.infer<typeof vocabularySeedSchema>;
