import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { journeyService } from './journey.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../lib/response.js';
import { auditService } from '../audit/audit.service.js';
import { extractAuditContext } from '../../middleware/auditLogger.js';
import { UnauthorizedError } from '../../lib/errors.js';

function actorFromReq(req: Request) {
  if (!req.currentUser) throw new UnauthorizedError();
  return {
    id: req.currentUser.id,
    role: req.currentUser.role.code as RoleCode,
    branch: req.currentUser.branch?.id ?? null,
  };
}

export class JourneyController {
  // ─── Templates ───────────────────────────────────

  async listTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      sendSuccess(res, await journeyService.listTemplates(includeInactive));
    } catch (error) {
      next(error);
    }
  }

  async getTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await journeyService.getTemplateById(req.params.id!));
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const template = await journeyService.createTemplate(req.body, req.currentUser.id);
      await auditService.log({
        ...extractAuditContext(req),
        action: 'MILESTONE_TEMPLATE_CREATED',
        category: 'SYSTEM',
        entity: {
          type: 'MILESTONE_TEMPLATE',
          id: template.id,
          displayName: template.name,
        },
      });
      sendCreated(res, template);
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const template = await journeyService.updateTemplate(
        req.params.id!,
        req.body,
        req.currentUser.id,
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'MILESTONE_TEMPLATE_UPDATED',
        category: 'SYSTEM',
        entity: {
          type: 'MILESTONE_TEMPLATE',
          id: template.id,
          displayName: template.name,
        },
      });
      sendSuccess(res, template);
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await journeyService.getTemplateById(req.params.id!);
      await journeyService.deleteTemplate(req.params.id!);
      await auditService.log({
        ...extractAuditContext(req),
        action: 'MILESTONE_TEMPLATE_DELETED',
        category: 'SYSTEM',
        entity: {
          type: 'MILESTONE_TEMPLATE',
          id: template.id,
          displayName: template.name,
        },
      });
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ─── Student Journeys ───────────────────────────

  async getStudentJourney(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const journey = await journeyService.getJourneyByStudent(
        req.params.studentId!,
        actorFromReq(req),
      );
      sendSuccess(res, journey);
    } catch (error) {
      next(error);
    }
  }

  async getOwnJourney(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const journey = await journeyService.getOwnJourney(req.currentUser.id);
      sendSuccess(res, journey);
    } catch (error) {
      next(error);
    }
  }

  async createJourney(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const journey = await journeyService.createJourneyForStudent(
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'STUDENT_JOURNEY_CREATED',
        category: 'STUDENT',
        entity: {
          type: 'JOURNEY',
          id: journey.id,
          displayName: `${journey.student.studentId} — ${journey.visaCategory.name}`,
        },
      });
      sendCreated(res, journey);
    } catch (error) {
      next(error);
    }
  }

  async updateMilestoneStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const journey = await journeyService.updateMilestoneStatus(
        req.params.journeyId!,
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'MILESTONE_STATUS_UPDATED',
        category: 'STUDENT',
        entity: {
          type: 'JOURNEY',
          id: journey.id,
          displayName: `${journey.student.studentId}`,
        },
        additionalContext: {
          milestoneKey: req.body.milestoneKey,
          newStatus: req.body.status,
        },
      });
      sendSuccess(res, journey);
    } catch (error) {
      next(error);
    }
  }

  async updateMilestoneNotes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const journey = await journeyService.updateMilestoneNotes(
        req.params.journeyId!,
        req.body,
        actorFromReq(req),
      );
      sendSuccess(res, journey);
    } catch (error) {
      next(error);
    }
  }
}

export const journeyController = new JourneyController();