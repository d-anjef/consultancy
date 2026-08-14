import { ERROR_CODES, type ErrorCode } from '@consultancy/config';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ERROR_CODES.VALIDATION_ERROR, message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(ERROR_CODES.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(ERROR_CODES.FORBIDDEN, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, identifier?: string) {
    const message = identifier
      ? `${entity} with identifier "${identifier}" not found`
      : `${entity} not found`;
    super(ERROR_CODES.NOT_FOUND, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ERROR_CODES.CONFLICT, message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(ERROR_CODES.RATE_LIMITED, message, 429);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ERROR_CODES.BUSINESS_RULE_ERROR, message, 422, details);
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(entity: string, fromStatus: string, toStatus: string) {
    super(
      ERROR_CODES.INVALID_STATE_TRANSITION,
      `Cannot transition ${entity} from "${fromStatus}" to "${toStatus}"`,
      422,
      { entity, fromStatus, toStatus },
    );
  }
}

export class InternalError extends AppError {
  constructor(message = 'An unexpected error occurred') {
    super(ERROR_CODES.INTERNAL_ERROR, message, 500, undefined, false);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}