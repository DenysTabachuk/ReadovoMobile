import { Body, Controller, Logger, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { type LoginUserDto } from './dto/login-user.dto';
import { type RegisterUserDto } from './dto/register-user.dto';
import { type LoginUserResponse, type RegisterUserResponse } from './types';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto): Promise<LoginUserResponse> {
    return this.authService.login(loginUserDto);
  }

  @Post('register')
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<RegisterUserResponse> {
    const response = await this.authService.register(registerUserDto);

    this.logger.log(`Register response: ${JSON.stringify(response)}`);

    return response;
  }
}
