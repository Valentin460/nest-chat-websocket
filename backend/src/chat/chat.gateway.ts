import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import {
  SendMessageDto,
  AddReactionDto,
  TypingDto,
  CreateRoomDto,
} from './dto/create-room.dto';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private typingUsers: Map<number, Set<string>> = new Map();

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinGeneral')
  async handleJoinGeneral(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.joinGeneralRoom(data.userId);
    const room = await this.chatService.getGeneralRoom();

    if (!room) {
      throw new Error('General room not found');
    }

    void client.join(`room-${room.id}`);

    const messages = await this.chatService.getRoomMessages(
      room.id,
      data.userId,
    );

    return { roomId: room.id, messages };
  }

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @MessageBody() data: CreateRoomDto & { creatorId: number },
  ) {
    try {
      const room = await this.chatService.createRoom(
        data.name,
        data.creatorId,
        data.memberIds,
        data.giveHistoryAccess,
      );

      // Émettre à tous les membres (créateur + invités)
      const allMemberIds = [data.creatorId, ...data.memberIds];
      for (const memberId of allMemberIds) {
        this.server.to(`user-${memberId}`).emit('newRoom', room);
      }

      return room;
    } catch (error) {
      console.error('Erreur lors de la création du salon:', error);
      return { error: 'Erreur lors de la création du salon' };
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(`room-${data.roomId}`);

    const messages = await this.chatService.getRoomMessages(
      data.roomId,
      data.userId,
    );

    return { messages };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: SendMessageDto) {
    // Persist the message and return the saved message (with relations)
    const sentMessage = await this.chatService.sendMessage(
      data.roomId,
      data.userId,
      data.content,
    );

    this.server.to(`room-${data.roomId}`).emit('newMessage', sentMessage);

    const typingSet = this.typingUsers.get(data.roomId);
    if (typingSet) {
      typingSet.delete(`${data.userId}`);
      this.emitTypingUpdate(data.roomId);
    }

    return sentMessage;
  }

  @SubscribeMessage('addReaction')
  async handleReaction(@MessageBody() data: AddReactionDto) {
    await this.chatService.addReaction(data.messageId, data.userId, data.emoji);
    this.server.emit('reactionUpdated', data.messageId);
    return { success: true };
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: TypingDto) {
    if (!this.typingUsers.has(data.roomId)) {
      this.typingUsers.set(data.roomId, new Set());
    }

    const typingSet = this.typingUsers.get(data.roomId);
    if (!typingSet) return;

    typingSet.add(`${data.userId}:${data.username}`);
    this.emitTypingUpdate(data.roomId);

    setTimeout(() => {
      const currentSet = this.typingUsers.get(data.roomId);
      if (currentSet) {
        currentSet.delete(`${data.userId}:${data.username}`);
        this.emitTypingUpdate(data.roomId);
      }
    }, 3000);
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(@MessageBody() data: { roomId: number; userId: number }) {
    const typingSet = this.typingUsers.get(data.roomId);
    if (!typingSet) return;

    const filtered = Array.from(typingSet).filter(
      (u) => !u.startsWith(`${data.userId}:`),
    );
    this.typingUsers.set(data.roomId, new Set(filtered));
    this.emitTypingUpdate(data.roomId);
  }

  private emitTypingUpdate(roomId: number) {
    const users = this.typingUsers.get(roomId);
    const usernames = users
      ? Array.from(users).map((u) => u.split(':')[1])
      : [];
    this.server
      .to(`room-${roomId}`)
      .emit('typingUpdate', { roomId, usernames });
  }

  @SubscribeMessage('getRooms')
  async handleGetRooms(@MessageBody() data: { userId: number }) {
    return this.chatService.getUserRooms(data.userId);
  }
}
