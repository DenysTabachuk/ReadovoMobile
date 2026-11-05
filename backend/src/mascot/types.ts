import { MASCOT_ACCESSORY_SLOTS } from './constants';

export type MascotAccessorySlot = (typeof MASCOT_ACCESSORY_SLOTS)[number];

export type { GetMascotProfileResponseDto as MascotProfileResponse } from './dto/get-mascot-profile-response.dto';

export type MascotCatalogItem = {
  id: string;
  price: number;
  slot: MascotAccessorySlot;
};
