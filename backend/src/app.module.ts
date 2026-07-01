import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { WalletModule } from './wallet/wallet.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { PricingModule } from './pricing/pricing.module';
import { AdminModule } from './admin/admin.module';
import { OwnersModule } from './owners/owners.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false, // use migrations in all environments
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    PropertiesModule,
    EnquiriesModule,
    WalletModule,
    NotificationsModule,
    RealtimeModule,
    PricingModule,
    AdminModule,
    OwnersModule,
  ],
})
export class AppModule {}
