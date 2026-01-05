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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';
import { ChatMessage } from './entities/chat-message.entity';

interface ConnectedUser {
  id: number;
  username: string;
  email: string;
}

interface MessageReaction {
  emoji: string;
  users: string[];
}

interface ChatMessageData {
  id: number;
  username: string;
  message: string;
  timestamp: string;
  reactions: Map<string, string[]>;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private typingUsers: Map<string, ConnectedUser> = new Map();
  private messageReactions: Map<number, Map<string, string[]>> = new Map();

  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    private jwtService: JwtService,
    private usersService: UsersService,
    private roomsService: RoomsService,
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

      const chatHistory = await this.chatMessageRepository.find({
        order: { createdAt: 'ASC' },
        take: 100,
      });

      const formattedHistory = await Promise.all(
        chatHistory.map(async (msg) => {
          const msgUser = await this.usersService.findById(msg.userId);
          return {
            id: msg.id,
            username: msg.username,
            message: msg.message,
            timestamp: msg.createdAt.toISOString(),
            reactions: msg.reactions || {},
            displayColor: msgUser?.displayColor || null,
          };
        })
      );

      client.emit('chatHistory', formattedHistory);

      console.log(`Utilisateur ${user.username} connecté au chat - ${chatHistory.length} messages d'historique envoyés`);
    } catch (error) {
      console.error('Erreur de connexion:', error);
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

      console.log(`Utilisateur ${user.username} déconnecté du chat`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    try {
      const fullUser = await this.usersService.findById(user.id);
      
      const savedMessage = await this.chatMessageRepository.save({
        userId: user.id,
        username: user.username,
        message: data.message,
        reactions: {},
      });

      const messageData = {
        id: savedMessage.id,
        username: user.username,
        message: data.message,
        timestamp: savedMessage.createdAt.toISOString(),
        displayColor: fullUser?.displayColor || null,
      };

      this.server.to('general').emit('newMessage', messageData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du message:', error);
    }
  }

  @SubscribeMessage('getConnectedUsers')
  handleGetConnectedUsers(@ConnectedSocket() client: Socket) {
    client.emit('connectedUsers', Array.from(this.connectedUsers.values()));
  }

  @SubscribeMessage('startTyping')
  handleStartTyping(
    @MessageBody() data: { roomId?: number | null },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    this.typingUsers.set(client.id, user);
    
    const typingUsernames = Array.from(this.typingUsers.values()).map(u => u.username);
    
    if (data.roomId) {
      this.server.to(`room-${data.roomId}`).emit('typingUsers', typingUsernames);
    } else {
      this.server.to('general').emit('typingUsers', typingUsernames);
    }
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() data: { roomId?: number | null },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    this.typingUsers.delete(client.id);
    
    const typingUsernames = Array.from(this.typingUsers.values()).map(u => u.username);
    
    if (data.roomId) {
      this.server.to(`room-${data.roomId}`).emit('typingUsers', typingUsernames);
    } else {
      this.server.to('general').emit('typingUsers', typingUsernames);
    }
  }

  @SubscribeMessage('addReaction')
  handleAddReaction(
    @MessageBody() data: { messageId: number; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const { messageId, emoji } = data;

    if (!this.messageReactions.has(messageId)) {
      this.messageReactions.set(messageId, new Map());
    }

    const reactions = this.messageReactions.get(messageId)!;

    if (!reactions.has(emoji)) {
      reactions.set(emoji, []);
    }

    const users = reactions.get(emoji)!;

    if (!users.includes(user.username)) {
      users.push(user.username);
    }

    const reactionsObj: Record<string, string[]> = {};
    reactions.forEach((usersList, emojiKey) => {
      reactionsObj[emojiKey] = usersList;
    });

    this.server.to('general').emit('reactionAdded', {
      messageId,
      reactions: reactionsObj,
    });
  }

  @SubscribeMessage('removeReaction')
  handleRemoveReaction(
    @MessageBody() data: { messageId: number; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const { messageId, emoji } = data;

    const reactions = this.messageReactions.get(messageId);
    if (!reactions) return;

    const users = reactions.get(emoji);
    if (!users) return;

    const index = users.indexOf(user.username);
    if (index > -1) {
      users.splice(index, 1);
    }

    if (users.length === 0) {
      reactions.delete(emoji);
    }

    if (reactions.size === 0) {
      this.messageReactions.delete(messageId);
    }

    const reactionsObj: Record<string, string[]> = {};
    reactions.forEach((usersList, emojiKey) => {
      reactionsObj[emojiKey] = usersList;
    });

    this.server.to('general').emit('reactionRemoved', {
      messageId,
      reactions: reactionsObj,
    });
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('[WS] joinRoom reçu, roomId:', data.roomId);
    const user = this.connectedUsers.get(client.id);
    if (!user) {
      console.log('[WS] Utilisateur non trouvé');
      return;
    }
    console.log('[WS] Utilisateur:', user.username, 'ID:', user.id);

    try {
      const room = await this.roomsService.getRoomById(data.roomId);
      console.log('[WS] Salon trouvé:', room.name, 'memberIds:', room.memberIds, 'type:', typeof room.memberIds);
      
      const memberIds = Array.isArray(room.memberIds) 
        ? room.memberIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
        : String(room.memberIds).split(',').map(id => parseInt(id, 10));
      
      console.log('[WS] memberIds après conversion:', memberIds);
      console.log('[WS] user.id est membre?', memberIds.includes(user.id));
      
      if (!memberIds.includes(user.id)) {
        console.log('[WS] Utilisateur non membre du salon');
        client.emit('error', { message: 'Vous n\'êtes pas membre de ce salon' });
        return;
      }

      client.join(`room-${data.roomId}`);
      console.log('[WS] Client a rejoint room-' + data.roomId);

      const messages = await this.roomsService.getRoomMessages(data.roomId, user.id);
      console.log('[WS] Messages chargés:', messages.length);

      client.emit('roomJoined', {
        room,
        messages,
      });
      console.log('[WS] Événement roomJoined émis au client');

      this.server.to(`room-${data.roomId}`).emit('userJoinedRoom', {
        roomId: data.roomId,
        username: user.username,
      });
    } catch (error) {
      console.error('[WS] Erreur dans joinRoom:', error.message);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('sendRoomMessage')
  async handleRoomMessage(
    @MessageBody() data: { roomId: number; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    try {
      const fullUser = await this.usersService.findById(user.id);
      
      const savedMessage = await this.roomsService.saveMessage(
        data.roomId,
        user.id,
        user.username,
        data.message,
      );

      this.server.to(`room-${data.roomId}`).emit('newRoomMessage', {
        ...savedMessage,
        timestamp: savedMessage.createdAt.toISOString(),
        displayColor: fullUser?.displayColor || null,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    client.leave(`room-${data.roomId}`);

    this.server.to(`room-${data.roomId}`).emit('userLeftRoom', {
      roomId: data.roomId,
      username: user.username,
    });
  }
}
