import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

const MIN_RECHARGE = 500;

@Injectable()
export class WalletService {
  private razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  constructor(private dataSource: DataSource) {}

  async getWallet(userId: string) {
    const rows = await this.dataSource.query(
      `SELECT o.wallet_balance,
              (SELECT json_agg(t ORDER BY t.created_at DESC)
               FROM wallet_transactions t WHERE t.owner_id = o.id LIMIT 50) as transactions
       FROM owners o WHERE o.id = $1`,
      [userId],
    );
    return rows[0];
  }

  async initiateRecharge(userId: string, amount: number) {
    if (amount < MIN_RECHARGE) {
      throw new BadRequestException(`Minimum recharge is ₹${MIN_RECHARGE}`);
    }
    const order = await this.razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `wallet_${userId}_${Date.now()}`,
    });
    return { order_id: order.id, amount, currency: 'INR' };
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest('hex');

    if (signature !== expected) throw new BadRequestException('Invalid webhook signature');

    const event = JSON.parse(rawBody.toString());
    if (event.event === 'payment.captured') {
      const { order_id, amount } = event.payload.payment.entity;
      const receipt: string = event.payload.payment.entity.order_receipt || '';
      const userId = receipt.split('_')[1];
      const creditAmount = amount / 100;

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.query(
          `UPDATE owners SET wallet_balance = wallet_balance + $1, buffer_leads_used = 0 WHERE id = $2`,
          [creditAmount, userId],
        );
        // Log reset of buffer on recharge — buffer_leads_used = 0 means new 3-lead cycle starts
        await queryRunner.query(
          `INSERT INTO wallet_transactions (owner_id, type, amount, balance_after, ref_razorpay_id, description)
           SELECT $1, 'credit', $2, wallet_balance, $3, 'Wallet recharge' FROM owners WHERE id = $1`,
          [userId, creditAmount, order_id],
        );
        await queryRunner.commitTransaction();
      } catch (e) {
        await queryRunner.rollbackTransaction();
        throw e;
      } finally {
        await queryRunner.release();
      }
    }
    return { received: true };
  }
}
