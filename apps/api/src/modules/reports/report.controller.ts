import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { reportService } from './report.service.js';
import { sendSuccess } from '../../lib/response.js';
import { UnauthorizedError } from '../../lib/errors.js';

function actorFromReq(req: Request) {
  if (!req.currentUser) throw new UnauthorizedError();
  return {
    id: req.currentUser.id,
    role: req.currentUser.role.code as RoleCode,
    branch: req.currentUser.branch?.id ?? null,
  };
}

export class ReportController {
  async overview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await reportService.getOverviewReport(actorFromReq(req))); }
    catch (error) { next(error); }
  }

  async leads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await reportService.getLeadConversionReport(actorFromReq(req))); }
    catch (error) { next(error); }
  }

  async applications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await reportService.getApplicationPipelineReport(actorFromReq(req))); }
    catch (error) { next(error); }
  }

  async finance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await reportService.getFinanceSummaryReport(actorFromReq(req))); }
    catch (error) { next(error); }
  }

  async attendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await reportService.getAttendanceSummaryReport(actorFromReq(req))); }
    catch (error) { next(error); }
  }
}

export const reportController = new ReportController();