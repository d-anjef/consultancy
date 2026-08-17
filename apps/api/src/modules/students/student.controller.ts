import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { studentService } from './student.service.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';
import { auditService } from '../audit/audit.service.js';
import { extractAuditContext } from '../../middleware/auditLogger.js';
import { UnauthorizedError } from '../../lib/errors.js';
import { studentImportService } from './student.import.service.js';

function actorFromReq(req: Request) {
  if (!req.currentUser) throw new UnauthorizedError();
  return {
    id: req.currentUser.id,
    role: req.currentUser.role.code as RoleCode,
    branch: req.currentUser.branch?.id ?? null,
  };
}

export class StudentController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await studentService.listStudents(
        req.query as never,
        actorFromReq(req),
      );
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await studentService.getStudentStats(actorFromReq(req));
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentService.getStudentById(req.params.id!, actorFromReq(req));
      sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const student = await studentService.getOwnStudentProfile(req.currentUser.id);
      sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentService.createStudent(req.body, actorFromReq(req));

      await auditService.log({
        ...extractAuditContext(req),
        action: 'STUDENT_CREATED',
        category: 'STUDENT',
        entity: {
          type: 'STUDENT',
          id: student.id,
          displayName: `${student.studentId} — ${student.personal.firstName} ${student.personal.lastName}`,
        },
        changes: {
          after: {
            email: student.contact.email,
            branch: student.branch.name,
            fromLead: student.originLead?.leadNumber,
          },
        },
      });

      sendCreated(res, student);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      const before = await studentService.getStudentById(req.params.id!, actor);
      const student = await studentService.updateStudent(req.params.id!, req.body, actor);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'STUDENT_UPDATED',
        category: 'STUDENT',
        entity: {
          type: 'STUDENT',
          id: student.id,
          displayName: student.studentId,
        },
        changes: {
          before: { personal: before.personal, contact: before.contact },
          after: { personal: student.personal, contact: student.contact },
        },
      });

      sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const student = await studentService.updateOwnStudentProfile(
        req.currentUser.id,
        req.body,
      );

      await auditService.log({
        ...extractAuditContext(req),
        action: 'STUDENT_UPDATED',
        category: 'STUDENT',
        entity: {
          type: 'STUDENT',
          id: student.id,
          displayName: student.studentId,
        },
        additionalContext: { selfUpdate: true },
      });

      sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentService.archiveStudent(req.params.id!, actorFromReq(req));

      await auditService.log({
        ...extractAuditContext(req),
        action: 'STUDENT_ARCHIVED',
        category: 'STUDENT',
        entity: {
          type: 'STUDENT',
          id: student.id,
          displayName: student.studentId,
        },
      });

      sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  async transfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      const before = await studentService.getStudentById(req.params.id!, actor);
      const student = await studentService.transferBranch(req.params.id!, req.body, actor);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'STUDENT_BRANCH_TRANSFERRED',
        category: 'STUDENT',
        entity: {
          type: 'STUDENT',
          id: student.id,
          displayName: student.studentId,
        },
        changes: {
          before: { branch: before.branch.name },
          after: { branch: student.branch.name },
        },
        additionalContext: { reason: req.body.reason },
      });

      

      sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

    async downloadTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const buffer = await studentImportService.generateTemplate();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="chiba-student-import-template.xlsx"',
      );
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async bulkImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file uploaded' },
        });
        return;
      }

      const sendInvitations = req.body.sendInvitations === 'true';

      const summary = await studentImportService.importStudents(
        req.file.buffer,
        { sendInvitations },
        actorFromReq(req),
      );

      await auditService.log({
        ...extractAuditContext(req),
        action: 'STUDENTS_BULK_IMPORTED',
        category: 'STUDENT',
        entity: {
          type: 'STUDENT',
          id: 'bulk',
          displayName: `${summary.successful} students imported`,
        },
        additionalContext: {
          total: summary.total,
          successful: summary.successful,
          failed: summary.failed,
          skipped: summary.skipped,
        },
      });

      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async downloadErrorReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const summary = req.body.summary;
      if (!summary) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_SUMMARY', message: 'No summary provided' },
        });
        return;
      }
      const buffer = await studentImportService.generateErrorReport(summary);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="import-error-report.xlsx"',
      );
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();