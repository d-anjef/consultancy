import type { PaginationMeta } from '@consultancy/types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@consultancy/config';

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(input: PaginationInput): PaginationOptions {
  const page = Math.max(1, input.page || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, input.limit || DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}