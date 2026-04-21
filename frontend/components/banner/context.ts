import { createContext } from 'react';

import { type BannerContextValue } from './types';

export const BannerContext = createContext<BannerContextValue | null>(null);
