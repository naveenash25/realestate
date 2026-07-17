export interface OtpSenderProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}

export const OTP_SENDER_PROVIDER = 'OTP_SENDER_PROVIDER';
