import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreatePropertyDto } from './dto/create-property.dto';
import { SearchPropertyDto } from './dto/search-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private dataSource: DataSource) {}

  async search(query: SearchPropertyDto) {
    const conditions: string[] = [
      'p.is_active = true',
      'p.is_verified = true',
      // Hide properties whose buffer is exhausted AND wallet is empty (W3)
      'NOT (o.wallet_balance = 0 AND p.buffer_leads_used >= 3)',
    ];
    const params: any[] = [];
    let i = 1;

    if (query.city) { conditions.push(`p.city ILIKE $${i++}`); params.push(`%${query.city}%`); }
    if (query.location_tier) { conditions.push(`p.location_tier = $${i++}`); params.push(query.location_tier); }
    if (query.property_type) { conditions.push(`p.property_type = $${i++}`); params.push(query.property_type); }
    if (query.rera_status) { conditions.push(`p.rera_status = $${i++}`); params.push(query.rera_status); }
    if (query.min_price) { conditions.push(`p.price_value >= $${i++}`); params.push(query.min_price); }
    if (query.max_price) { conditions.push(`p.price_value <= $${i++}`); params.push(query.max_price); }

    const limit = query.limit || 20;
    const offset = ((query.page || 1) - 1) * limit;

    const countSql = `
      SELECT COUNT(*) FROM properties p
      JOIN owners o ON o.id = p.owner_id
      WHERE ${conditions.join(' AND ')}
    `;
    const dataSql = `
      SELECT p.id, p.title, p.city, p.state, p.location_tier, p.property_type,
             p.rera_status, p.price_value, p.buffer_leads_used, p.created_at,
             cover.url AS cover_image
      FROM properties p
      JOIN owners o ON o.id = p.owner_id
      LEFT JOIN LATERAL (
        SELECT url FROM property_media pm
        WHERE pm.property_id = p.id AND pm.type = 'image'
        ORDER BY pm.sort_order ASC
        LIMIT 1
      ) cover ON true
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `;
    params.push(limit, offset);
    const [rows, countRows] = await Promise.all([
      this.dataSource.query(dataSql, params),
      this.dataSource.query(countSql, params.slice(0, params.length - 2)),
    ]);
    return { data: rows, total: parseInt(countRows[0].count), page: query.page || 1, limit };
  }

  async findOne(id: string) {
    const rows = await this.dataSource.query(
      `SELECT p.*, o.full_name as owner_name,
              json_agg(pm ORDER BY pm.sort_order) FILTER (WHERE pm.id IS NOT NULL) as media
       FROM properties p
       JOIN owners o ON o.id = p.owner_id
       LEFT JOIN property_media pm ON pm.property_id = p.id
       WHERE p.id = $1 AND p.is_active = true
       GROUP BY p.id, o.full_name`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException('Property not found');
    return rows[0];
  }

  async create(userId: string, dto: CreatePropertyDto) {
    const result = await this.dataSource.query(
      `INSERT INTO properties (owner_id, title, description, location_address, location_tier, city, state, property_type, rera_status, rera_number, price_value, daily_lead_cap)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [userId, dto.title, dto.description, dto.location_address, dto.location_tier, dto.city, dto.state, dto.property_type, dto.rera_status, dto.rera_number, dto.price_value, dto.daily_lead_cap || 10],
    );
    return result[0];
  }

  async update(id: string, userId: string, dto: Partial<CreatePropertyDto>) {
    const property = await this.dataSource.query(
      `SELECT id FROM properties WHERE id = $1 AND owner_id = $2`, [id, userId],
    );
    if (!property[0]) throw new ForbiddenException('Property not found or not yours');
    const fields = Object.entries(dto).map(([k, _], i) => `${k} = $${i + 3}`).join(', ');
    const values = Object.values(dto);
    await this.dataSource.query(
      `UPDATE properties SET ${fields}, updated_at = NOW() WHERE id = $1 AND owner_id = $2`,
      [id, userId, ...values],
    );
    return this.findOne(id);
  }

  async remove(id: string, userId: string) {
    await this.dataSource.query(
      `UPDATE properties SET is_active = false WHERE id = $1 AND owner_id = $2`, [id, userId],
    );
    return { success: true };
  }

  async findByOwner(userId: string) {
    return this.dataSource.query(
      `SELECT p.*
       FROM properties p
       WHERE p.owner_id = $1
       ORDER BY p.created_at DESC`,
      [userId],
    );
  }

  async addMedia(propertyId: string, ownerId: string, media: { type: string; url: string; sort_order: number }[]) {
    const property = await this.dataSource.query(
      `SELECT id FROM properties WHERE id = $1 AND owner_id = $2`, [propertyId, ownerId],
    );
    if (!property[0]) throw new ForbiddenException('Property not found or not yours');
    for (const m of media) {
      await this.dataSource.query(
        `INSERT INTO property_media (property_id, type, url, sort_order) VALUES ($1, $2, $3, $4)`,
        [propertyId, m.type, m.url, m.sort_order],
      );
    }
    return { success: true };
  }
}
