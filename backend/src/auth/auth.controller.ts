import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  async googleLogin(@Query('redirect') redirect: string, @Res() res: Response) {
    const url = await this.authService.googleAuthorizationUrl(redirect || '/');
    return res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const url = await this.authService.googleCallback(code, state);
    return res.redirect(url);
  }

  @Post('otp/send')
  sendOtp(@Body('phone') phone: string) {
    return this.authService.sendOtp(phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body('phone') phone: string, @Body('code') code: string) {
    return this.authService.verifyOtp(phone, code);
  }

  @Post('session/exchange')
  exchangeSession(@Body('code') code: string) {
    return this.authService.exchangeSession(code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    return req.user;
  }
}
