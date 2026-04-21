export type BannerVariant = 'success' | 'error';

export type ShowBannerOptions = {
  description?: string;
  durationMs?: number;
  title: string;
  variant: BannerVariant;
};

export type BannerContextValue = {
  hideBanner: () => void;
  showBanner: (options: ShowBannerOptions) => void;
};
