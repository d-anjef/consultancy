import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { attendanceService } from './attendance.service.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';
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

export class AttendanceController {
  async scan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attendance = await attendanceService.scanQR(req.body, actorFromReq(req));

      await auditService.log({
        ...extractAuditContext(req),
        action: 'ATTENDANCE_RECORDED_SCAN',
        category: 'ATTENDANCE',
        entity: {
          type: 'ATTENDANCE',
          id: attendance.id,
          displayName: `${attendance.user.firstName} ${attendance.user.lastName}`,
        },
      });

      sendCreated(res, attendance);
    } catch (error) {
      next(error);
    }
  }

  async manual(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attendance = await attendanceService.recordManual(req.body, actorFromReq(req));

      await auditService.log({
        ...extractAuditContext(req),
        action: 'ATTENDANCE_RECORDED_MANUAL',
        category: 'ATTENDANCE',
        entity: {
          type: 'ATTENDANCE',
          id: attendance.id,
          displayName: `${attendance.user.firstName} ${attendance.user.lastName}`,
        },
      });

      sendCreated(res, attendance);
    } catch (error) {
      next(error);
    }
  }

  async edit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attendance = await attendanceService.editAttendance(
        req.params.id!,
        req.body,
        actorFromReq(req),
      );

      await auditService.log({
        ...extractAuditContext(req),
        action: 'ATTENDANCE_EDITED',
        category: 'ATTENDANCE',
        entity: { type: 'ATTENDANCE', id: attendance.id },
        additionalContext: { reason: req.body.reason },
      });

      sendSuccess(res, attendance);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await attendanceService.listAttendance(
        req.query as never,
        actorFromReq(req),
      );
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getOwn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const records = await attendanceService.getOwnAttendance(
        req.currentUser.id,
        req.query.fromDate as string,
        req.query.toDate as string,
      );
      sendSuccess(res, records);
    } catch (error) {
      next(error);
    }
  }

  async dailySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      const branchId = (req.query.branchId as string) || actor.branch || '';
      const summary = await attendanceService.getDailySummary(
        branchId,
        req.query.date as string,
      );
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();