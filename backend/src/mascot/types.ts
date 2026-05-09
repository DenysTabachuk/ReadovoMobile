export type MascotAccessorySlot = 'eyes' | 'head';

export type MascotEquippedItems = Partial<Record<MascotAccessorySlot, string>>;

export type MascotProfileResponse = {
  equippedItems: MascotEquippedItems;
  ownedItemIds: string[];
  userId: string;
};

export type MascotCatalogItem = {
  id: string;
  price: number;
  slot: MascotAccessorySlot;
};
