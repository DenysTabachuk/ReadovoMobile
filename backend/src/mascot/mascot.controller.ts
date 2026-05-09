import { Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { MascotService } from './mascot.service';
import { type MascotAccessorySlot, type MascotProfileResponse } from './types';

@Controller('mascot')
export class MascotController {
  constructor(private readonly mascotService: MascotService) {}

  @Get('profile/:userId')
  async getProfile(
    @Param('userId') userId: string,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.getProfile(userId);
  }

  @Post('profile/:userId/items/:itemId/buy')
  async buyItem(
    @Param('userId') userId: string,
    @Param('itemId') itemId: string,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.buyItem(userId, itemId);
  }

  @Post('profile/:userId/items/:itemId/equip')
  async equipItem(
    @Param('userId') userId: string,
    @Param('itemId') itemId: string,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.equipItem(userId, itemId);
  }

  @Delete('profile/:userId/slots/:slot')
  async clearSlot(
    @Param('userId') userId: string,
    @Param('slot') slot: MascotAccessorySlot,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.clearSlot(userId, slot);
  }
}
