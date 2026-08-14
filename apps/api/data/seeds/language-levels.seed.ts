import { Types } from 'mongoose';
import { LanguageLevelModel } from '../../src/modules/language-levels/language-level.model.js';
import { logger } from '../../src/lib/logger.js';

const DEFAULT_LEVELS = [
  {
    code: 'JLPT_N5',
    name: 'JLPT N5',
    description: 'Beginner — Basic phrases, hiragana, katakana, ~100 kanji',
    examType: 'JLPT' as const,
    order: 5,
    durationMonths: 3,
  },
  {
    code: 'JLPT_N4',
    name: 'JLPT N4',
    description: 'Elementary — Basic grammar, ~300 kanji, simple conversations',
    examType: 'JLPT' as const,
    order: 4,
    durationMonths: 4,
    prerequisiteCode: 'JLPT_N5',
  },
  {
    code: 'JLPT_N3',
    name: 'JLPT N3',
    description: 'Intermediate — Everyday Japanese, ~650 kanji',
    examType: 'JLPT' as const,
    order: 3,
    durationMonths: 5,
    prerequisiteCode: 'JLPT_N4',
  },
  {
    code: 'JLPT_N2',
    name: 'JLPT N2',
    description: 'Upper Intermediate — News, articles, ~1000 kanji',
    examType: 'JLPT' as const,
    order: 2,
    durationMonths: 6,
    prerequisiteCode: 'JLPT_N3',
  },
  {
    code: 'JLPT_N1',
    name: 'JLPT N1',
    description: 'Advanced — Business, academic, ~2000 kanji',
    examType: 'JLPT' as const,
    order: 1,
    durationMonths: 8,
    prerequisiteCode: 'JLPT_N2',
  },
];

export async function seedLanguageLevels(systemUserId: Types.ObjectId): Promise<void> {
  logger.info('Seeding default language levels...');

  // Create levels first (without prereq), then link
  const created: Record<string, Types.ObjectId> = {};

  for (const level of DEFAULT_LEVELS) {
    const existing = await LanguageLevelModel.findOne({ code: level.code }).lean();
    if (existing) {
      logger.info(`- Language level ${level.code} already exists`);
      created[level.code] = existing._id as Types.ObjectId;
      continue;
    }

    const doc = await LanguageLevelModel.create({
      code: level.code,
      name: level.name,
      description: level.description,
      examType: level.examType,
      order: level.order,
      durationMonths: level.durationMonths,
      isActive: true,
      createdBy: systemUserId,
    });
    created[level.code] = doc._id as Types.ObjectId;
    logger.info(`✓ Created language level: ${level.code}`);
  }

  // Wire up prerequisites
  for (const level of DEFAULT_LEVELS) {
    if (level.prerequisiteCode && created[level.prerequisiteCode]) {
      await LanguageLevelModel.updateOne(
        { code: level.code, prerequisiteId: { $exists: false } },
        { $set: { prerequisiteId: created[level.prerequisiteCode] } },
      );
    }
  }

  const total = await LanguageLevelModel.countDocuments();
  logger.info(`✓ Total language levels: ${total}`);
}