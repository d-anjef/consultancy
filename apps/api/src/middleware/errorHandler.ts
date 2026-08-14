import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { isAppError } from '../lib/errors.js';
import { sendError } from '../lib/response.js';
import { logger } from '../lib/logger.js';
import { ERROR_CODES } from '@consultancy/config';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = req.requestId || 'unknown';

  // If response already sent, delegate to Express default handler
  if (res.headersSent) {
    logger.warn(
      { requestId, error: err.message, path: req.path },
      'Error occurred AFTER response was sent — delegating to default handler',
    );
    return next(err);
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    logger.warn(
      { requestId, errors: formattedErrors, path: req.path },
      'Validation error',
    );

    sendError(
      res,
      ERROR_CODES.VALIDATION_ERROR,
      'Validation failed',
      400,
      formattedErrors,
      requestId,
    );
    return;
  }

  if (isAppError(err)) {
    if (err.statusCode >= 500) {
      logger.error(
        { requestId, error: err, path: req.path, method: req.method },
        err.message,
      );
    } else {
      logger.warn(
        { requestId, code: err.code, message: err.message, path: req.path },
        'Application error',
      );
    }

    sendError(res, err.code, err.message, err.statusCode, err.details, requestId);
    return;
  }

  logger.error(
    {
      requestId,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      path: req.path,
      method: req.method,
    },
    'Unhandled error',
  );

  sendError(
    res,
    ERROR_CODES.INTERNAL_ERROR,
    'An unexpected error occurred',
    500,
    undefined,
    requestId,
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    ERROR_CODES.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`,
    404,
    undefined,
    req.requestId,
  );
}