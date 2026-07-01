import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createClient } from '@supabase/supabase-js';
import { CreatePropertyDto } from '../properties/dto/create-property.dto';

@Injectable()
export class AdminService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

  constructor(private dataSource: DataSource) {}

  getPendingOwners() {
    return this.dataSource.query(
      `SELECT o.*, u.phone, u.email FROM owners o JOIN users u ON u.id = o.id WHERE o.is_verified = false ORDER BY o.created_at`,
    );
  }

  async verifyOwner(id: string, approve: boolean) {
    await this.dataSource.query(
      `UPDATE owners SET is_verified = $1, verified_at = NOW() WHERE id = $2`,
      [approve, id],
    );
    if (approve) {
      // Activate all pending properties for this owner
      await this.dataSource.query(
        `UPDATE properties SET is_verified = true WHERE owner_id = $1`, [id],
      );
    }
    return { success: true };
  }

  getPricingMatrix() {
    return this.dataSource.query(`SELECT * FROM lead_pricing ORDER BY location_tier, property_type, rera_status`);
  }

  async updatePrice(id: string, price: number) {
    await this.dataSource.query(
      `UPDATE lead_pricing SET price = $1, updated_at = NOW() WHERE id = $2`, [price, id],
    );
    return { success: true };
  }

  async mtRegisterOwner(params: { full_name: string; phone: string; id_document_url?: string }) {
    const phone = params.phone.startsWith('+') ? params.phone : `+91${params.phone}`;

    // Create Supabase auth user with confirmed phone (skip OTP for MT-registered owners)
    const { data: authUser, error } = await this.supabase.auth.admin.createUser({
      phone,
      phone_confirm: true,
      user_metadata: { role: 'owner' },
    });
    if (error) throw new ConflictException(error.message);

    const userId = authUser.user.id;

    // Upsert into users table
    await this.dataSource.query(
      `INSERT INTO users (id, phone, role) VALUES ($1, $2, 'owner')
       ON CONFLICT (id) DO UPDATE SET role = 'owner'`,
      [userId, phone],
    );

    // Create owner record
    const existing = await this.dataSource.query(`SELECT id FROM owners WHERE id = $1`, [userId]);
    if (existing[0]) throw new ConflictException('Owner already registered with this phone number');

    await this.dataSource.query(
      `INSERT INTO owners (id, full_name, id_document_url, is_verified) VALUES ($1, $2, $3, false)`,
      [userId, params.full_name, params.id_document_url || null],
    );

    return { success: true, owner_id: userId, message: 'Owner registered. They can login with OTP using their phone number.' };
  }

  async mtCreateProperty(ownerId: string, dto: CreatePropertyDto) {
    const owner = await this.dataSource.query(`SELECT id FROM owners WHERE id = $1`, [ownerId]);
    if (!owner[0]) throw new NotFoundException('Owner not found');

    const result = await this.dataSource.query(
      `INSERT INTO properties (owner_id, title, description, location_address, location_tier, city, state, property_type, rera_status, rera_number, price_value, daily_lead_cap)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [ownerId, dto.title, dto.description, dto.location_address, dto.location_tier, dto.city, dto.state, dto.property_type, dto.rera_status, dto.rera_number, dto.price_value, dto.daily_lead_cap || 10],
    );
    return result[0];
  }

  async mtListOwners() {
    return this.dataSource.query(
      `SELECT o.id, o.full_name, o.is_verified, o.wallet_balance, o.created_at,
              u.phone, u.email,
              COUNT(p.id)::int as property_count
       FROM owners o
       JOIN users u ON u.id = o.id
       LEFT JOIN properties p ON p.owner_id = o.id AND p.is_active = true
       GROUP BY o.id, u.phone, u.email
       ORDER BY o.created_at DESC`,
    );
  }

  async getStats() {
    const [properties, enquiries, owners, revenue] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) FROM properties WHERE is_active = true`),
      this.dataSource.query(`SELECT COUNT(*) FROM enquiries`),
      this.dataSource.query(`SELECT COUNT(*) FROM owners WHERE is_verified = true`),
      this.dataSource.query(`SELECT COALESCE(SUM(amount),0) as total FROM wallet_transactions WHERE type = 'credit'`),
    ]);
    return {
      active_properties: parseInt(properties[0].count),
      total_enquiries: parseInt(enquiries[0].count),
      verified_owners: parseInt(owners[0].count),
      total_revenue: parseFloat(revenue[0].total),
    };
  }
}
