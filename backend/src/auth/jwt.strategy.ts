import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DataSource } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private dataSource: DataSource) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['HS256'],
      secretOrKey: process.env.SESSION_JWT_SECRET!,
      issuer: 'realestate-api',
      audience: 'realestate-app',
    });
  }

  async validate(payload: { sub: string; phone?: string; email?: string }) {
    // Always read role from DB — never trust JWT claim alone
    const rows = await this.dataSource.query(
      `SELECT role FROM users WHERE id = $1`,
      [payload.sub],
    );

    if (!rows[0]) {
      // Defensive fallback: session JWT issued but DB row missing somehow
      await this.dataSource.query(
        `INSERT INTO users (id, phone, email, role) VALUES ($1, $2, $3, 'buyer')
         ON CONFLICT (id) DO NOTHING`,
        [payload.sub, payload.phone || null, payload.email || null],
      );
    }

    return {
      id: payload.sub,
      role: rows[0]?.role ?? 'buyer',
      phone: payload.phone,
      email: payload.email,
    };
  }
}
