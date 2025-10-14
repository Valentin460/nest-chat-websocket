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
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

interface ConnectedUser {
  id: number;
  username: string;
  email: string;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, ConnectedUser> = new Map();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        client.disconnect();
        return;
      }

      const connectedUser: ConnectedUser = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      this.connectedUsers.set(client.id, connectedUser);
      client.join('general');

      this.server.to('general').emit('userJoined', {
        username: user.username,
        message: `${user.username} a rejoint le chat`,
        timestamp: new Date().toISOString(),
      });

      this.server.to('general').emit('connectedUsers', 
        Array.from(this.connectedUsers.values())
      );

      console.log(`User ${user.username} connected to chat`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      this.connectedUsers.delete(client.id);
      
      this.server.to('general').emit('userLeft', {
        username: user.username,
        message: `${user.username} a quitté le chat`,
        timestamp: new Date().toISOString(),
      });

      this.server.to('general').emit('connectedUsers', 
        Array.from(this.connectedUsers.values())
      );

      console.log(`User ${user.username} disconnected from chat`);
    }
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const messageData = {
      id: Date.now(),
      username: user.username,
      message: data.message,
      timestamp: new Date().toISOString(),
    };

    this.server.to('general').emit('newMessage', messageData);
  }

  @SubscribeMessage('getConnectedUsers')
  handleGetConnectedUsers(@ConnectedSocket() client: Socket) {
    client.emit('connectedUsers', Array.from(this.connectedUsers.values()));
  }
}
