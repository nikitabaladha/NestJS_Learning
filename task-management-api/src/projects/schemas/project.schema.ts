import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { truncate } from 'fs';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<
  Project & {
    createdAt: Date;
    updatedAt: Date;
  }
>;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy!: Types.ObjectId;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
