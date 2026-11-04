import type { LearningReminderPreferencesResponse } from '@/api/generated/transport';
import type { LearningReminderTime } from '@/providers/preferencesProvider';

/** Settings narrowed for the local preferences provider after runtime validation. */
export type LearningReminderSettings = Pick<
  LearningReminderPreferencesResponse,
  'learningRemindersEnabled'
> & {
  learningReminderTime: LearningReminderTime;
};
