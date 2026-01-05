import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatMessage } from './entities/chat-message.entity';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    forwardRef(() => UsersModule),
    RoomsModule,
    JwtModule.register({
      secret: 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
