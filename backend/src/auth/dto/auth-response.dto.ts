export class AuthResponseDto {
  id: number;
  username: string;
  color: string;

  constructor(id: number, username: string, color: string) {
    this.id = id;
    this.username = username;
    this.color = color;
  }
}
