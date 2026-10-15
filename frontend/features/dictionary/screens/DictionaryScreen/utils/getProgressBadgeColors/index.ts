import type { DictionaryWordProgress } from '../../../../api/types';
import type { useColorScheme } from '@/hooks/use-color-scheme';

export function getProgressBadgeColors(
  progress: DictionaryWordProgress,
  colorScheme: ReturnType<typeof useColorScheme>,
): { backgroundColor: string; textColor: string } {
  const isDark = colorScheme === 'dark';

  if (progress === 'learned') {
    return {
      backgroundColor: isDark ? '#173522' : '#dff7e8',
      textColor: isDark ? '#7ee0a0' : '#1f8a4c',
    };
  }

  if (progress === 'in_progress') {
    return {
      backgroundColor: isDark ? '#3a2d14' : '#fff2cc',
      textColor: isDark ? '#ffd36a' : '#9a6700',
    };
  }

  return {
    backgroundColor: isDark ? '#263238' : '#e6f4f8',
    textColor: isDark ? '#7ccce6' : '#0a7ea4',
  };
}
