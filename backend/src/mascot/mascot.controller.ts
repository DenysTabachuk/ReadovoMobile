import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { ClearMascotSlotParamsDto, MascotItemParamsDto } from './dto';
import { MascotService } from './mascot.service';
import { type MascotProfileResponse } from './types';

@Controller('mascot')
@UseGuards(UserAuthGuard)
export class MascotController {
  constructor(private readonly mascotService: MascotService) {}

  @Get('profile/me')
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.getProfile(user.id);
  }

  @Post('profile/me/items/:itemId/buy')
  async buyItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { itemId }: MascotItemParamsDto,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.buyItem(user.id, itemId);
  }

  @Post('profile/me/items/:itemId/equip')
  async equipItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { itemId }: MascotItemParamsDto,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.equipItem(user.id, itemId);
  }

  @Delete('profile/me/slots/:slot')
  async clearSlot(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { slot }: ClearMascotSlotParamsDto,
  ): Promise<MascotProfileResponse> {
    return this.mascotService.clearSlot(user.id, slot);
  }
}
