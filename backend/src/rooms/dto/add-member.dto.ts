import { IsNumber, IsBoolean } from 'class-validator';

export class AddMemberDto {
  @IsNumber()
  userId: number;

  @IsBoolean()
  hasHistoryAccess: boolean;
}
