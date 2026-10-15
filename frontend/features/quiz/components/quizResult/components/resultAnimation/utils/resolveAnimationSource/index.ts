import { type ColorSchemeName } from 'react-native';

import { type ResultTier } from '../../../../types';

const animations = {
  good: {
    dark: require('../../../../../../../../assets/images/happy-octopus-dark-theme.mp4'),
    light: require('../../../../../../../../assets/images/happy-octopus-light-theme.mp4'),
  },
  normal: {
    dark: require('../../../../../../../../assets/images/waving-octopus-dark-theme.mp4'),
    light: require('../../../../../../../../assets/images/waving-octopus-light-theme.mp4'),
  },
  poor: {
    dark: require('../../../../../../../../assets/images/crying-octopus-dark-theme.mp4'),
    light: require('../../../../../../../../assets/images/crying-octopus-light-theme.mp4'),
  },
};

export function resolveAnimationSource(
  tier: ResultTier,
  colorScheme: ColorSchemeName,
) {
  return animations[tier][colorScheme === 'dark' ? 'dark' : 'light'];
}
