import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
})
export class LeadsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LeadsGateway.name);

  handleConnection(client: Socket) {
    // Client sends { owner_id } after connecting to join their room
    client.on('join', (data: { owner_id: string }) => {
      client.join(`owner:${data.owner_id}`);
      this.logger.log(`Owner ${data.owner_id} joined realtime room`);
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  notifyOwner(ownerId: string, lead: any) {
    this.server.to(`owner:${ownerId}`).emit('new_lead', lead);
  }
}
