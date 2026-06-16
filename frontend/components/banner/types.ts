import { type ComponentProps } from 'react';
import { type Ionicons } from '@expo/vector-icons';
import { type ImageSourcePropType } from 'react-native';

export type BannerVariant =
  | 'success'
  | 'error'
  | 'info'
  | 'reward'
  | 'achievement'
  | 'streak';

export type AchievementBannerDetails = {
  badge?: ImageSourcePropType;
  coinsReward: number;
  icon?: ComponentProps<typeof Ionicons>['name'];
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
