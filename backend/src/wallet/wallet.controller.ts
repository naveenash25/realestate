import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Headers,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getWallet(@Request() req: any) {
    return this.walletService.getWallet(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('recharge')
  initiateRecharge(@Request() req: any, @Body('amount') amount: number) {
    return this.walletService.initiateRecharge(req.user.id, amount);
  }

  // Razorpay webhook — no auth guard, verified by signature
  @Post('webhook')
  razorpayWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: RawBodyRequest<any>,
  ) {
    return this.walletService.handleWebhook(signature, req.rawBody);
  }
}
