'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  documentsApi,
  type DocumentEntity,
  type ListDocumentsParams,
  type UploadDocumentMetadata,
} from '@/lib/api/documents';

export function useDocuments(params: ListDocumentsParams = {}) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentsApi.list(params),
    staleTime: 30_000,
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: ['documents', 'stats'],
    queryFn: () => documentsApi.stats(),
    staleTime: 60_000,
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.getById(id),
    enabled: !!id,
  });
}

export function useMyDocuments() {
  return useQuery({
    queryKey: ['documents', 'me'],
    queryFn: () => documentsApi.getMyDocuments(),
    staleTime: 30_000,
  });
}

export function useDocumentVersions(id: string) {
  return useQuery({
    queryKey: ['documents', id, 'versions'],
    queryFn: () => documentsApi.getVersions(id),
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ metadata, file }: { metadata: UploadDocumentMetadata; file: File }) =>
      documentsApi.upload(metadata, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useUploadNewVersion(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => documentsApi.uploadNewVersion(id, file),
    onSuccess: (updated: DocumentEntity) => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.setQueryData(['documents', id], updated);
    },
  });
}

export function useMarkUnderReview(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => documentsApi.markUnderReview(id),
    onSuccess: (updated: DocumentEntity) => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.setQueryData(['documents', id], updated);
    },
  });
}

export function useVerifyDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => documentsApi.verify(id),
    onSuccess: (updated: DocumentEntity) => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.setQueryData(['documents', id], updated);
    },
  });
}

export function useApproveDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => documentsApi.approve(id),
    onSuccess: (updated: DocumentEntity) => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.setQueryData(['documents', id], updated);
    },
  });
}

export function useRejectDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => documentsApi.reject(id, reason),
    onSuccess: (updated: DocumentEntity) => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.setQueryData(['documents', id], updated);
    },
  });
}

export function useRequestResubmission(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => documentsApi.requestResubmission(id, reason),
    onSuccess: (updated: DocumentEntity) => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.setQueryData(['documents', id], updated);
    },
  });
}

export async function downloadDocument(id: string, fileName: string): Promise<void> {
  const { url } = await documentsApi.getDownloadUrl(id);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}