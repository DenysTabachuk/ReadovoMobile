// import {
//   createPreferenceStorage,
//   PREFERENCE_STORAGE_KEYS,
//   readStoredPreferences,
//   saveCompletedOnboarding,
//   saveLanguagePreference,
//   saveThemePreference,
//   type PreferenceStorageBackend,
// } from './constants';

// function createMemoryBackend(): PreferenceStorageBackend {
//   const values = new Map<string, string>();

//   return {
//     async getItem(key) {
//       return values.get(key) ?? null;
//     },
//     async setItem(key, value) {
//       values.set(key, value);
//     },
//   };
// }

// function createFailingBackend(): PreferenceStorageBackend {
//   return {
//     async getItem() {
//       throw new Error('Native module is null');
//     },
//     async setItem() {
//       throw new Error('Native module is null');
//     },
//   };
// }

// describe('preferenceStorage', () => {
//   it('saves and reads completed onboarding, theme, and language', async () => {
//     const storage = createPreferenceStorage(createMemoryBackend());

//     await saveCompletedOnboarding(storage);
//     await saveThemePreference(storage, 'dark');
//     await saveLanguagePreference(storage, 'en');

//     await expect(readStoredPreferences(storage)).resolves.toEqual({
//       hasCompletedOnboarding: true,
//       languagePreference: 'en',
//       themePreference: 'dark',
//     });
//   });

//   it('falls back to memory when native storage is unavailable', async () => {
//     const storage = createPreferenceStorage(createFailingBackend());

//     await saveCompletedOnboarding(storage);
//     await saveThemePreference(storage, 'light');
//     await saveLanguagePreference(storage, 'uk');

//     await expect(readStoredPreferences(storage)).resolves.toEqual({
//       hasCompletedOnboarding: true,
//       languagePreference: 'uk',
//       themePreference: 'light',
//     });
//   });

//   it('ignores invalid stored theme and language values', async () => {
//     const backend = createMemoryBackend();
//     const storage = createPreferenceStorage(backend);

//     await backend.setItem(PREFERENCE_STORAGE_KEYS.onboarding, 'false');
//     await backend.setItem(PREFERENCE_STORAGE_KEYS.theme, 'system');
//     await backend.setItem(PREFERENCE_STORAGE_KEYS.language, 'de');

//     await expect(readStoredPreferences(storage)).resolves.toEqual({
//       hasCompletedOnboarding: false,
//       languagePreference: undefined,
//       themePreference: undefined,
//     });
//   });
// });
