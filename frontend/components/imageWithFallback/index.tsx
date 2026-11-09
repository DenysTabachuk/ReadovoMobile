import { Image, type ImageProps, type ImageSource } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { DefaultImageFallback } from './components/defaultImageFallback';

type ImageWithFallbackProps = Omit<ImageProps, 'source' | 'onError'> & {
  source?: string | number | ImageSource | ImageSource[] | string[] | null;
  fallback?: ReactNode;
};

/**
 * Shows a themed default placeholder for a missing source or loading failure.
 * Callers may override it with custom fallback content, including null to hide it.
 * Supports serializable URI/asset sources, including source arrays, rather than
 * native ImageRef handles. A changed source definition starts a fresh attempt;
 * equivalent inline source objects retain their failure state. Other image props
 * are forwarded without adding a layout wrapper; errors are handled internally.
 */
export function ImageWithFallback({
  source,
  fallback,
  ...props
}: ImageWithFallbackProps) {
  const placeholder =
    fallback === undefined ? (
      <DefaultImageFallback style={props.style} />
    ) : (
      fallback
    );
  if (source == null || source === '') return <>{placeholder}</>;

  // Key by source content so an old image's late error cannot fail its replacement.
  return (
    <ImageAttempt
      key={JSON.stringify(source)}
      source={source}
      {...props}
      fallback={placeholder}
    />
  );
}

function ImageAttempt({ fallback, ...props }: ImageWithFallbackProps) {
  const [hasLoadError, setHasLoadError] = useState(false);

  if (hasLoadError) return <>{fallback}</>;

  return <Image {...props} onError={() => setHasLoadError(true)} />;
}
