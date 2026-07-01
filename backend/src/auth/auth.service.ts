import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

  constructor(private dataSource: DataSource) {}

  async sendOtp(phone: string) {
    const { error } = await this.supabase.auth.signInWithOtp({ phone });
    if (error) throw new UnauthorizedException(error.message);
    return { message: 'OTP sent' };
  }

  async verifyOtp(phone: string, token: string) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) throw new UnauthorizedException(error.message);
    const user = data.user!;
    const role = await this.upsertUser({ id: user.id, phone: user.phone });
    // Stamp role into Supabase user_metadata so JWT carries it
    await this.supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { role },
    });
    return { access_token: data.session?.access_token, role };
  }

  async googleCallback(accessToken: string) {
    const { data, error } = await this.supabase.auth.getUser(accessToken);
    if (error) throw new UnauthorizedException(error.message);
    const user = data.user!;
    const role = await this.upsertUser({ id: user.id, email: user.email });
    await this.supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { role },
    });
    return { user: data.user, access_token: accessToken, role };
  }

  // Upsert user row; return their current role (preserves existing role on re-login)
  async upsertUser(params: { id: string; phone?: string; email?: string }): Promise<string> {
    const existing = await this.dataSource.query(
      `SELECT role FROM users WHERE id = $1`, [params.id],
    );
    if (existing[0]) return existing[0].role;

    await this.dataSource.query(
      `INSERT INTO users (id, phone, email, role) VALUES ($1, $2, $3, 'buyer')
       ON CONFLICT (id) DO NOTHING`,
      [params.id, params.phone || null, params.email || null],
    );
    return 'buyer';
  }
}
