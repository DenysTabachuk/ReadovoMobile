import { useContext } from 'react';

import { BannerContext } from './context';

export function useBanner() {
  const context = useContext(BannerContext);

  if (!context) {
    throw new Error('useBanner must be used within BannerProvider');
  }

  return context;
}
