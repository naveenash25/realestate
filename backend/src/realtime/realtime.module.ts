import { Module } from '@nestjs/common';
import { LeadsGateway } from './leads.gateway';
import { RealtimeListener } from './realtime.listener';

@Module({
  providers: [LeadsGateway, RealtimeListener],
  exports: [LeadsGateway],
})
export class RealtimeModule {}
