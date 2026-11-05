export { Mascot } from './components/mascot';
export {
  getMascotCatalogItem,
  getMascotItemsBySlot,
  mascotAccessorySlots,
} from './catalog';
export type {
  MascotAccessorySlot,
  MascotCatalogItem,
  MascotEquippedItems,
  MascotProfile,
} from './types';

export { getMascotErrorMessageKey } from './utils/getMascotErrorMessageKey';
export { useMascotProfileQuery } from './api';
export { useBuyMascotMutation } from './api';
export { useEquipMascotMutation } from './api';
export { useClearMascotMutation } from './api';
export { useClearAllMascotSlotsMutation } from './api';
