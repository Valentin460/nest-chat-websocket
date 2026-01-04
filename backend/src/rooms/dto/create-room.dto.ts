import { IsString, IsArray, IsNumber, IsBoolean } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsArray()
  @IsNumber({}, { each: true })
  memberIds: number[];

  @IsBoolean()
  grantHistoryAccess: boolean;
}
