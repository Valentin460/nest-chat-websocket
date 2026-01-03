import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from '../../users/user.entity';

@Entity()
export class RoomMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Room, (room) => room.members)
  room: Room;

  @ManyToOne(() => User, (user) => user.roomMemberships)
  user: User;

  @Column({ default: true })
  hasAccessToHistory: boolean;

  @CreateDateColumn()
  joinedAt: Date;
}
