import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type ClassStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';

export interface ClassSchedule {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  roomOrLocation?: string;
}

export interface ClassDocument extends Document {
  classCode: string;
  name: string;
  branch: Types.ObjectId;
  program?: Types.ObjectId;
  languageLevel?: Types.ObjectId;
  teacher: Types.ObjectId;

  students: Types.ObjectId[];

  schedule: ClassSchedule;

  startDate: Date;
  endDate?: Date;

  status: ClassStatus;
  notes?: string;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<ClassSchedule>(
  {
    daysOfWeek: {
      type: [Number],
      required: true,
      validate: {
        validator: (arr: number[]) => arr.every((d) => d >= 0 && d <= 6),
        message: 'Days must be 0-6 (Sun-Sat)',
      },
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(v),
        message: 'Time must be HH:mm format',
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(v),
        message: 'Time must be HH:mm format',
      },
    },
    roomOrLocation: { type: String, trim: true },
  },
  { _id: false },
);

const classSchema = new Schema<ClassDocument>(
  {
    classCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    program: { type: Schema.Types.ObjectId, ref: 'Program' },
    languageLevel: { type: Schema.Types.ObjectId, ref: 'LanguageLevel' },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'TeacherProfile',
      required: true,
      index: true,
    },
    students: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
      default: [],
    },
    schedule: { type: scheduleSchema, required: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED'],
      default: 'ACTIVE',
      index: true,
    },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'classes' },
);

classSchema.index({ branch: 1, status: 1 });
classSchema.index({ teacher: 1, status: 1 });
classSchema.index({ students: 1 });

export const ClassModel: Model<ClassDocument> =
  mongoose.models.Class || mongoose.model<ClassDocument>('Class', classSchema);