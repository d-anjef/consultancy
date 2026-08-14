import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type MaterialCategory =
  | 'GRAMMAR'
  | 'VOCABULARY'
  | 'KANJI'
  | 'READING'
  | 'LISTENING'
  | 'SPEAKING'
  | 'WRITING'
  | 'CULTURE'
  | 'EXAM_PREP'
  | 'OTHER';

export interface MaterialStorage {
  provider: 'R2';
  bucket: string;
  key: string;
}

export interface MaterialFile {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
}

export interface LearningMaterialDocument extends Document {
  title: string;
  description?: string;
  category: MaterialCategory;
  languageLevel?: Types.ObjectId;
  tags: string[];
  storage: MaterialStorage;
  file: MaterialFile;
  uploadedBy: Types.ObjectId;
  branch: Types.ObjectId;
  isPublic: boolean;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const storageSchema = new Schema<MaterialStorage>(
  {
    provider: { type: String, required: true, enum: ['R2'] },
    bucket: { type: String, required: true },
    key: { type: String, required: true },
  },
  { _id: false },
);

const fileSchema = new Schema<MaterialFile>(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    checksum: { type: String, required: true },
  },
  { _id: false },
);

const learningMaterialSchema = new Schema<LearningMaterialDocument>(
  {
    title: { type: String, required: true, trim: true, index: 'text' },
    description: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        'GRAMMAR',
        'VOCABULARY',
        'KANJI',
        'READING',
        'LISTENING',
        'SPEAKING',
        'WRITING',
        'CULTURE',
        'EXAM_PREP',
        'OTHER',
      ],
      index: true,
    },
    languageLevel: { type: Schema.Types.ObjectId, ref: 'LanguageLevel', index: true },
    tags: { type: [String], default: [] },
    storage: { type: storageSchema, required: true },
    file: { type: fileSchema, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    isPublic: { type: Boolean, default: true, index: true },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'learning_materials' },
);

learningMaterialSchema.index({ category: 1, languageLevel: 1 });
learningMaterialSchema.index({ tags: 1 });

export const LearningMaterialModel: Model<LearningMaterialDocument> =
  mongoose.models.LearningMaterial ||
  mongoose.model<LearningMaterialDocument>('LearningMaterial', learningMaterialSchema);