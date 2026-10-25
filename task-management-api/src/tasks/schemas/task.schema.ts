import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<
  Task & {
    createdAt: Date;
    updatedAt: Date;
  }
>;

@Schema({ timestamps: true })
export class Task {
  @Prop({
    required: true,
    trim: true,
  })
  title!: string;

  @Prop({
    trim: true,
  })
  description?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Project',
    required: true,
  })
  projectId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  assignedToId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  assignedById!: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending',
  })
  status!: string;

  @Prop({
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  })
  priority!: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
