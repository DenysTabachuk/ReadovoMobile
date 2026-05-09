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
  label: string;
  placement?: {
    scale?: number;
    translateYRatio?: number;
    translateXRatio?: number;
  };
  price: number;
  slot: MascotAccessorySlot;
};
