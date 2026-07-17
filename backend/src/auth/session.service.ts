import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface SessionClaims {
  sub: string;
  role: string;
  phone?: string;
  email?: string;
}

@Injectable()
export class SessionService {
  constructor(private jwt: JwtService) {}

  mint(claims: SessionClaims): string {
    const ttlSeconds =
      Number(process.env.SESSION_JWT_TTL_SECONDS) || 7 * 24 * 60 * 60;
    return this.jwt.sign(claims, {
      secret: process.env.SESSION_JWT_SECRET,
      expiresIn: ttlSeconds,
      issuer: 'realestate-api',
      audience: 'realestate-app',
    });
  }
}
