import { Types } from 'mongoose';
import {
  MilestoneTemplateModel,
  type MilestoneTemplateDocument,
  type MilestoneTemplateItem,
} from './milestone-template.model.js';
import {
  StudentJourneyModel,
  type StudentJourneyDocument,
  type StudentMilestoneItem,
  type MilestoneStatus,
} from './student-milestone.model.js';

const TEMPLATE_POPULATE = [
  { path: 'visaCategory', select: 'code name' },
  { path: 'createdBy', select: 'email profile.firstName profile.lastName' },
];

const JOURNEY_POPULATE = [
  { path: 'student', select: 'studentId personal.firstName personal.lastName' },
  { path: 'visaCategory', select: 'code name' },
  { path: 'application', select: 'applicationNumber status' },
];

// ─── Milestone Templates ───────────────────────────

export interface CreateTemplateData {
  visaCategory: Types.ObjectId;
  name: string;
  description?: string;
  milestones: MilestoneTemplateItem[];
  createdBy: Types.ObjectId;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  milestones?: MilestoneTemplateItem[];
  isActive?: boolean;
  updatedBy: Types.ObjectId;
}

// ─── Student Journeys ───────────────────────────────

export interface CreateJourneyData {
  student: Types.ObjectId;
  application?: Types.ObjectId;
  visaCategory: Types.ObjectId;
  templateId?: Types.ObjectId;
  milestones: StudentMilestoneItem[];
  createdBy: Types.ObjectId;
}

export interface UpdateMilestoneStatusData {
  milestoneKey: string;
  status: MilestoneStatus;
  notes?: string;
  completedBy: Types.ObjectId;
}

export class JourneyRepository {
  // ─── Templates ───────────────────────────────────

  async listTemplates(includeInactive = false): Promise<MilestoneTemplateDocument[]> {
    const query = includeInactive ? {} : { isActive: true };
    return MilestoneTemplateModel.find(query)
      .populate(TEMPLATE_POPULATE)
      .sort({ createdAt: -1 })
      .lean<MilestoneTemplateDocument[]>();
  }

  async findTemplateById(id: string): Promise<MilestoneTemplateDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return MilestoneTemplateModel.findById(id)
      .populate(TEMPLATE_POPULATE)
      .lean<MilestoneTemplateDocument | null>();
  }

  async findTemplateByVisaCategory(
    visaCategoryId: string,
  ): Promise<MilestoneTemplateDocument | null> {
    if (!Types.ObjectId.isValid(visaCategoryId)) return null;
    return MilestoneTemplateModel.findOne({
      visaCategory: new Types.ObjectId(visaCategoryId),
      isActive: true,
    })
      .populate(TEMPLATE_POPULATE)
      .lean<MilestoneTemplateDocument | null>();
  }

  async createTemplate(data: CreateTemplateData): Promise<MilestoneTemplateDocument> {
    const created = await MilestoneTemplateModel.create(data);
    const populated = await MilestoneTemplateModel.findById(created._id)
      .populate(TEMPLATE_POPULATE)
      .lean<MilestoneTemplateDocument | null>();
    if (!populated) throw new Error('Failed to load created template');
    return populated;
  }

  async updateTemplate(
    id: string,
    data: UpdateTemplateData,
  ): Promise<MilestoneTemplateDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const updateOps: Record<string, unknown> = {};
    if (data.name !== undefined) updateOps.name = data.name;
    if (data.description !== undefined) updateOps.description = data.description;
    if (data.milestones !== undefined) updateOps.milestones = data.milestones;
    if (data.isActive !== undefined) updateOps.isActive = data.isActive;
    updateOps.updatedBy = data.updatedBy;

    return MilestoneTemplateModel.findByIdAndUpdate(id, { $set: updateOps }, { new: true })
      .populate(TEMPLATE_POPULATE)
      .lean<MilestoneTemplateDocument | null>();
  }

  async deleteTemplate(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await MilestoneTemplateModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  // ─── Student Journeys ───────────────────────────

  async findJourneyByStudent(studentId: string): Promise<StudentJourneyDocument | null> {
    if (!Types.ObjectId.isValid(studentId)) return null;
    return StudentJourneyModel.findOne({ student: new Types.ObjectId(studentId) })
      .populate(JOURNEY_POPULATE)
      .lean<StudentJourneyDocument | null>();
  }

  async findJourneyById(id: string): Promise<StudentJourneyDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return StudentJourneyModel.findById(id)
      .populate(JOURNEY_POPULATE)
      .lean<StudentJourneyDocument | null>();
  }

  async createJourney(data: CreateJourneyData): Promise<StudentJourneyDocument> {
    const created = await StudentJourneyModel.create(data);
    const populated = await StudentJourneyModel.findById(created._id)
      .populate(JOURNEY_POPULATE)
      .lean<StudentJourneyDocument | null>();
    if (!populated) throw new Error('Failed to load created journey');
    return populated;
  }

  async updateMilestoneStatus(
    journeyId: string,
    data: UpdateMilestoneStatusData,
  ): Promise<StudentJourneyDocument | null> {
    if (!Types.ObjectId.isValid(journeyId)) return null;

    const journey = await StudentJourneyModel.findById(journeyId);
    if (!journey) return null;

    // Update the specific milestone
    const milestone = journey.milestones.find((m) => m.key === data.milestoneKey);
    if (!milestone) return null;

    const now = new Date();
    milestone.status = data.status;
    if (data.notes !== undefined) milestone.notes = data.notes;

    if (data.status === 'IN_PROGRESS' && !milestone.startedAt) {
      milestone.startedAt = now;
    }
    if (data.status === 'COMPLETED') {
      milestone.completedAt = now;
      milestone.completedBy = data.completedBy;
      if (!milestone.startedAt) milestone.startedAt = now;
    }
    if (data.status === 'NOT_STARTED') {
      milestone.startedAt = undefined;
      milestone.completedAt = undefined;
      milestone.completedBy = undefined;
    }

    // Recalculate current milestone and progress
    const requiredMilestones = journey.milestones.filter((m) => m.isRequired);
    const completedRequired = requiredMilestones.filter((m) => m.status === 'COMPLETED');
    journey.overallProgress =
      requiredMilestones.length > 0
        ? Math.round((completedRequired.length / requiredMilestones.length) * 100)
        : 0;

    // Current milestone = first non-completed (by order)
    const sortedMilestones = [...journey.milestones].sort((a, b) => a.order - b.order);
    const currentMilestone = sortedMilestones.find(
      (m) => m.status !== 'COMPLETED' && m.status !== 'SKIPPED',
    );
    journey.currentMilestoneKey = currentMilestone?.key;

    journey.updatedBy = data.completedBy;
    await journey.save();

    return StudentJourneyModel.findById(journeyId)
      .populate(JOURNEY_POPULATE)
      .lean<StudentJourneyDocument | null>();
  }

  async updateMilestoneNotes(
    journeyId: string,
    milestoneKey: string,
    notes: string,
    updatedBy: Types.ObjectId,
  ): Promise<StudentJourneyDocument | null> {
    if (!Types.ObjectId.isValid(journeyId)) return null;

    const journey = await StudentJourneyModel.findById(journeyId);
    if (!journey) return null;

    const milestone = journey.milestones.find((m) => m.key === milestoneKey);
    if (!milestone) return null;

    milestone.notes = notes;
    journey.updatedBy = updatedBy;
    await journey.save();

    return StudentJourneyModel.findById(journeyId)
      .populate(JOURNEY_POPULATE)
      .lean<StudentJourneyDocument | null>();
  }
}

export const journeyRepository = new JourneyRepository();