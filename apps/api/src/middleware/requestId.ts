import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'];
  req.requestId =
    typeof existingId === 'string' && existingId.length > 0
      ? existingId
      : `req_${crypto.randomBytes(12).toString('hex')}`;

  _res.setHeader('X-Request-Id', req.requestId);
  next();
}