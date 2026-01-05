import { Controller, Put, Body, UseGuards, Request, Inject, forwardRef } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.sub, updateProfileDto);
    const { password, ...result } = user;
    
    // Notifier tous les clients du changement de couleur si elle a été modifiée
    if (updateProfileDto.displayColor !== undefined) {
      this.chatGateway.server.emit('userColorChanged', {
        userId: user.id,
        username: user.username,
        displayColor: user.displayColor,
      });
    }
    
    return {
      user: result,
      message: 'Profil modifié avec succès',
    };
  }
}
