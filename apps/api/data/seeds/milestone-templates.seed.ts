import { Types } from 'mongoose';
import { MilestoneTemplateModel } from '../../src/modules/journey/milestone-template.model.js';
import { VisaCategoryModel } from '../../src/modules/visa-categories/visa-category.model.js';
import { logger } from '../../src/lib/logger.js';

const TEMPLATES = [
  {
    visaCode: 'STUDENT',
    name: 'Student Visa Journey',
    description: 'Standard milestones for university/language school applications',
    milestones: [
      { key: 'registration', title: 'Registration Complete', order: 1, isRequired: true, estimatedDays: 1 },
      { key: 'documents_collected', title: 'Documents Collected', order: 2, isRequired: true, estimatedDays: 14 },
      { key: 'documents_verified', title: 'Documents Verified', order: 3, isRequired: true, estimatedDays: 7 },
      { key: 'language_enrolled', title: 'Language Class Enrolled', order: 4, isRequired: false, estimatedDays: 3 },
      { key: 'language_level_n5', title: 'JLPT N5 Level Completed', order: 5, isRequired: false, estimatedDays: 90 },
      { key: 'language_level_n4', title: 'JLPT N4 Level Completed', order: 6, isRequired: false, estimatedDays: 120 },
      { key: 'exam_registered', title: 'JLPT Exam Registered', order: 7, isRequired: false, estimatedDays: 30 },
      { key: 'exam_passed', title: 'JLPT Exam Passed', order: 8, isRequired: false, estimatedDays: 60 },
      { key: 'school_application', title: 'School Application Submitted', order: 9, isRequired: true, estimatedDays: 14 },
      { key: 'school_acceptance', title: 'School Acceptance Received', order: 10, isRequired: true, estimatedDays: 60 },
      { key: 'visa_application', title: 'Visa Application Submitted', order: 11, isRequired: true, estimatedDays: 14 },
      { key: 'visa_interview', title: 'Visa Interview Completed', order: 12, isRequired: false, estimatedDays: 30 },
      { key: 'visa_approved', title: 'Visa Approved', order: 13, isRequired: true, estimatedDays: 30 },
      { key: 'flight_booked', title: 'Flight Booked', order: 14, isRequired: true, estimatedDays: 14 },
      { key: 'departed', title: 'Departed for Japan', order: 15, isRequired: true, estimatedDays: 1 },
    ],
  },
  {
    visaCode: 'WORKING',
    name: 'Working Visa (SSW) Journey',
    description: 'Milestones for Specified Skilled Worker visa applications',
    milestones: [
      { key: 'registration', title: 'Registration Complete', order: 1, isRequired: true, estimatedDays: 1 },
      { key: 'documents_collected', title: 'Documents Collected', order: 2, isRequired: true, estimatedDays: 14 },
      { key: 'documents_verified', title: 'Documents Verified', order: 3, isRequired: true, estimatedDays: 7 },
      { key: 'skill_training', title: 'Skill Training Enrolled', order: 4, isRequired: true, estimatedDays: 30 },
      { key: 'language_basic', title: 'Basic Japanese (N5) Achieved', order: 5, isRequired: true, estimatedDays: 90 },
      { key: 'skill_exam_passed', title: 'Skill Test Exam Passed', order: 6, isRequired: true, estimatedDays: 60 },
      { key: 'employer_matched', title: 'Employer Matched', order: 7, isRequired: true, estimatedDays: 30 },
      { key: 'contract_signed', title: 'Employment Contract Signed', order: 8, isRequired: true, estimatedDays: 14 },
      { key: 'visa_application', title: 'Visa Application Submitted', order: 9, isRequired: true, estimatedDays: 14 },
      { key: 'visa_approved', title: 'Visa Approved', order: 10, isRequired: true, estimatedDays: 45 },
      { key: 'flight_booked', title: 'Flight Booked', order: 11, isRequired: true, estimatedDays: 14 },
      { key: 'departed', title: 'Departed for Japan', order: 12, isRequired: true, estimatedDays: 1 },
    ],
  },
  {
    visaCode: 'LANGUAGE_ONLY',
    name: 'Language School Only Journey',
    description: 'Milestones for short-term language study',
    milestones: [
      { key: 'registration', title: 'Registration Complete', order: 1, isRequired: true, estimatedDays: 1 },
      { key: 'documents_collected', title: 'Documents Collected', order: 2, isRequired: true, estimatedDays: 14 },
      { key: 'documents_verified', title: 'Documents Verified', order: 3, isRequired: true, estimatedDays: 7 },
      { key: 'school_application', title: 'Language School Application', order: 4, isRequired: true, estimatedDays: 14 },
      { key: 'school_acceptance', title: 'Acceptance Letter Received', order: 5, isRequired: true, estimatedDays: 45 },
      { key: 'visa_application', title: 'Student Visa Application', order: 6, isRequired: true, estimatedDays: 14 },
      { key: 'visa_approved', title: 'Visa Approved', order: 7, isRequired: true, estimatedDays: 30 },
      { key: 'flight_booked', title: 'Flight Booked', order: 8, isRequired: true, estimatedDays: 14 },
      { key: 'departed', title: 'Departed for Japan', order: 9, isRequired: true, estimatedDays: 1 },
    ],
  },
];

export async function seedMilestoneTemplates(systemUserId: Types.ObjectId): Promise<void> {
  logger.info('Seeding default milestone templates...');

  for (const template of TEMPLATES) {
    const visa = await VisaCategoryModel.findOne({ code: template.visaCode }).lean();
    if (!visa) {
      logger.warn(`- Visa category ${template.visaCode} not found, skipping template`);
      continue;
    }

    const existing = await MilestoneTemplateModel.findOne({
      visaCategory: visa._id,
    }).lean();
    if (existing) {
      logger.info(`- Template for ${template.visaCode} already exists`);
      continue;
    }

    await MilestoneTemplateModel.create({
      visaCategory: visa._id,
      name: template.name,
      description: template.description,
      milestones: template.milestones,
      isActive: true,
      createdBy: systemUserId,
    });
    logger.info(`✓ Created milestone template: ${template.visaCode}`);
  }

  const total = await MilestoneTemplateModel.countDocuments();
  logger.info(`✓ Total milestone templates: ${total}`);
}