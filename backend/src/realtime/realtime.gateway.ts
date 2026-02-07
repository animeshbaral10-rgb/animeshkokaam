import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Extend Socket interface to include userId for authenticated connections
interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8001',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (token) {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
        });
        client.userId = payload.sub;
        client.join(`user:${client.userId}`);
        console.log(`Client connected: ${client.userId}`);
      } else {
        client.disconnect();
      }
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.userId}`);
  }

  /**
   * Broadcast location update to user's room
   */
  broadcastLocationUpdate(userId: string, locationData: any) {
    if (!this.server) return;
    try {
      this.server.to(`user:${userId}`).emit('location_update', locationData);
    } catch (_) {
      // ignore broadcast errors
    }
  }

  /**
   * Broadcast new alert to user's room
   */
  broadcastAlert(userId: string, alertData: any) {
    this.server.to(`user:${userId}`).emit('alert:new', alertData);
  }

  /**
   * Broadcast unread alert count to user's room
   */
  broadcastUnreadCount(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit('alert:unread_count', { count });
  }

  /**
   * Broadcast device status update
   */
  broadcastDeviceUpdate(userId: string, deviceData: any) {
    this.server.to(`user:${userId}`).emit('device_update', deviceData);
  }

  /**
   * Subscribe to pet location updates
   */
  @SubscribeMessage('subscribe_pet_location')
  handleSubscribePetLocation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { petId: string },
  ) {
    if (client.userId) {
      client.join(`pet:${data.petId}`);
      return { event: 'subscribed', petId: data.petId };
    }
  }

  /**
   * Unsubscribe from pet location updates
   */
  @SubscribeMessage('unsubscribe_pet_location')
  handleUnsubscribePetLocation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { petId: string },
  ) {
    if (client.userId) {
      client.leave(`pet:${data.petId}`);
      return { event: 'unsubscribed', petId: data.petId };
    }
  }
}







