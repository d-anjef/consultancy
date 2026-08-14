import type { Request } from 'express';
import type { SessionUser } from './authenticate.js';

export interface AuditContext {
  actor: string;
  actorRole: string;
  branch: string | null;
  requestId: string;
  ipAddress: string;
  userAgent: string;
}

export function extractAuditContext(req: Request): AuditContext {
  const user = req.currentUser as SessionUser | undefined;

  return {
    actor: user?.id || 'system',
    actorRole: user?.role.code || 'SYSTEM',
    branch: user?.branch?.id || null,
    requestId: req.requestId || 'unknown',
    ipAddress:
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };
}