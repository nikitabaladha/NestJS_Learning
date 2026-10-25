import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  SetMetadata,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

import { RESPONSE_MESSAGE } from '../common/interceptors/response/response.interceptor.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: 'user' | 'admin';
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @SetMetadata(RESPONSE_MESSAGE, 'User created successfully')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @SetMetadata(RESPONSE_MESSAGE, 'Admin created successfully')
  createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.userService.createAdmin(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @SetMetadata(RESPONSE_MESSAGE, 'Users retrieved successfully')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @SetMetadata(RESPONSE_MESSAGE, 'User retrieved successfully')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.userService.findOne(id, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @SetMetadata(RESPONSE_MESSAGE, 'User updated successfully')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.userService.update(id, updateUserDto, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @SetMetadata(RESPONSE_MESSAGE, 'User deleted successfully')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
