import type { Response } from 'express';
import type { PaginationMeta } from '@consultancy/types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: { pagination?: PaginationMeta; [key: string]: unknown },
): void {
  const response: { success: true; data: T; meta?: typeof meta } = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number,
  details?: unknown,
  requestId?: string,
): void {
  const response: {
    success: false;
    error: {
      code: string;
      message: string;
      details?: unknown;
      requestId?: string;
    };
  } = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    response.error.details = details;
  }

  if (requestId) {
    response.error.requestId = requestId;
  }

  res.status(statusCode).json(response);
}