import { Types } from 'mongoose';
import { BranchModel } from '../../src/modules/branches/branch.model.js';
import { logger } from '../../src/lib/logger.js';

interface SeedBranchData {
  code: string;
  name: string;
  address: {
    street: string;
    city: string;
    district: string;
    province: string;
    country: string;
    postalCode?: string;
  };
  phone: string;
  email: string;
  timezone: string;
}

const DEFAULT_BRANCHES: SeedBranchData[] = [
  {
    code: 'BRN-KTM-01',
    name: 'Kathmandu Main Branch',
    address: {
      street: 'Putalisadak',
      city: 'Kathmandu',
      district: 'Kathmandu',
      province: 'Bagmati',
      country: 'Nepal',
      postalCode: '44600',
    },
    phone: '+9771111111',
    email: 'kathmandu@chibaeducation.com',
    timezone: 'Asia/Kathmandu',
  },
  {
    code: 'BRN-PKR-01',
    name: 'Pokhara Branch',
    address: {
      street: 'Lakeside',
      city: 'Pokhara',
      district: 'Kaski',
      province: 'Gandaki',
      country: 'Nepal',
      postalCode: '33700',
    },
    phone: '+9772222222',
    email: 'pokhara@chibaeducation.com',
    timezone: 'Asia/Kathmandu',
  },
];

export async function seedBranches(systemUserId: Types.ObjectId): Promise<void> {
  logger.info('Seeding default branches...');

  for (const branchData of DEFAULT_BRANCHES) {
    const existing = await BranchModel.findOne({ code: branchData.code }).lean();

    if (existing) {
      logger.info(`- Branch ${branchData.code} already exists — skipping`);
      continue;
    }

    await BranchModel.create({
      ...branchData,
      isActive: true,
      createdBy: systemUserId,
    });

    logger.info(`✓ Created branch: ${branchData.code} (${branchData.name})`);
  }

  const total = await BranchModel.countDocuments();
  logger.info(`✓ Total branches in DB: ${total}`);
}