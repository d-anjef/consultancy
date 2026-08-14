import { Types } from 'mongoose';
import { ProgramModel } from '../../src/modules/programs/program.model.js';
import { logger } from '../../src/lib/logger.js';

const DEFAULT_PROGRAMS = [
  {
    code: 'LANG_JAPAN_BASIC',
    name: 'Japanese Language — Basic',
    description: 'Beginner Japanese for daily communication',
    type: 'LANGUAGE_SCHOOL',
    durationMonths: 6,
  },
  {
    code: 'LANG_JAPAN_INTERMEDIATE',
    name: 'Japanese Language — Intermediate',
    description: 'Intermediate Japanese (N4-N3 preparation)',
    type: 'LANGUAGE_SCHOOL',
    durationMonths: 12,
  },
  {
    code: 'UNIVERSITY_UG',
    name: 'University Undergraduate',
    description: 'Bachelor degree at Japanese university',
    type: 'UNIVERSITY',
    durationMonths: 48,
  },
  {
    code: 'UNIVERSITY_PG',
    name: 'University Postgraduate',
    description: 'Master degree at Japanese university',
    type: 'UNIVERSITY',
    durationMonths: 24,
  },
  {
    code: 'WORKING_SSW',
    name: 'Specified Skilled Worker (SSW)',
    description: 'Working visa via SSW program',
    type: 'WORKING',
    durationMonths: 60,
  },
  {
    code: 'VOCATIONAL_SENSHU',
    name: 'Vocational School (Senshugakkou)',
    description: 'Technical/vocational education',
    type: 'VOCATIONAL',
    durationMonths: 24,
  },
];

export async function seedPrograms(systemUserId: Types.ObjectId): Promise<void> {
  logger.info('Seeding default programs...');
  for (const p of DEFAULT_PROGRAMS) {
    const existing = await ProgramModel.findOne({ code: p.code }).lean();
    if (existing) {
      logger.info(`- Program ${p.code} already exists`);
      continue;
    }
    await ProgramModel.create({ ...p, isActive: true, createdBy: systemUserId });
    logger.info(`✓ Created program: ${p.code}`);
  }
  const total = await ProgramModel.countDocuments();
  logger.info(`✓ Total programs: ${total}`);
}