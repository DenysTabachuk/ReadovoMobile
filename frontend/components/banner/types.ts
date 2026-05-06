import { type ImageSourcePropType } from 'react-native';

export type BannerVariant = 'success' | 'error' | 'reward' | 'achievement';

export type AchievementBannerDetails = {
  badge: ImageSourcePropType;
  coinsReward: number;
};

export type ShowBannerOptions = {
  achievement?: AchievementBannerDetails;
  description?: string;
  durationMs?: number;
  title: string;
  variant: BannerVariant;
};

export type BannerContextValue = {
  hideBanner: () => void;
  showBanner: (options: ShowBannerOptions) => void;
};
