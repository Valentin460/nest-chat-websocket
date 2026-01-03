import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';
import { RoomMember } from './entities/room-member.entity';
import { Reaction } from './entities/reaction.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(RoomMember)
    private roomMemberRepository: Repository<RoomMember>,
    @InjectRepository(Reaction)
    private reactionRepository: Repository<Reaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async initGeneralRoom() {
    const general = await this.roomRepository.findOne({
      where: { isGeneral: true },
    });
    if (!general) {
      await this.roomRepository.save({ name: 'General', isGeneral: true });
    }
  }

  async getGeneralRoom(): Promise<Room | null> {
    return this.roomRepository.findOne({
      where: { isGeneral: true },
      relations: ['members', 'members.user'],
    });
  }

  async joinGeneralRoom(userId: number) {
    const room = await this.getGeneralRoom();
    if (!room) return;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const existing = await this.roomMemberRepository.findOne({
      where: { room: { id: room.id }, user: { id: userId } },
    });

    if (!existing) {
      const member = this.roomMemberRepository.create({
        room,
        user,
        hasAccessToHistory: true,
      });
      await this.roomMemberRepository.save(member);
    }
  }

  async createRoom(
    name: string,
    creatorId: number,
    memberIds: number[],
    giveHistoryAccess: boolean,
  ): Promise<Room> {
    const room = await this.roomRepository.save({ name, isGeneral: false });

    const allMemberIds = [creatorId, ...memberIds];
    for (const memberId of allMemberIds) {
      const user = await this.userRepository.findOne({
        where: { id: memberId },
      });
      if (user) {
        const member = this.roomMemberRepository.create({
          room,
          user,
          hasAccessToHistory: giveHistoryAccess,
        });
        await this.roomMemberRepository.save(member);
      }
    }

    return room;
  }

  async getUserRooms(userId: number): Promise<Room[]> {
    const memberships = await this.roomMemberRepository.find({
      where: { user: { id: userId } },
      relations: ['room'],
    });
    return memberships.map((m) => m.room);
  }

  async getRoomMessages(roomId: number, userId: number): Promise<Message[]> {
    const membership = await this.roomMemberRepository.findOne({
      where: { room: { id: roomId }, user: { id: userId } },
    });

    if (!membership) return [];

    const messages = await this.messageRepository.find({
      where: { room: { id: roomId } },
      relations: ['user', 'reactions', 'reactions.user'],
      order: { createdAt: 'ASC' },
    });

    if (membership.hasAccessToHistory) {
      return messages;
    } else {
      return messages.filter(
        (m) => new Date(m.createdAt) >= new Date(membership.joinedAt),
      );
    }
  }

  async sendMessage(
    roomId: number,
    userId: number,
    content: string,
  ): Promise<Message> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!room || !user) {
      throw new Error('Room or user not found');
    }

    const message = this.messageRepository.create({
      content,
      room,
      user,
    });

    const saved = await this.messageRepository.save(message);

    // Retourner le message avec ses relations pour que le client reçoive
    // l'objet complet (user, reactions, etc.). Si la requête avec
    // relations ne retourne rien (hautement improbable), renvoyer l'objet
    // sauvegardé pour éviter de casser l'appelant.
    const withRelations = await this.messageRepository.findOne({
      where: { id: saved.id },
      relations: ['user', 'reactions', 'reactions.user'],
    });

    return withRelations ?? saved;
  }

  async addReaction(
    messageId: number,
    userId: number,
    emoji: string,
  ): Promise<Reaction | null> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!message || !user) {
      throw new Error('Message or user not found');
    }

    const existing = await this.reactionRepository.findOne({
      where: { message: { id: messageId }, user: { id: userId }, emoji },
    });

    if (existing) {
      await this.reactionRepository.remove(existing);
      return null;
    }

    const reaction = this.reactionRepository.create({ message, user, emoji });
    return this.reactionRepository.save(reaction);
  }
}
