import { Controller, Post, Body, Get } from '@nestjs/common';
import { HttpCode, Param, Res } from '@nestjs/common/decorators';
import { HttpStatus } from '@nestjs/common/enums';
import { ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from '../../dto';

import { RegisterUserDto } from '../../dto';
import { UserDetails } from '../user/user.interface';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerUser(
    @Body() user: RegisterUserDto,
  ): Promise<UserDetails | { ERROR: string }> {
    return this.authService.registerUser(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  loginUser(
    @Body() user: LoginUserDto,
  ): Promise<
    { token: string; name: string; email: string } | { ERROR: string }
  > {
    return this.authService.loginUser(user);
  }

  @Get('verify/:token')
  async verifyUser(
    @Res() res,
    @Param('token') token: string,
  ): Promise<void | { ERROR: string }> {
    const result = await this.authService.verifyUser(token);
    if (result?.ERROR) return { ERROR: result.ERROR };
    res.redirect(
      process.env.CLIENT_HOST
        ? process.env.CLIENT_HOST + '/signin'
        : 'http://localhost:4000/signin',
    );
  }
}
