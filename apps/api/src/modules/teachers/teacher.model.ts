import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'VISITING';

export interface TeacherProfileDocument extends Document {
  userId: Types.ObjectId;
  branch: Types.ObjectId;
  employeeId: string;
  qualification?: string;
  specialization: string[];
  experienceYears?: number;
  employmentType: EmploymentType;
  joinedDate: Date;
  bio?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teacherProfileSchema = new Schema<TeacherProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    qualification: { type: String, trim: true },
    specialization: { type: [String], default: [] },
    experienceYears: { type: Number, min: 0, max: 60 },
    employmentType: {
      type: String,
      required: true,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING'],
      default: 'FULL_TIME',
    },
    joinedDate: { type: Date, required: true, default: Date.now },
    bio: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'teacher_profiles' },
);

teacherProfileSchema.index({ branch: 1, isActive: 1 });

export const TeacherProfileModel: Model<TeacherProfileDocument> =
  mongoose.models.TeacherProfile ||
  mongoose.model<TeacherProfileDocument>('TeacherProfile', teacherProfileSchema);