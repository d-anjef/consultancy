import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

export type DocumentStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED'
  | 'APPROVED';

export interface DocumentEntity {
  id: string;
  documentNumber: string;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  application?: {
    id: string;
    applicationNumber: string;
    status: string;
  } | null;
  branch: { id: string; code: string; name: string };
  documentType: string;
  documentName: string;
  description?: string;
  currentVersion: {
    id: string;
    versionNumber: number;
    file: {
      originalName: string;
      mimeType: string;
      sizeBytes: number;
    };
    uploadedAt: string;
  };
  versionCount: number;
  status: DocumentStatus;
  uploadedBy: { id: string; email: string; firstName: string; lastName: string };
  uploadedAt: string;
  reviewedBy?: { id: string; firstName: string; lastName: string } | null;
  reviewedAt?: string;
  verifiedBy?: { id: string; firstName: string; lastName: string } | null;
  verifiedAt?: string;
  approvedBy?: { id: string; firstName: string; lastName: string } | null;
  approvedAt?: string;
  rejectedBy?: { id: string; firstName: string; lastName: string } | null;
  rejectedAt?: string;
  rejectionReason?: string;
  resubmissionRequestedAt?: string;
  resubmissionReason?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  file: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
  isCurrent: boolean;
  uploadedBy: {
    email: string;
    name: string;
  } | null;
  uploadedAt: string;
}

export interface DocumentStats {
  total: number;
  byStatus: Record<string, number>;
}

export interface ListDocumentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: DocumentStatus;
  branchId?: string;
  studentId?: string;
  applicationId?: string;
  documentType?: string;
}

export interface UploadDocumentMetadata {
  studentId: string;
  applicationId?: string;
  documentType: string;
  documentName: string;
  description?: string;
  expiryDate?: string;
  notes?: string;
}

export const documentsApi = {
  list: async (
    params: ListDocumentsParams = {},
  ): Promise<{ items: DocumentEntity[]; pagination: PaginationMeta }> => {
    const items = await api.get<DocumentEntity[]>(
      '/documents',
      params as Record<string, unknown>,
    );
    return {
      items,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: items.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  },

  stats: (): Promise<DocumentStats> => api.get<DocumentStats>('/documents/stats'),

  getById: (id: string): Promise<DocumentEntity> =>
    api.get<DocumentEntity>(`/documents/${id}`),

  getMyDocuments: (): Promise<DocumentEntity[]> =>
    api.get<DocumentEntity[]>('/documents/me'),

  getVersions: (id: string): Promise<DocumentVersion[]> =>
    api.get<DocumentVersion[]>(`/documents/${id}/versions`),

  getDownloadUrl: (id: string): Promise<{ url: string }> =>
    api.get<{ url: string }>(`/documents/${id}/download`),

  upload: async (
    metadata: UploadDocumentMetadata,
    file: File,
  ): Promise<DocumentEntity> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('studentId', metadata.studentId);
    formData.append('documentType', metadata.documentType);
    formData.append('documentName', metadata.documentName);
    if (metadata.applicationId) formData.append('applicationId', metadata.applicationId);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.expiryDate) formData.append('expiryDate', metadata.expiryDate);
    if (metadata.notes) formData.append('notes', metadata.notes);

    // Direct fetch (bypasses axios for multipart)
    const response = await fetch('/api/v1/documents/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Upload failed');
    }
    return data.data;
  },

  uploadNewVersion: async (id: string, file: File): Promise<DocumentEntity> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/v1/documents/${id}/version`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Upload failed');
    }
    return data.data;
  },

  markUnderReview: (id: string): Promise<DocumentEntity> =>
    api.post<DocumentEntity>(`/documents/${id}/review`),

  verify: (id: string): Promise<DocumentEntity> =>
    api.post<DocumentEntity>(`/documents/${id}/verify`),

  approve: (id: string): Promise<DocumentEntity> =>
    api.post<DocumentEntity>(`/documents/${id}/approve`),

  reject: (id: string, reason: string): Promise<DocumentEntity> =>
    api.post<DocumentEntity>(`/documents/${id}/reject`, { reason }),

  requestResubmission: (id: string, reason: string): Promise<DocumentEntity> =>
    api.post<DocumentEntity>(`/documents/${id}/request-resubmission`, { reason }),
};