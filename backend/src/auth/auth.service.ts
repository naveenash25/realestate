import {
  Inject,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { OtpService } from './otp.service';
import { SessionService } from './session.service';
import {
  IDENTITY_BROKER_PROVIDER,
  type IdentityBrokerProvider,
} from './interfaces/identity-broker.interface';

const OAUTH_STATE_TTL_SECONDS = 5 * 60;
const HANDOFF_CODE_TTL_SECONDS = 60;

@Injectable()
export class AuthService {
  private redis = new Redis(process.env.REDIS_URL!);

  constructor(
    private dataSource: DataSource,
    private otpService: OtpService,
    private sessionService: SessionService,
    @Inject(IDENTITY_BROKER_PROVIDER)
    private identityBroker: IdentityBrokerProvider,
  ) {}

  private get googleRedirectUri() {
    return `${process.env.BACKEND_URL}/api/v1/auth/google/callback`;
  }

  async googleAuthorizationUrl(redirect: string): Promise<string> {
    const state = randomBytes(16).toString('hex');
    await this.redis.set(
      `oauth:state:${state}`,
      JSON.stringify({ redirect }),
      'EX',
      OAUTH_STATE_TTL_SECONDS,
    );
    return this.identityBroker.getAuthorizationUrl({
      state,
      redirectUri: this.googleRedirectUri,
    });
  }

  async googleCallback(code: string, state: string): Promise<string> {
    const stateRaw = await this.redis.get(`oauth:state:${state}`);
    if (!stateRaw)
      throw new UnauthorizedException('Invalid or expired login attempt');
    await this.redis.del(`oauth:state:${state}`);
    const { redirect } = JSON.parse(stateRaw) as { redirect: string };

    const identity = await this.identityBroker.exchangeCodeForIdentity({
      code,
      redirectUri: this.googleRedirectUri,
    });
    const user = await this.upsertGoogleUser(
      identity.providerUserId,
      identity.email,
    );
    const accessToken = this.sessionService.mint({
      sub: user.id,
      role: user.role,
      email: identity.email,
    });

    const handoffCode = randomBytes(24).toString('hex');
    await this.redis.set(
      `auth:handoff:${handoffCode}`,
      JSON.stringify({ access_token: accessToken, role: user.role }),
      'EX',
      HANDOFF_CODE_TTL_SECONDS,
    );

    const frontendUrl = new URL('/auth/callback', process.env.FRONTEND_URL);
    frontendUrl.searchParams.set('code', handoffCode);
    frontendUrl.searchParams.set('next', redirect || '/');
    return frontendUrl.toString();
  }

  async exchangeSession(code: string) {
    const raw = await this.redis.get(`auth:handoff:${code}`);
    if (!raw)
      throw new UnauthorizedException('Invalid or expired login handoff');
    await this.redis.del(`auth:handoff:${code}`);
    return JSON.parse(raw) as { access_token: string; role: string };
  }

  async sendOtp(phone: string) {
    if (!phone) throw new BadRequestException('Phone number is required');
    await this.otpService.send(phone);
    return { message: 'OTP sent' };
  }

  async verifyOtp(phone: string, code: string) {
    const ok = await this.otpService.verify(phone, code);
    if (!ok) throw new UnauthorizedException('Invalid or expired OTP');

    const user = await this.upsertUserByPhone(phone);
    const accessToken = this.sessionService.mint({
      sub: user.id,
      role: user.role,
      phone,
    });
    return { access_token: accessToken, role: user.role };
  }

  private async upsertUserByPhone(
    phone: string,
  ): Promise<{ id: string; role: string }> {
    const existing = await this.dataSource.query(
      `SELECT id, role FROM users WHERE phone = $1`,
      [phone],
    );
    if (existing[0]) return existing[0];

    const inserted = await this.dataSource.query(
      `INSERT INTO users (id, phone, role) VALUES (gen_random_uuid(), $1, 'buyer')
       RETURNING id, role`,
      [phone],
    );
    return inserted[0];
  }

  private async upsertGoogleUser(
    googleId: string,
    email?: string,
  ): Promise<{ id: string; role: string }> {
    const existing = await this.dataSource.query(
      `SELECT id, role FROM users WHERE google_id = $1 OR email = $2`,
      [googleId, email || null],
    );
    if (existing[0]) {
      await this.dataSource.query(
        `UPDATE users SET google_id = $1 WHERE id = $2 AND google_id IS DISTINCT FROM $1`,
        [googleId, existing[0].id],
      );
      return existing[0];
    }

    const inserted = await this.dataSource.query(
      `INSERT INTO users (id, email, google_id, role) VALUES (gen_random_uuid(), $1, $2, 'buyer')
       RETURNING id, role`,
      [email || null, googleId],
    );
    return inserted[0];
  }
}
