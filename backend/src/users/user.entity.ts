import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Message } from '../chat/entities/message.entity';
import { RoomMember } from '../chat/entities/room-member.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ default: '#3b82f6' })
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  @OneToMany(() => RoomMember, (member) => member.user)
  roomMemberships: RoomMember[];
}
