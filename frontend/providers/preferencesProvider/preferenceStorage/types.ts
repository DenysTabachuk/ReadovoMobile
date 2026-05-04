export type PreferenceStorageBackend = { // storage backend
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};