import { Injectable, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class OwnersService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

  constructor(private dataSource: DataSource) {}

  async getProfile(userId: string) {
    const rows = await this.dataSource.query(
      `SELECT o.*, u.phone, u.email FROM owners o JOIN users u ON u.id = o.id WHERE o.id = $1`,
      [userId],
    );
    return rows[0] || null;
  }

  async register(userId: string, fullName: string, documentUrl?: string) {
    const existing = await this.dataSource.query(
      `SELECT id FROM owners WHERE id = $1`, [userId],
    );
    if (existing[0]) throw new ConflictException('Already registered as an owner');

    await this.dataSource.query(
      `INSERT INTO owners (id, full_name, id_document_url) VALUES ($1, $2, $3)`,
      [userId, fullName, documentUrl || null],
    );
    // Update role in users table and Supabase user_metadata
    await this.dataSource.query(
      `UPDATE users SET role = 'owner' WHERE id = $1`, [userId],
    );
    await this.supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: 'owner' },
    });

    return { success: true, message: 'Registration submitted. Verification pending.' };
  }
}
