import {
  Controller,
  Get,
  Body,
  Post,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';

import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

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

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Post()
  @Roles('admin')
  @SetMetadata(RESPONSE_MESSAGE, 'Task created successfully')
  create(
    @Body() createTaskDto: CreateTaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.taskService.create(createTaskDto, req.user.userId);
  }

  @Get()
  @Roles('admin', 'user')
  @SetMetadata(RESPONSE_MESSAGE, 'Tasks retrieved successfully')
  findAll(@Req() req: AuthenticatedRequest) {
    return this.taskService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  @Roles('admin', 'user')
  @SetMetadata(RESPONSE_MESSAGE, 'Task retrieved successfully')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.taskService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  @Roles('admin', 'user')
  @SetMetadata(RESPONSE_MESSAGE, 'Task updated successfully')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.taskService.update(
      id,
      req.user.userId,
      req.user.role,
      updateTaskDto,
    );
  }

  @Delete(':id')
  @Roles('admin')
  @SetMetadata(RESPONSE_MESSAGE, 'Task deleted successfully')
  remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }
}
