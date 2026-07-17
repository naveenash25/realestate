import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsListener {
  constructor(private notificationsService: NotificationsService) {}

  @OnEvent('lead.created')
  async handleLeadCreated(payload: {
    enquiry: any;
    owner_id: string;
    buyer_name: string;
    buyer_phone: string;
  }) {
    await this.notificationsService.sendLeadNotification(payload);
  }
}
