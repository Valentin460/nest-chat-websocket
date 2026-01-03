import { Controller, Get, Put, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Put('profile')
  async updateProfile(
    @Body() body: { userId: number; username?: string; color?: string },
  ) {
    return this.usersService.updateProfile(
      body.userId,
      body.username,
      body.color,
    );
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }
}
