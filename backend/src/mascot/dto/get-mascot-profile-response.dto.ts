import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

/** Empty slots are omitted from JSON, rather than serialized as null. */
@ApiSchema({ name: 'MascotEquippedItems' })
export class MascotEquippedItemsDto {
  @ApiPropertyOptional({ type: String })
  eyes?: string;

  @ApiPropertyOptional({ type: String })
  head?: string;
}

/** Shared serialized profile returned by reads, purchases and equipment changes. */
@ApiSchema({ name: 'MascotProfileResponse' })
export class GetMascotProfileResponseDto {
  @ApiProperty({ type: MascotEquippedItemsDto })
  declare equippedItems: MascotEquippedItemsDto;

  @ApiProperty({ type: [String] })
  declare ownedItemIds: string[];

  @ApiProperty({ type: String })
  declare userId: string;
}
