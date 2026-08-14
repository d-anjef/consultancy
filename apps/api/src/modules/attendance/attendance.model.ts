import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_METHODS,
  type AttendanceStatus,
  type AttendanceMethod,
} from '@consultancy/config';

export interface AttendanceDocument extends Document {
  user: Types.ObjectId;
  userType: 'STUDENT' | 'TEACHER';
  branch: Types.ObjectId;
  class?: Types.ObjectId;
  date: Date;
  scannedAt: Date;
  status: AttendanceStatus;
  method: AttendanceMethod;
  scannedBy: Types.ObjectId;
  scannerDevice?: string;
  editedBy?: Types.ObjectId;
  editedAt?: Date;
  editReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<AttendanceDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ['STUDENT', 'TEACHER'],
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      index: true,
    },
    date: { type: Date, required: true, index: true },
    scannedAt: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      required: true,
      enum: Object.values(ATTENDANCE_STATUSES),
      default: ATTENDANCE_STATUSES.PRESENT,
    },
    method: {
      type: String,
      required: true,
      enum: Object.values(ATTENDANCE_METHODS),
      default: ATTENDANCE_METHODS.QR_SCAN,
    },
    scannedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scannerDevice: { type: String, trim: true },
    editedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    editedAt: { type: Date },
    editReason: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true, collection: 'attendances' },
);

// One attendance per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ branch: 1, date: -1 });
attendanceSchema.index({ class: 1, date: -1 });
attendanceSchema.index({ userType: 1, branch: 1, date: -1 });

export const AttendanceModel: Model<AttendanceDocument> =
  mongoose.models.Attendance ||
  mongoose.model<AttendanceDocument>('Attendance', attendanceSchema);