import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

@Injectable()
export class EnquiriesService {
  constructor(
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(buyerId: string, dto: CreateEnquiryDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock owner row to prevent concurrent double-deductions
      const property = await queryRunner.query(
        `SELECT p.*, o.wallet_balance, o.id as owner_id, u.phone as owner_phone
         FROM properties p
         JOIN owners o ON o.id = p.owner_id
         JOIN users u ON u.id = o.id
         WHERE p.id = $1 AND p.is_active = true AND p.is_verified = true
         FOR UPDATE OF o`,
        [dto.property_id],
      );

      if (!property[0])
        throw new NotFoundException('Property not found or inactive');

      const {
        owner_id,
        wallet_balance,
        buffer_leads_used,
        daily_lead_cap,
        location_tier,
        property_type,
        rera_status,
        owner_phone,
      } = property[0];

      // Enforce wallet visibility rule: hidden when wallet=0 and buffer exhausted
      if (parseFloat(wallet_balance) === 0 && buffer_leads_used >= 3) {
        throw new BadRequestException(
          'This property is temporarily unavailable. Owner needs to recharge.',
        );
      }

      // Check daily cap using persistent counter table
      const capRow = await queryRunner.query(
        `SELECT leads_count FROM property_daily_leads
         WHERE property_id = $1 AND date = CURRENT_DATE`,
        [dto.property_id],
      );
      const todayCount = capRow[0]?.leads_count || 0;
      if (todayCount >= daily_lead_cap) {
        throw new BadRequestException(
          'Daily enquiry cap reached for this property. Try again tomorrow.',
        );
      }

      // Fetch lead price
      const pricing = await queryRunner.query(
        `SELECT price FROM lead_pricing
         WHERE location_tier = $1 AND property_type = $2 AND rera_status = $3`,
        [location_tier, property_type, rera_status],
      );
      if (!pricing[0])
        throw new BadRequestException(
          'Lead pricing not configured for this property type',
        );

      const leadPrice = parseFloat(pricing[0].price);
      const gst = parseFloat((leadPrice * 0.18).toFixed(2));
      const totalCharge = parseFloat((leadPrice + gst).toFixed(2));
      let isBufferLead = false;

      if (parseFloat(wallet_balance) >= totalCharge) {
        // Deduct from wallet
        await queryRunner.query(
          `UPDATE owners SET wallet_balance = wallet_balance - $1 WHERE id = $2`,
          [totalCharge, owner_id],
        );
        // Log wallet transaction
        await queryRunner.query(
          `INSERT INTO wallet_transactions (owner_id, type, amount, gst_amount, balance_after, description)
           SELECT $1, 'debit', $2, $3, wallet_balance, 'Lead charge' FROM owners WHERE id = $1`,
          [owner_id, leadPrice, gst],
        );
        // If wallet just hit 0, reset buffer so next cycle starts fresh (W5)
        await queryRunner.query(
          `UPDATE properties
           SET buffer_leads_used = CASE WHEN (SELECT wallet_balance FROM owners WHERE id = $2) = 0 THEN 0 ELSE buffer_leads_used END
           WHERE id = $1`,
          [dto.property_id, owner_id],
        );
      } else if (buffer_leads_used < 3) {
        // Use buffer lead (no charge)
        isBufferLead = true;
        await queryRunner.query(
          `UPDATE properties SET buffer_leads_used = buffer_leads_used + 1 WHERE id = $1`,
          [dto.property_id],
        );
      } else {
        throw new BadRequestException(
          'Wallet balance insufficient. Please recharge to receive leads.',
        );
      }

      // Upsert daily lead counter
      await queryRunner.query(
        `INSERT INTO property_daily_leads (property_id, date, leads_count)
         VALUES ($1, CURRENT_DATE, 1)
         ON CONFLICT (property_id, date) DO UPDATE SET leads_count = property_daily_leads.leads_count + 1`,
        [dto.property_id],
      );

      // Save enquiry
      const enquiry = await queryRunner.query(
        `INSERT INTO enquiries (property_id, owner_id, buyer_id, buyer_phone, buyer_name,
                                lead_price, gst_amount, total_charged, is_buffer_lead)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          dto.property_id,
          owner_id,
          buyerId,
          dto.buyer_phone,
          dto.buyer_name,
          leadPrice,
          gst,
          totalCharge,
          isBufferLead,
        ],
      );

      await queryRunner.commitTransaction();

      this.eventEmitter.emit('lead.created', {
        enquiry: enquiry[0],
        owner_id,
        buyer_name: dto.buyer_name,
        buyer_phone: dto.buyer_phone,
      });

      // Return owner_phone so buyer can see it after submitting (R1.5)
      return { success: true, enquiry: enquiry[0], owner_phone };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findByOwner(userId: string) {
    return this.dataSource.query(
      `SELECT e.*, p.title as property_title
       FROM enquiries e
       JOIN properties p ON p.id = e.property_id
       WHERE e.owner_id = $1
       ORDER BY e.created_at DESC`,
      [userId],
    );
  }
}
