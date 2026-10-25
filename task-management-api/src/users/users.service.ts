import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  HttpException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './schemas/user.schema.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private handlePersistenceError(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'CastError'
    ) {
      throw new BadRequestException('Invalid user ID');
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new ConflictException('A user with this email already exists');
    }

    throw error;
  }

  async create(createUserDto: CreateUserDto) {
    return this.createWithRole(createUserDto, 'user');
  }

  async createAdmin(createUserDto: CreateUserDto) {
    return this.createWithRole(createUserDto, 'admin');
  }

  private async createWithRole(
    createUserDto: CreateUserDto,
    role: 'user' | 'admin',
  ) {
    try {
      const email = createUserDto.email.trim().toLowerCase();
      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

      const user = await this.userModel.create({
        name: createUserDto.name.trim(),
        email,
        password: hashedPassword,
        role,
      });

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };
    } catch (error: unknown) {
      this.handlePersistenceError(error);
    }
  }

  async findByEmailForAuth(email: string) {
    try {
      return await this.userModel
        .findOne({ email: email.trim().toLowerCase() })
        .select('+password')
        .exec();
    } catch (error: unknown) {
      this.handlePersistenceError(error);
    }
  }

  async findAll() {
    try {
      const users = await this.userModel
        .find()
        .select('name email role createdAt')
        .exec();

      return users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }));
    } catch (error: unknown) {
      this.handlePersistenceError(error);
    }
  }

  // Public profile lookup with ownership authorization.
  async findOne(
    id: string,
    requester: { userId: string; role: 'user' | 'admin' },
  ) {
    try {
      if (requester.role !== 'admin' && requester.userId !== id) {
        throw new ForbiddenException('You can view only your own profile');
      }

      const user = await this.userModel
        .findById(id)
        .select('name email role createdAt')
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };
    } catch (error: unknown) {
      this.handlePersistenceError(error);
    }
  }

  // Internal lookup for other services, such as TasksService.
  async findOneById(id: string) {
    try {
      const user = await this.userModel
        .findById(id)
        .select('name email role createdAt')
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error: unknown) {
      this.handlePersistenceError(error);
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requester: { userId: string; role: 'user' | 'admin' },
  ) {
    try {
      if (requester.role !== 'admin' && requester.userId !== id) {
        throw new ForbiddenException('You can update only your own profile');
      }

      const updates = { ...updateUserDto };

      if (updates.email !== undefined) {
        updates.email = updates.email.trim().toLowerCase();
      }

      if (updates.name !== undefined) {
        updates.name = updates.name.trim();
      }

      const user = await this.userModel
        .findByIdAndUpdate(id, updates, {
          new: true,
          runValidators: true,
        })
        .select('name email role createdAt')
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };
    } catch (error: unknown) {
      this.handlePersistenceError(error);
    }
  }

  async remove(id: string) {
    try {
      const user = await this.userModel
        .findByIdAndDelete(id)
        .select('_id')
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        message: 'User deleted successfully',
        id: user._id.toString(),
      };
    } catch (error: unknown) {
      this.handlePersistenceError(error);
    }
  }
}
