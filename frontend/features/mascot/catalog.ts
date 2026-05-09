import { type MascotAccessorySlot, type MascotCatalogItem } from './types';

export const mascotAccessorySlots: MascotAccessorySlot[] = [
  'head',
  'eyes',
];

export const mascotCatalog: MascotCatalogItem[] = [
  {
    asset: require('../../assets/mascot/accessories/hats/pirate-hat.png'),
    id: 'pirate-hat',
    label: 'Pirate hat',
    placement: {
      scale: 0.65,
      translateYRatio: -0.18,
      translateXRatio: 0.015,
    },
    price: 0,
    slot: 'head',
  },
  {
    asset: require('../../assets/mascot/accessories/hats/bandanna.png'),
    id: 'bandanna',
    label: 'Bandanna',
    placement: {
      scale: 0.7,
      translateYRatio: -0.10,
      translateXRatio: 0.04,
    },
    price: 0,
    slot: 'head',
  },
  {
    asset: require('../../assets/mascot/accessories/glasses/glasses.png'),
    id: 'glasses',
    label: 'Glasses',
    placement: {
      scale: 0.55,
      translateYRatio: -0.12,
    },
    price: 0,
    slot: 'eyes',
  },
  {
    asset: require('../../assets/mascot/accessories/glasses/eye-patch.png'),
    id: 'eye-patch',
    label: 'Eye patch',
    placement: {
      translateYRatio: -0.12,
    },
    price: 0,
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
