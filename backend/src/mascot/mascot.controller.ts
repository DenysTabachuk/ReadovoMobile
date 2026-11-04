import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { ApiUserAuth } from '../auth/api-user-auth.decorator';
import { ClearMascotSlotParamsDto } from './dto/clear-mascot-slot-params.dto';
import { MascotItemParamsDto } from './dto/mascot-item-params.dto';
import { GetMascotProfileResponseDto } from './dto/get-mascot-profile-response.dto';
import { MASCOT_ERRORS } from './mascot-errors';
import { MascotService } from './mascot.service';
import { type MascotProfileResponse } from './types';

@Controller('mascot')
@ApiTags('mascot')
export class MascotController {
  constructor(private readonly mascotService: MascotService) {}

  @Get('profile/me')
  @ApiOperation({
    operationId: 'getMascotProfile',
    summary: 'Read the authenticated user’s mascot profile',
  })
  @ApiOkResponse({ type: GetMascotProfileResponseDto })
  @ApiUserAuth({ errors: [MASCOT_ERRORS.USER_NOT_FOUND] })
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.getProfile(user.id);
  }

  @Post('profile/me/items/:itemId/buy')
  @ApiOperation({
    operationId: 'buyMascotItem',
    summary: 'Buy a mascot catalog item',
  })
  @ApiCreatedResponse({ type: GetMascotProfileResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [
      MASCOT_ERRORS.ITEM_UNKNOWN,
      MASCOT_ERRORS.NOT_ENOUGH_COINS,
      MASCOT_ERRORS.USER_NOT_FOUND,
    ],
  })
  async buyItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { itemId }: MascotItemParamsDto,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.buyItem(user.id, itemId);
  }

  @Post('profile/me/items/:itemId/equip')
  @ApiOperation({
    operationId: 'equipMascotItem',
    summary: 'Equip an owned mascot item',
  })
  @ApiCreatedResponse({ type: GetMascotProfileResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [
      MASCOT_ERRORS.ITEM_UNKNOWN,
      MASCOT_ERRORS.ITEM_NOT_OWNED,
      MASCOT_ERRORS.USER_NOT_FOUND,
    ],
  })
  async equipItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { itemId }: MascotItemParamsDto,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.equipItem(user.id, itemId);
  }

  @Delete('profile/me/slots/:slot')
  @ApiOperation({
    operationId: 'clearMascotSlot',
    summary: 'Clear one mascot accessory slot',
  })
  @ApiOkResponse({ type: GetMascotProfileResponseDto })
  @ApiUserAuth({ validation: true, errors: [MASCOT_ERRORS.USER_NOT_FOUND] })
  async clearSlot(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { slot }: ClearMascotSlotParamsDto,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.clearSlot(user.id, slot);
  }

  @Delete('profile/me/slots')
  @ApiOperation({
    operationId: 'clearAllMascotSlots',
    summary: 'Clear all mascot accessory slots',
  })
  @ApiOkResponse({ type: GetMascotProfileResponseDto })
  @ApiUserAuth({ errors: [MASCOT_ERRORS.USER_NOT_FOUND] })
  async clearAllSlots(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.clearAllSlots(user.id);
  }
}
