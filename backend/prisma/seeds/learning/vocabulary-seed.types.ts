import type { z } from 'zod';
import type { vocabularySeedSchema } from './vocabulary-seed.schema';

export type VocabularySeedContent = z.infer<typeof vocabularySeedSchema>;
