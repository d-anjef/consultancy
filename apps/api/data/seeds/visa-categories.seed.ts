import { Types } from 'mongoose';
import { VisaCategoryModel } from '../../src/modules/visa-categories/visa-category.model.js';
import { logger } from '../../src/lib/logger.js';

const DEFAULT_VISA_CATEGORIES = [
  {
    code: 'STUDENT',
    name: 'Student Visa',
    description: 'For attending Japanese language or university',
    requiredDocumentTypes: ['PASSPORT', 'TRANSCRIPT', 'PHOTO', 'BANK_STATEMENT', 'SPONSOR_LETTER'],
  },
  {
    code: 'WORKING',
    name: 'Working Visa',
    description: 'For employment in Japan (SSW, Engineer, etc.)',
    requiredDocumentTypes: ['PASSPORT', 'PHOTO', 'RESUME', 'EDUCATION_CERT', 'HEALTH_CERT'],
  },
  {
    code: 'LANGUAGE_ONLY',
    name: 'Language School Only',
    description: 'Short-term Japanese language study',
    requiredDocumentTypes: ['PASSPORT', 'PHOTO', 'BANK_STATEMENT'],
  },
];

export async function seedVisaCategories(systemUserId: Types.ObjectId): Promise<void> {
  logger.info('Seeding default visa categories...');
  for (const v of DEFAULT_VISA_CATEGORIES) {
    const existing = await VisaCategoryModel.findOne({ code: v.code }).lean();
    if (existing) {
      logger.info(`- Visa category ${v.code} already exists`);
      continue;
    }
    await VisaCategoryModel.create({ ...v, isActive: true, createdBy: systemUserId });
    logger.info(`✓ Created visa category: ${v.code}`);
  }
  const total = await VisaCategoryModel.countDocuments();
  logger.info(`✓ Total visa categories: ${total}`);
}