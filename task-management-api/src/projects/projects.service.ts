import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Project, ProjectDocument } from './schemas/project.schema.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  // Create a project; createdBy records the admin who created it.
  async create(createProjectDto: CreateProjectDto, userId: string) {
    return this.projectModel.create({
      ...createProjectDto,
      createdBy: new Types.ObjectId(userId),
    });
  }

  // Admin can view all projects.
  async findAll() {
    return this.projectModel.find().sort({ createdAt: -1 }).exec();
  }

  // Find any project by ID.
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid project ID');
    }

    const project = await this.projectModel.findById(id).exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  // Admin can update any project.
  async update(id: string, updateProjectDto: UpdateProjectDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid project ID');
    }

    const project = await this.projectModel
      .findByIdAndUpdate(
        id,
        { $set: updateProjectDto },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  // Admin can delete any project.
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid project ID');
    }

    const project = await this.projectModel.findByIdAndDelete(id).exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      message: 'Project deleted successfully',
      id: project._id.toString(),
    };
  }
}
