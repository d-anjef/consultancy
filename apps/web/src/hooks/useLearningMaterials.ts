'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  learningMaterialsApi,
  type ListMaterialsParams,
  type UploadMaterialMetadata,
} from '@/lib/api/learning-materials';

export function useLearningMaterials(params: ListMaterialsParams = {}) {
  return useQuery({
    queryKey: ['learning-materials', params],
    queryFn: () => learningMaterialsApi.list(params),
    staleTime: 30_000,
  });
}

export function useLearningMaterial(id: string) {
  return useQuery({
    queryKey: ['learning-materials', id],
    queryFn: () => learningMaterialsApi.getById(id),
    enabled: !!id,
  });
}

export function useUploadMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ metadata, file }: { metadata: UploadMaterialMetadata; file: File }) =>
      learningMaterialsApi.upload(metadata, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning-materials'] });
    },
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => learningMaterialsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning-materials'] });
    },
  });
}

export async function downloadMaterial(id: string, fileName: string): Promise<void> {
  const { url } = await learningMaterialsApi.getDownloadUrl(id);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}