import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { RoomMessage } from './entities/room-message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    @InjectRepository(RoomMessage)
    private roomMessagesRepository: Repository<RoomMessage>,
  ) {}

  async createRoom(creatorId: number, createRoomDto: CreateRoomDto): Promise<Room> {
    const { name, memberIds, grantHistoryAccess } = createRoomDto;

    const allMemberIds = Array.from(new Set([creatorId, ...memberIds]));

    const memberPermissions: Record<number, { hasHistoryAccess: boolean; joinedAt: string }> = {};
    const now = new Date().toISOString();

    allMemberIds.forEach(memberId => {
      memberPermissions[memberId] = {
        hasHistoryAccess: memberId === creatorId ? true : grantHistoryAccess,
        joinedAt: now,
      };
    });

    const room = this.roomsRepository.create({
      name,
      creatorId,
      memberIds: allMemberIds,
      memberPermissions,
    });

    return this.roomsRepository.save(room);
  }

  async getUserRooms(userId: number): Promise<Room[]> {
    const rooms = await this.roomsRepository.find();
    return rooms.filter(room => {
      const memberIds = Array.isArray(room.memberIds) 
        ? room.memberIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
        : String(room.memberIds).split(',').map(id => parseInt(id, 10));
      return memberIds.includes(userId);
    });
  }

  async getRoomById(roomId: number): Promise<Room> {
    const room = await this.roomsRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Salon non trouvé');
    }
    return room;
  }

  async addMember(roomId: number, requesterId: number, addMemberDto: AddMemberDto): Promise<Room> {
    const room = await this.getRoomById(roomId);

    if (room.creatorId !== requesterId) {
      throw new ForbiddenException('Seul le créateur peut ajouter des membres');
    }

    const { userId, hasHistoryAccess } = addMemberDto;

    const memberIds = Array.isArray(room.memberIds) 
      ? room.memberIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      : String(room.memberIds).split(',').map(id => parseInt(id, 10));

    if (memberIds.includes(userId)) {
      throw new ForbiddenException('Cet utilisateur est déjà membre du salon');
    }

    room.memberIds.push(userId);
    room.memberPermissions[userId] = {
      hasHistoryAccess,
      joinedAt: new Date().toISOString(),
    };

    return this.roomsRepository.save(room);
  }

  async saveMessage(
    roomId: number,
    userId: number,
    username: string,
    message: string,
  ): Promise<RoomMessage> {
    const roomMessage = this.roomMessagesRepository.create({
      roomId,
      userId,
      username,
      message,
      reactions: {},
    });

    return this.roomMessagesRepository.save(roomMessage);
  }

  async getRoomMessages(roomId: number, userId: number): Promise<RoomMessage[]> {
    const room = await this.getRoomById(roomId);

    const memberIds = Array.isArray(room.memberIds) 
      ? room.memberIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      : String(room.memberIds).split(',').map(id => parseInt(id, 10));

    if (!memberIds.includes(userId)) {
      throw new ForbiddenException('Vous n\'êtes pas membre de ce salon');
    }

    const userPermissions = room.memberPermissions[userId];
    const allMessages = await this.roomMessagesRepository.find({
      where: { roomId },
      order: { createdAt: 'ASC' },
    });

    if (userPermissions.hasHistoryAccess) {
      return allMessages;
    }

    const joinedAt = new Date(userPermissions.joinedAt);
    return allMessages.filter(msg => new Date(msg.createdAt) >= joinedAt);
  }

  async updateMessageReactions(
    messageId: number,
    reactions: Record<string, string[]>,
  ): Promise<RoomMessage> {
    const message = await this.roomMessagesRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    message.reactions = reactions;
    return this.roomMessagesRepository.save(message);
  }
}
