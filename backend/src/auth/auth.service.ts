import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async register(username: string, password: string): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByUsername(username);
    if (existingUser) {
      throw new ConflictException("Ce nom d'utilisateur est déjà pris");
    }
    const user = await this.usersService.create(username, password);
    return new AuthResponseDto(user.id, user.username, user.color);
  }

  async login(username: string, password: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findByUsername(username);
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    return new AuthResponseDto(user.id, user.username, user.color);
  }
}
