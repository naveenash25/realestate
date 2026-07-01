import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DataSource } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private dataSource: DataSource) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SUPABASE_JWT_SECRET!,
    });
  }

  async validate(payload: { sub: string; phone?: string; email?: string }) {
    // Always read role from DB — never trust JWT claim alone
    const rows = await this.dataSource.query(
      `SELECT role FROM users WHERE id = $1`, [payload.sub],
    );

    if (!rows[0]) {
      // Lazy upsert: user authenticated via Supabase but DB row not yet created
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
