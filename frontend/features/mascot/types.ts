import { type ImageSourcePropType } from 'react-native';

export type MascotAccessorySlot = 'eyes' | 'head';

export type MascotEquippedItems = Partial<Record<MascotAccessorySlot, string>>;

export type MascotProfile = {
  equippedItems: MascotEquippedItems;
  ownedItemIds: string[];
  userId: string;
};

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
