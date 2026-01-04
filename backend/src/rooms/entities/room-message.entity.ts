import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('room_messages')
export class RoomMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roomId: number;

  @Column()
  userId: number;

  @Column()
  username: string;

  @Column('text')
  message: string;

  @Column('simple-json', { nullable: true })
  reactions: Record<string, string[]>;

  @CreateDateColumn()
  createdAt: Date;
}
