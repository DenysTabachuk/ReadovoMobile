import { ThemedText } from '@/components/themedText';
import { useTranslation } from 'react-i18next';
import type { ArticleTransformationDetails } from '../../../../../../types';
import { styles } from './styles';
import { resolveTransformationStatus } from './utils/resolveTransformationStatus';

export function ArticleTransformationStatus(
  details: ArticleTransformationDetails,
) {
  const { t } = useTranslation();
  const status = resolveTransformationStatus(details);
  return status ? (
    <ThemedText type="description" style={styles.infoText}>
      {t(status.key, status.values)}
    </ThemedText>
  ) : null;
}
