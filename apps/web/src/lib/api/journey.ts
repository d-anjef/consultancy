import { api } from '@/lib/api/client';

export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface MilestoneItem {
  key: string;
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
  estimatedDays?: number;
}

export interface StudentMilestone extends MilestoneItem {
  status: MilestoneStatus;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface MilestoneTemplate {
  id: string;
  visaCategory: { id: string; code: string; name: string };
  name: string;
  description?: string;
  milestones: MilestoneItem[];
  milestoneCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentJourney {
  id: string;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  application?: { id: string; applicationNumber: string; status: string } | null;
  visaCategory: { id: string; code: string; name: string };
  templateId?: string;
  milestones: StudentMilestone[];
  currentMilestone?: StudentMilestone | null;
  overallProgress: number;
  completedCount: number;
  totalRequired: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  visaCategoryId: string;
  name: string;
  description?: string;
  milestones: MilestoneItem[];
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  milestones?: MilestoneItem[];
  isActive?: boolean;
}

export interface CreateJourneyInput {
  studentId: string;
  applicationId?: string;
  visaCategoryId?: string;
}

export interface UpdateMilestoneStatusInput {
  milestoneKey: string;
  status: MilestoneStatus;
  notes?: string;
}

export interface UpdateMilestoneNotesInput {
  milestoneKey: string;
  notes: string;
}

export const journeyApi = {
  // Templates
  listTemplates: (includeInactive = false): Promise<MilestoneTemplate[]> =>
    api.get<MilestoneTemplate[]>('/templates', { includeInactive }),

  getTemplateById: (id: string): Promise<MilestoneTemplate> =>
    api.get<MilestoneTemplate>(`/templates/${id}`),

  createTemplate: (input: CreateTemplateInput): Promise<MilestoneTemplate> =>
    api.post<MilestoneTemplate>('/templates', input),

  updateTemplate: (id: string, input: UpdateTemplateInput): Promise<MilestoneTemplate> =>
    api.patch<MilestoneTemplate>(`/templates/${id}`, input),

  deleteTemplate: (id: string): Promise<void> =>
    api.delete<void>(`/templates/${id}`),

  // Student Journeys
  getStudentJourney: (studentId: string): Promise<StudentJourney | null> =>
    api.get<StudentJourney | null>(`/journey/student/${studentId}`),

  getOwnJourney: (): Promise<StudentJourney | null> =>
    api.get<StudentJourney | null>('/journey/me'),

  createJourney: (input: CreateJourneyInput): Promise<StudentJourney> =>
    api.post<StudentJourney>('/journey', input),

  updateMilestoneStatus: (
    journeyId: string,
    input: UpdateMilestoneStatusInput,
  ): Promise<StudentJourney> =>
    api.patch<StudentJourney>(`/journey/${journeyId}/milestone-status`, input),

  updateMilestoneNotes: (
    journeyId: string,
    input: UpdateMilestoneNotesInput,
  ): Promise<StudentJourney> =>
    api.patch<StudentJourney>(`/journey/${journeyId}/milestone-notes`, input),
};