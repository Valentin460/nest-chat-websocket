import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Room } from './room.entity';
import { Reaction } from './reaction.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @ManyToOne(() => User, (user) => user.messages)
  user: User;

  @ManyToOne(() => Room, (room) => room.messages)
  room: Room;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reaction, (reaction) => reaction.message)
  reactions: Reaction[];
}
