import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import {
  TASK_STATUSES,
  TASK_TYPES,
  TASK_PRIORITIES,
  type TaskStatus,
  type TaskType,
  type TaskPriority,
} from '@consultancy/config';

export interface TaskRelatedTo {
  entityType: 'LEAD' | 'STUDENT' | 'APPLICATION';
  entityId: Types.ObjectId;
}

export interface TaskDocument extends Document {
  taskNumber: string;
  branch: Types.ObjectId;

  relatedTo: TaskRelatedTo;

  taskType: TaskType;
  title: string;
  description?: string;

  assignedTo: Types.ObjectId;

  priority: TaskPriority;
  dueDate: Date;

  status: TaskStatus;

  completedAt?: Date;
  completedBy?: Types.ObjectId;
  completionNotes?: string;

  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancellationReason?: string;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const relatedToSchema = new Schema<TaskRelatedTo>(
  {
    entityType: {
      type: String,
      required: true,
      enum: ['LEAD', 'STUDENT', 'APPLICATION'],
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false },
);

const taskSchema = new Schema<TaskDocument>(
  {
    taskNumber: { type: String, required: true, unique: true, index: true },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    relatedTo: { type: relatedToSchema, required: true },
    taskType: {
      type: String,
      required: true,
      enum: Object.values(TASK_TYPES),
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    priority: {
      type: String,
      required: true,
      enum: Object.values(TASK_PRIORITIES),
      default: TASK_PRIORITIES.MEDIUM,
      index: true,
    },
    dueDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(TASK_STATUSES),
      default: TASK_STATUSES.OPEN,
      index: true,
    },
    completedAt: { type: Date },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completionNotes: { type: String, trim: true },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'tasks' },
);

taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });
taskSchema.index({ branch: 1, status: 1 });
taskSchema.index({ 'relatedTo.entityType': 1, 'relatedTo.entityId': 1 });

export const TaskModel: Model<TaskDocument> =
  mongoose.models.Task || mongoose.model<TaskDocument>('Task', taskSchema);