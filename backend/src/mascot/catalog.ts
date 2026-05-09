import { type MascotCatalogItem } from './types';

export const mascotCatalog: MascotCatalogItem[] = [
  {
    id: 'pirate-hat',
    price: 0,
    slot: 'head',
  },
  {
    id: 'bandanna',
    price: 0,
    slot: 'head',
  },
  {
    id: 'glasses',
    price: 0,
    slot: 'eyes',
  },
  {
    id: 'eye-patch',
    price: 0,
    slot: 'eyes',
  },
];

export function getMascotCatalogItem(
  itemId: string,
): MascotCatalogItem | undefined {
  return mascotCatalog.find((item) => item.id === itemId);
}
