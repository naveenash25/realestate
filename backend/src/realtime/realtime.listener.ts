import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LeadsGateway } from './leads.gateway';

@Injectable()
export class RealtimeListener {
  constructor(private leadsGateway: LeadsGateway) {}

  @OnEvent('lead.created')
  handleLeadCreated(payload: {
    enquiry: any;
    owner_id: string;
    buyer_name: string;
    buyer_phone: string;
  }) {
    this.leadsGateway.notifyOwner(payload.owner_id, {
      enquiry_id: payload.enquiry.id,
      buyer_name: payload.buyer_name,
      buyer_phone: payload.buyer_phone,
      property_id: payload.enquiry.property_id,
      created_at: payload.enquiry.created_at,
    });
  }
}
