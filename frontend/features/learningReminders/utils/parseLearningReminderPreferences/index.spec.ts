import { parseLearningReminderPreferences } from './index';

it.each(['00:00', '09:05', '23:59'])(
  'preserves valid HH:mm formatting: %s',
  (time) => {
    const preferences = Object.freeze({
      learningReminderTime: time,
      learningRemindersEnabled: true,
      extra: 'ignored',
    });
    expect(parseLearningReminderPreferences(preferences)).toEqual({
      learningReminderTime: time,
      learningRemindersEnabled: true,
    });
    expect(preferences.extra).toBe('ignored');
  },
);

it('preserves a disabled flag', () => {
  expect(
    parseLearningReminderPreferences({
      learningReminderTime: '19:00',
      learningRemindersEnabled: false,
    }),
  ).toEqual({ learningReminderTime: '19:00', learningRemindersEnabled: false });
});

it.each([
  null,
  undefined,
  [],
  {},
  { learningReminderTime: '24:00', learningRemindersEnabled: true },
  { learningReminderTime: '19:60', learningRemindersEnabled: true },
  { learningReminderTime: '9:05', learningRemindersEnabled: true },
  { learningReminderTime: '19:00', learningRemindersEnabled: 'true' },
  { learningReminderTime: null, learningRemindersEnabled: true },
])('rejects malformed successful response %j', (value) => {
  expect(() => parseLearningReminderPreferences(value)).toThrow(
    'Invalid learning reminder preferences.',
  );
});
