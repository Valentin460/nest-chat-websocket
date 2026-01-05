import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';
import { RoomMessage } from './entities/room-message.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, RoomMessage]),
    forwardRef(() => UsersModule),
    JwtModule.register({
      secret: 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
