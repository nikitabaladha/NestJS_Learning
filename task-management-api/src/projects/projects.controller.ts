import {
  Controller,
  Body,
  Post,
  Req,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';

import { ProjectsService } from './projects.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

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

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) {}

  @Post()
  @SetMetadata(RESPONSE_MESSAGE, 'Project created successfully')
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectService.create(createProjectDto, req.user.userId);
  }

  @Get()
  @SetMetadata(RESPONSE_MESSAGE, 'Projects retrieved successfully')
  findAll() {
    return this.projectService.findAll();
  }

  @Get(':id')
  @SetMetadata(RESPONSE_MESSAGE, 'Project retrieved successfully')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Patch(':id')
  @SetMetadata(RESPONSE_MESSAGE, 'Project updated successfully')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @SetMetadata(RESPONSE_MESSAGE, 'Project deleted successfully')
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }
}
