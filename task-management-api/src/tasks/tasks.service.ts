import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Task, TaskDocument } from './schemas/task.schema.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { ProjectsService } from '../projects/projects.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    private readonly projectService: ProjectsService,
    private readonly userService: UsersService,
  ) {}

  // Only admins can create tasks; the controller enforces this.
  async create(createTaskDto: CreateTaskDto, userId: string) {
    const project = await this.projectService.findOne(createTaskDto.projectId);

    const assignedUser = await this.userService.findOneById(
      createTaskDto.assignedToId,
    );

    return this.taskModel.create({
      ...createTaskDto,
      projectId: new Types.ObjectId(project._id.toString()),
      assignedToId: new Types.ObjectId(assignedUser._id.toString()),
      assignedById: new Types.ObjectId(userId),
    });
  }

  // Admin sees all tasks; a regular user sees only assigned tasks.
  async findAll(userId: string, role: 'user' | 'admin') {
    const filter =
      role === 'admin' ? {} : { assignedToId: new Types.ObjectId(userId) };

    return this.taskModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  // Admin can view any task; users can view only tasks assigned to them.
  async findOne(id: string, userId: string, role: 'user' | 'admin') {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid task ID');
    }

    const filter =
      role === 'admin'
        ? { _id: id }
        : {
            _id: id,
            assignedToId: new Types.ObjectId(userId),
          };

    const task = await this.taskModel.findOne(filter).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  // Admin can update task details; the assigned user can update status only.
  async update(
    id: string,
    userId: string,
    role: 'user' | 'admin',
    updateTaskDto: UpdateTaskDto,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid task ID');
    }

    const updates = Object.entries(updateTaskDto).filter(
      ([, value]) => value !== undefined,
    );

    if (updates.length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    const task = await this.taskModel.findById(id).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAssignee = task.assignedToId.toString() === userId;

    if (role !== 'admin' && !isAssignee) {
      throw new NotFoundException('Task not found');
    }

    if (role !== 'admin') {
      const hasOnlyStatus = updates.every(([field]) => field === 'status');

      if (!hasOnlyStatus) {
        throw new ForbiddenException(
          'You can update only the status of your assigned tasks',
        );
      }
    }

    for (const [field, value] of updates) {
      task.set(field, value);
    }

    await task.save();

    return task;
  }

  // Only admins can delete tasks; the controller enforces this.
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid task ID');
    }

    const task = await this.taskModel.findByIdAndDelete(id).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return {
      id: task._id.toString(),
      message: 'Task deleted successfully',
    };
  }
}
