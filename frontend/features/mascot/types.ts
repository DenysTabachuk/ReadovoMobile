import { type ImageSourcePropType } from 'react-native';

import { type MascotAccessorySlot } from '@/api/generated/transport';

export type {
  MascotAccessorySlot,
  MascotEquippedItems,
  MascotProfileResponse as MascotProfile,
} from '@/api/generated/transport';

export type MascotCatalogItem = {
  asset: ImageSourcePropType;
  id: string;
  labelKey: string;
  placement?: {
    scale?: number;
    translateYRatio?: number;
    translateXRatio?: number;
    zIndex?: number;
  };
  price: number;
  slot: MascotAccessorySlot;
};
