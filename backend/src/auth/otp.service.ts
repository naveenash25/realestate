import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import {
  OTP_SENDER_PROVIDER,
  type OtpSenderProvider,
} from './interfaces/otp-sender.interface';

const OTP_TTL_SECONDS = 5 * 60;
const SEND_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_VERIFY_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  private redis = new Redis(process.env.REDIS_URL!);

  constructor(@Inject(OTP_SENDER_PROVIDER) private sender: OtpSenderProvider) {}

  async send(phone: string): Promise<void> {
    const rateLimitKey = `otp:rl:${phone}`;
    const sendCount = await this.redis.incr(rateLimitKey);
    if (sendCount === 1) {
      await this.redis.expire(rateLimitKey, SEND_RATE_LIMIT_WINDOW_SECONDS);
    }
    if (sendCount > MAX_SENDS_PER_WINDOW) {
      throw new BadRequestException(
        'Too many OTP requests. Please try again later.',
      );
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hash = await bcrypt.hash(code, 10);

    await this.redis.set(`otp:${phone}`, hash, 'EX', OTP_TTL_SECONDS);
    await this.redis.del(`otp:attempts:${phone}`);

    await this.sender.sendOtp(phone, code);
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const hash = await this.redis.get(`otp:${phone}`);
    if (!hash) return false;

    const attemptsKey = `otp:attempts:${phone}`;
    const attempts = await this.redis.incr(attemptsKey);
    await this.redis.expire(attemptsKey, OTP_TTL_SECONDS);
    if (attempts > MAX_VERIFY_ATTEMPTS) {
      await this.redis.del(`otp:${phone}`);
      return false;
    }

    const ok = await bcrypt.compare(code, hash);
    if (ok) {
      await this.redis.del(`otp:${phone}`);
      await this.redis.del(attemptsKey);
    }
    return ok;
  }
}
