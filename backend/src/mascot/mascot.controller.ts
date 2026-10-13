import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UserAuthGuard } from '../auth/user-auth.guard';
import {
  UserAndItemIdParamsDto,
  UserIdParamsDto,
} from '../common/validation/request.dto';
import { ClearMascotSlotParamsDto } from './dto';
import { MascotService } from './mascot.service';
import { type MascotProfileResponse } from './types';

@Controller('mascot')
@UseGuards(UserAuthGuard)
export class MascotController {
  constructor(private readonly mascotService: MascotService) {}

  @Get('profile/:userId')
  async getProfile(
    @Param() { userId }: UserIdParamsDto,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.getProfile(userId);
  }

  @Post('profile/:userId/items/:itemId/buy')
  async buyItem(
    @Param() { itemId, userId }: UserAndItemIdParamsDto,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.buyItem(userId, itemId);
  }

  @Post('profile/:userId/items/:itemId/equip')
  async equipItem(
    @Param() { itemId, userId }: UserAndItemIdParamsDto,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.equipItem(userId, itemId);
  }

  @Delete('profile/:userId/slots/:slot')
  async clearSlot(
    @Param() { slot, userId }: ClearMascotSlotParamsDto,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.clearSlot(userId, slot);
  }
}
