import { Controller, Post, Get, Body, Param, UseGuards, Request, Inject, forwardRef } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  async createRoom(@Request() req, @Body() createRoomDto: CreateRoomDto) {
    const room = await this.roomsService.createRoom(req.user.sub, createRoomDto);
    
    this.chatGateway.server.emit('roomCreated', {
      room,
      memberIds: room.memberIds,
    });
    
    return {
      room,
      message: 'Salon créé avec succès',
    };
  }

  @Get()
  async getUserRooms(@Request() req) {
    const rooms = await this.roomsService.getUserRooms(req.user.sub);
    return { rooms };
  }

  @Get(':id')
  async getRoom(@Param('id') id: string, @Request() req) {
    const room = await this.roomsService.getRoomById(+id);
    return { room };
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Request() req,
    @Body() addMemberDto: AddMemberDto,
  ) {
    const room = await this.roomsService.addMember(+id, req.user.sub, addMemberDto);
    return {
      room,
      message: 'Membre ajouté avec succès',
    };
  }

  @Get(':id/messages')
  async getRoomMessages(@Param('id') id: string, @Request() req) {
    const messages = await this.roomsService.getRoomMessages(+id, req.user.sub);
    return { messages };
  }
}
