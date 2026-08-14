'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  journeyApi,
  type StudentJourney,
  type MilestoneTemplate,
  type CreateTemplateInput,
  type UpdateTemplateInput,
  type CreateJourneyInput,
  type UpdateMilestoneStatusInput,
  type UpdateMilestoneNotesInput,
} from '@/lib/api/journey';

// Templates
export function useMilestoneTemplates(includeInactive = false) {
  return useQuery({
    queryKey: ['milestone-templates', { includeInactive }],
    queryFn: () => journeyApi.listTemplates(includeInactive),
    staleTime: 5 * 60_000,
  });
}

export function useMilestoneTemplate(id: string) {
  return useQuery({
    queryKey: ['milestone-templates', id],
    queryFn: () => journeyApi.getTemplateById(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTemplateInput) => journeyApi.createTemplate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestone-templates'] });
    },
  });
}

export function useUpdateTemplate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTemplateInput) => journeyApi.updateTemplate(id, input),
    onSuccess: (updated: MilestoneTemplate) => {
      qc.invalidateQueries({ queryKey: ['milestone-templates'] });
      qc.setQueryData(['milestone-templates', id], updated);
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => journeyApi.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestone-templates'] });
    },
  });
}

// Student Journeys
export function useStudentJourney(studentId: string) {
  return useQuery({
    queryKey: ['journey', 'student', studentId],
    queryFn: () => journeyApi.getStudentJourney(studentId),
    enabled: !!studentId,
  });
}

export function useMyJourney() {
  return useQuery({
    queryKey: ['journey', 'me'],
    queryFn: () => journeyApi.getOwnJourney(),
  });
}

export function useCreateJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJourneyInput) => journeyApi.createJourney(input),
    onSuccess: (journey: StudentJourney) => {
      qc.invalidateQueries({ queryKey: ['journey'] });
      qc.setQueryData(['journey', 'student', journey.student.id], journey);
    },
  });
}

export function useUpdateMilestoneStatus(journeyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMilestoneStatusInput) =>
      journeyApi.updateMilestoneStatus(journeyId, input),
    onSuccess: (journey: StudentJourney) => {
      qc.invalidateQueries({ queryKey: ['journey'] });
      qc.setQueryData(['journey', 'student', journey.student.id], journey);
    },
  });
}

export function useUpdateMilestoneNotes(journeyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMilestoneNotesInput) =>
      journeyApi.updateMilestoneNotes(journeyId, input),
    onSuccess: (journey: StudentJourney) => {
      qc.invalidateQueries({ queryKey: ['journey'] });
      qc.setQueryData(['journey', 'student', journey.student.id], journey);
    },
  });
}