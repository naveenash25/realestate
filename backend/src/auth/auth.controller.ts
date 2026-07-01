import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  sendOtp(@Body('phone') phone: string) {
    return this.authService.sendOtp(phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body('phone') phone: string, @Body('token') token: string) {
    return this.authService.verifyOtp(phone, token);
  }

  @Post('google')
  googleCallback(@Body('access_token') accessToken: string) {
    return this.authService.googleCallback(accessToken);
  }
}
