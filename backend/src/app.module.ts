import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { RoomsModule } from './rooms/rooms.module';
import { User } from './users/entities/user.entity';
import { Room } from './rooms/entities/room.entity';
import { RoomMessage } from './rooms/entities/room-message.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'chat.db',
      entities: [User, Room, RoomMessage, ChatMessage],
      synchronize: true,
      logging: true,
    }),
    AuthModule,
    UsersModule,
    ChatModule,
    RoomsModule,
  ],
})
export class AppModule {}
