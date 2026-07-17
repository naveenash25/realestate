import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import { OtpSenderProvider } from '../interfaces/otp-sender.interface';

@Injectable()
export class TwilioOtpSenderProvider implements OtpSenderProvider {
  private client?: Twilio;

  // Constructed lazily — Twilio's constructor throws synchronously on a malformed
  // account SID, which would otherwise crash Nest's eager DI instantiation at boot
  // whenever real credentials aren't configured yet (e.g. local dev placeholders).
  private getClient(): Twilio {
    if (!this.client) {
      this.client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
    return this.client;
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const contentSid = process.env.TWILIO_OTP_CONTENT_SID;
    await this.getClient().messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to: `whatsapp:${phone}`,
      ...(contentSid
        ? { contentSid, contentVariables: JSON.stringify({ '1': code }) }
        : {
            body: `Your RealEstate verification code is ${code}. It expires in 5 minutes.`,
          }),
    });
  }
}
