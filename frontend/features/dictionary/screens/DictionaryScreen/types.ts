import type { DictionaryWordProgress } from '../../api/types';

export type DictionaryFilter = 'all' | 'phrases' | 'words';
export type DictionaryProgressFilter = 'all' | DictionaryWordProgress;
export type ProgressFilterOption = {
  label: string;
  value: DictionaryProgressFilter;
};
