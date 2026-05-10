import { type MascotCatalogItem } from './types';

export const mascotCatalog: MascotCatalogItem[] = [
  {
    id: 'pirate-hat',
    price: 300,
    slot: 'head',
  },
  {
    id: 'bandanna',
    price: 200,
    slot: 'head',
  },
  {
    id: 'glasses',
    price: 250,
    slot: 'eyes',
  },
  {
    id: 'eye-patch',
    price: 350,
    slot: 'eyes',
  },
];

export function getMascotCatalogItem(
  itemId: string,
): MascotCatalogItem | undefined {
  return mascotCatalog.find((item) => item.id === itemId);
}
