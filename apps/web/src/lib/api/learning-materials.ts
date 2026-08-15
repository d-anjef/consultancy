import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

export type MaterialCategory =
  | 'GRAMMAR' | 'VOCABULARY' | 'KANJI' | 'READING' | 'LISTENING'
  | 'SPEAKING' | 'WRITING' | 'CULTURE' | 'EXAM_PREP' | 'OTHER';

export interface LearningMaterial {
  id: string;
  title: string;
  description?: string;
  category: MaterialCategory;
  languageLevel?: { id: string; code: string; name: string; examType: string } | null;
  tags: string[];
  file: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
  uploadedBy: { id: string; firstName: string; lastName: string; email: string };
  branch: { id: string; code: string; name: string };
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadMaterialMetadata {
  title: string;
  description?: string;
  category: MaterialCategory;
  languageLevelId?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface ListMaterialsParams {
  page?: number;
  limit?: number;
  category?: MaterialCategory;
  languageLevelId?: string;
  search?: string;
}

export const learningMaterialsApi = {
  list: async (params: ListMaterialsParams = {}) => {
    const items = await api.get<LearningMaterial[]>(
      '/learning-materials',
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
      } as PaginationMeta,
    };
  },

  getById: (id: string): Promise<LearningMaterial> =>
    api.get<LearningMaterial>(`/learning-materials/${id}`),

  getDownloadUrl: (id: string): Promise<{ url: string }> =>
    api.get<{ url: string }>(`/learning-materials/${id}/download`),

  upload: async (metadata: UploadMaterialMetadata, file: File): Promise<LearningMaterial> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', metadata.title);
  formData.append('category', metadata.category);
  if (metadata.description) formData.append('description', metadata.description);
  if (metadata.languageLevelId) formData.append('languageLevelId', metadata.languageLevelId);
  if (metadata.tags) formData.append('tags', metadata.tags.join(','));
  if (metadata.isPublic !== undefined) formData.append('isPublic', String(metadata.isPublic));

  // Respect NEXT_PUBLIC_API_BASE_URL; fall back to Next.js proxy path
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '/api/v1';

  const response = await fetch(`${baseUrl}/learning-materials/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';

  // Server returned HTML (e.g., 404 page) — surface a clean error
  if (!contentType.includes('application/json')) {
    throw new Error(
      `Upload failed (${response.status}): endpoint returned non-JSON. Check that ${baseUrl}/learning-materials/upload is mounted.`,
    );
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || `Upload failed (${response.status})`);
  }
  return data.data;
},

  delete: (id: string): Promise<void> => api.delete<void>(`/learning-materials/${id}`),
};