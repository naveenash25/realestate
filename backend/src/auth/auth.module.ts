import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { OtpService } from './otp.service';
import { SessionService } from './session.service';
import { IDENTITY_BROKER_PROVIDER } from './interfaces/identity-broker.interface';
import { OTP_SENDER_PROVIDER } from './interfaces/otp-sender.interface';
import { KeycloakIdentityBrokerProvider } from './providers/keycloak-identity-broker.provider';
import { TwilioOtpSenderProvider } from './providers/twilio-otp-sender.provider';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    OtpService,
    SessionService,
    {
      provide: IDENTITY_BROKER_PROVIDER,
      useClass: KeycloakIdentityBrokerProvider,
    },
    { provide: OTP_SENDER_PROVIDER, useClass: TwilioOtpSenderProvider },
  ],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
