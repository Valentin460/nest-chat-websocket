import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';
import { RoomMember } from './entities/room-member.entity';
import { Reaction } from './entities/reaction.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Message, RoomMember, Reaction, User]),
  ],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
