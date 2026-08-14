import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { leadService } from './lead.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../lib/response.js';
import { auditService } from '../audit/audit.service.js';
import { extractAuditContext } from '../../middleware/auditLogger.js';
import { UnauthorizedError } from '../../lib/errors.js';
import { env } from '../../../config/env.js';
import { userRepository } from '../users/user.repository.js';

function actorFromReq(req: Request) {
  if (!req.currentUser) throw new UnauthorizedError();
  return {
    id: req.currentUser.id,
    role: req.currentUser.role.code as RoleCode,
    branch: req.currentUser.branch?.id ?? null,
  };
}

export class LeadController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await leadService.listLeads(req.query as never, actorFromReq(req));
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await leadService.getLeadStats(actorFromReq(req)));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await leadService.getLeadById(req.params.id!, actorFromReq(req)));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      const lead = await leadService.createLead(req.body, actor);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'LEAD_CREATED',
        category: 'LEAD',
        entity: {
          type: 'LEAD',
          id: lead.id,
          displayName: `${lead.leadNumber} — ${lead.personal.firstName} ${lead.personal.lastName}`,
        },
        changes: { after: { source: lead.source, status: lead.status } },
      });

      sendCreated(res, lead);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      const lead = await leadService.updateLead(req.params.id!, req.body, actor);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'LEAD_UPDATED',
        category: 'LEAD',
        entity: { type: 'LEAD', id: lead.id, displayName: lead.leadNumber },
      });

      sendSuccess(res, lead);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      const before = await leadService.getLeadById(req.params.id!, actor);
      const lead = await leadService.updateStatus(req.params.id!, req.body, actor);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'LEAD_STATUS_CHANGED',
        category: 'LEAD',
        entity: { type: 'LEAD', id: lead.id, displayName: lead.leadNumber },
        changes: {
          before: { status: before.status },
          after: { status: lead.status },
        },
      });

      sendSuccess(res, lead);
    } catch (error) {
      next(error);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      const lead = await leadService.assignCounselor(req.params.id!, req.body, actor);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'LEAD_ASSIGNED',
        category: 'LEAD',
        entity: { type: 'LEAD', id: lead.id, displayName: lead.leadNumber },
      });

      sendSuccess(res, lead);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      const lead = await leadService.getLeadById(req.params.id!, actor);
      await leadService.deleteLead(req.params.id!, actor);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'LEAD_DELETED',
        category: 'LEAD',
        entity: { type: 'LEAD', id: lead.id, displayName: lead.leadNumber },
      });

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async intake(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const apiKey = req.headers['x-api-key'];
      if (!apiKey || apiKey !== env.LEAD_INTAKE_API_KEY) {
        throw new UnauthorizedError('Invalid or missing API key');
      }

      const systemUser = await this.findSystemUserId();
      const lead = await leadService.intakeLead(req.body, systemUser);

      await auditService.log({
        actor: systemUser,
        actorRole: 'SYSTEM',
        action: 'LEAD_CREATED',
        category: 'LEAD',
        entity: { type: 'LEAD', id: lead.id, displayName: lead.leadNumber },
        requestId: req.requestId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      sendCreated(res, {
        id: lead.id,
        leadNumber: lead.leadNumber,
        status: lead.status,
      });
    } catch (error) {
      next(error);
    }
  }

  private async findSystemUserId(): Promise<string> {
    const { items = [] } = await userRepository.list({ status: 'ACTIVE' }, 1, 1);
    const [user] = items;
    if (user?._id) return String(user._id);
    throw new Error('No active user for system attribution');
  }
}

export const leadController = new LeadController();