import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Message } from './message.entity';
import { User } from '../../users/user.entity';

@Entity()
export class Reaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  emoji: string;

  @ManyToOne(() => Message, (message) => message.reactions)
  message: Message;

  @ManyToOne(() => User)
  user: User;
}
