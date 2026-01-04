import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<User> {
    const existingUserByEmail = await this.usersRepository.findOne({
      where: { email: userData.email },
    });
    if (existingUserByEmail) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const existingUserByUsername = await this.usersRepository.findOne({
      where: { username: userData.username },
    });
    if (existingUserByUsername) {
      throw new ConflictException('Un utilisateur avec ce nom d\'utilisateur existe déjà');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async updateProfile(id: number, updateData: { username?: string; displayColor?: string }): Promise<User> {
    if (updateData.username) {
      const existingUser = await this.usersRepository.findOne({
        where: { username: updateData.username },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Ce nom d\'utilisateur existe déjà');
      }
    }

    await this.usersRepository.update(id, updateData);
    return this.findById(id);
  }
}
