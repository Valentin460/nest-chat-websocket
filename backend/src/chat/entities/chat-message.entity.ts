import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  username: string;

  @Column('text')
  message: string;

  @Column('simple-json', { default: '{}' })
  reactions: Record<string, string[]>;

  @CreateDateColumn()
  createdAt: Date;
}
