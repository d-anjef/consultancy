import { api } from '@/lib/api/client';

export interface Branch {
  id: string;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const branchesApi = {
  list: () => api.get<Branch[]>('/branches/active'),
  getById: (id: string) => api.get<Branch>(`/branches/${id}`),
};