import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendLeadNotification(payload: {
    enquiry: any;
    owner_id: string;
    buyer_name: string;
    buyer_phone: string;
  }) {
    const message = `New lead! Buyer: ${payload.buyer_name}, Phone: ${payload.buyer_phone}. Login to your dashboard to view details.`;

    await Promise.allSettled([
      this.sendSms(payload.owner_id, message),
      this.sendWhatsApp(
        payload.owner_id,
        payload.buyer_name,
        payload.buyer_phone,
      ),
    ]);
  }

  private async sendSms(ownerId: string, message: string) {
    // Fetch owner phone from DB — simplified here
    try {
      await axios.post(
        'https://api.msg91.com/api/v5/flow/',
        {
          template_id: process.env.MSG91_TEMPLATE_ID_LEAD,
          sender: process.env.MSG91_SENDER_ID,
          // recipient filled at integration time
        },
        {
          headers: { authkey: process.env.MSG91_AUTH_KEY },
        },
      );
    } catch (err) {
      this.logger.error(`SMS failed for owner ${ownerId}`, err);
    }
  }

  private async sendWhatsApp(
    ownerId: string,
    buyerName: string,
    buyerPhone: string,
  ) {
    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          type: 'template',
          template: {
            name: 'lead_notification',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: buyerName },
                  { type: 'text', text: buyerPhone },
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_BUSINESS_TOKEN}`,
          },
        },
      );
    } catch (err) {
      this.logger.error(`WhatsApp failed for owner ${ownerId}`, err);
    }
  }
}
