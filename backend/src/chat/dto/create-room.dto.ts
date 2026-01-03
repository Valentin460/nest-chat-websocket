export class CreateRoomDto {
  name: string;
  memberIds: number[];
  giveHistoryAccess: boolean;
}

export class SendMessageDto {
  roomId: number;
  userId: number;
  content: string;
}

export class AddReactionDto {
  messageId: number;
  userId: number;
  emoji: string;
}

export class TypingDto {
  roomId: number;
  userId: number;
  username: string;
}
