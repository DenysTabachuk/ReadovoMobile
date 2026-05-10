import { type MascotAccessorySlot, type MascotCatalogItem } from './types';

export const mascotAccessorySlots: MascotAccessorySlot[] = [
  'head',
  'eyes',
];

export const mascotCatalog: MascotCatalogItem[] = [
  {
    asset: require('../../assets/mascot/accessories/hats/pirate-hat.png'),
    id: 'pirate-hat',
    labelKey: 'mascot.items.pirate-hat',
    placement: {
      scale: 0.65,
      translateYRatio: -0.18,
      translateXRatio: 0.015,
    },
    price: 300,
    slot: 'head',
  },
  {
    asset: require('../../assets/mascot/accessories/hats/bandanna.png'),
    id: 'bandanna',
    labelKey: 'mascot.items.bandanna',
    placement: {
      scale: 0.7,
      translateYRatio: -0.10,
      translateXRatio: 0.04,
      zIndex: 2,
    },
    price: 200,
    slot: 'head',
  },
  {
    asset: require('../../assets/mascot/accessories/glasses/glasses.png'),
    id: 'glasses',
    labelKey: 'mascot.items.glasses',
    placement: {
      scale: 0.55,
      translateYRatio: -0.02,
      translateXRatio: 0.002,
    },
    price: 250,
    slot: 'eyes',
  },
  {
    asset: require('../../assets/mascot/accessories/glasses/eye-patch.png'),
    id: 'eye-patch',
    labelKey: 'mascot.items.eye-patch',
    placement: {
      scale: 0.445,
      translateYRatio: -0.067,
      zIndex: 1,
    },
    price: 350,
    slot: 'eyes',
  },
];

export function getMascotCatalogItem(
  itemId: string,
): MascotCatalogItem | undefined {
  return mascotCatalog.find((item) => item.id === itemId);
}

export function getMascotItemsBySlot(slot: MascotAccessorySlot): MascotCatalogItem[] {
  return mascotCatalog.filter((item) => item.slot === slot);
}
