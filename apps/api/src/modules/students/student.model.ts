import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { STUDENT_STATUSES, type StudentStatus } from '@consultancy/config';

export interface StudentPersonal {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  nationality: string;
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  fatherName?: string;
  motherName?: string;
}

export interface StudentAddress {
  street: string;
  city: string;
  district: string;
  province: string;
  country: string;
  postalCode?: string;
}

export interface StudentContact {
  phone: string;
  email: string;
  alternatePhone?: string;
  address: StudentAddress;
  permanentAddress?: StudentAddress;
}

export interface StudentEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface StudentPassport {
  number?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuePlace?: string;
}

export interface StudentEducation {
  highestQualification?: string;
  institution?: string;
  completionYear?: number;
  percentage?: number;
}

export interface StudentDocument extends Document {
  studentId: string;
  userId: Types.ObjectId;
  branch: Types.ObjectId;
  originLead?: Types.ObjectId;
  assignedCounselor?: Types.ObjectId;

  personal: StudentPersonal;
  contact: StudentContact;
  emergencyContact: StudentEmergencyContact;
  passport?: StudentPassport;
  education?: StudentEducation;

  currentApplication?: Types.ObjectId;

  status: StudentStatus;
  admissionDate: Date;

  qrIdentity?: Types.ObjectId;

  notes?: string;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<StudentAddress>(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'Nepal' },
    postalCode: { type: String, trim: true },
  },
  { _id: false },
);

const personalSchema = new Schema<StudentPersonal>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: {
      type: String,
      required: true,
      enum: ['MALE', 'FEMALE', 'OTHER'],
    },
    nationality: { type: String, required: true, trim: true, default: 'Nepali' },
    maritalStatus: {
      type: String,
      enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'],
    },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
  },
  { _id: false },
);

const contactSchema = new Schema<StudentContact>(
  {
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    alternatePhone: { type: String, trim: true },
    address: { type: addressSchema, required: true },
    permanentAddress: { type: addressSchema },
  },
  { _id: false },
);

const emergencyContactSchema = new Schema<StudentEmergencyContact>(
  {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
  },
  { _id: false },
);

const passportSchema = new Schema<StudentPassport>(
  {
    number: { type: String, trim: true },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    issuePlace: { type: String, trim: true },
  },
  { _id: false },
);

const educationSchema = new Schema<StudentEducation>(
  {
    highestQualification: { type: String, trim: true },
    institution: { type: String, trim: true },
    completionYear: { type: Number, min: 1950, max: 2100 },
    percentage: { type: Number, min: 0, max: 100 },
  },
  { _id: false },
);

const studentSchema = new Schema<StudentDocument>(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    originLead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
    },
    assignedCounselor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    personal: { type: personalSchema, required: true },
    contact: { type: contactSchema, required: true },
    emergencyContact: { type: emergencyContactSchema, required: true },
    passport: { type: passportSchema },
    education: { type: educationSchema },
    currentApplication: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(STUDENT_STATUSES),
      default: STUDENT_STATUSES.ACTIVE,
      index: true,
    },
    admissionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    qrIdentity: {
      type: Schema.Types.ObjectId,
      ref: 'QRIdentity',
    },
    notes: { type: String, trim: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'students',
  },
);

studentSchema.index({ branch: 1, status: 1 });
studentSchema.index({ branch: 1, createdAt: -1 });
studentSchema.index({ assignedCounselor: 1, status: 1 });
studentSchema.index({ 'contact.phone': 1 });
studentSchema.index({ 'contact.email': 1 });
studentSchema.index({ 'passport.number': 1 }, { sparse: true });

export const StudentModel: Model<StudentDocument> =
  mongoose.models.Student || mongoose.model<StudentDocument>('Student', studentSchema);