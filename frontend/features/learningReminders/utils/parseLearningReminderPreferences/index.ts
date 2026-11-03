import type { LearningReminderTime } from '@/providers/preferencesProvider';

import type { LearningReminderSettings } from '../../types';

function isLearningReminderTime(value: unknown): value is LearningReminderTime {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/**
 * Validates server settings before handing them to the local preferences provider.
 * @param value - Untrusted response; Axios/generated types do not validate JSON.
 * @returns Fresh settings with a boolean flag and an HH:mm time. Throws on invalid
 * values, drops extra fields and does not mutate the input or substitute defaults.
 * @example
 * parseLearningReminderPreferences({ learningRemindersEnabled: true, learningReminderTime: '09:05' });
 * // => { learningRemindersEnabled: true, learningReminderTime: '09:05' }
 */
export function parseLearningReminderPreferences(
  value: unknown,
): LearningReminderSettings {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('learningRemindersEnabled' in value) ||
    typeof value.learningRemindersEnabled !== 'boolean' ||
    !('learningReminderTime' in value) ||
    !isLearningReminderTime(value.learningReminderTime)
  ) {
    throw new Error('Invalid learning reminder preferences.');
  }
  return {
    learningRemindersEnabled: value.learningRemindersEnabled,
    learningReminderTime: value.learningReminderTime,
  };
}
