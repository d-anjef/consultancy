import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { financeService } from './finance.service.js';
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

export class FinanceController {
  // ─── Invoices ───────────────────────────────────

  async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await financeService.listInvoices(req.query as never, actorFromReq(req));
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await financeService.getInvoiceById(req.params.id!, actorFromReq(req)));
    } catch (error) {
      next(error);
    }
  }

  async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inv = await financeService.createInvoice(req.body, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'INVOICE_CREATED',
        category: 'FINANCE',
        entity: { type: 'INVOICE', id: inv.id, displayName: inv.invoiceNumber },
        changes: {
          after: {
            student: inv.student.studentId,
            totalAmount: inv.totalAmount,
          },
        },
      });
      sendCreated(res, inv);
    } catch (error) {
      next(error);
    }
  }

  async cancelInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inv = await financeService.cancelInvoice(req.params.id!, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'INVOICE_CANCELLED',
        category: 'FINANCE',
        entity: { type: 'INVOICE', id: inv.id, displayName: inv.invoiceNumber },
      });
      sendSuccess(res, inv);
    } catch (error) {
      next(error);
    }
  }

  async myInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      sendSuccess(res, await financeService.listOwnInvoices(req.currentUser.id));
    } catch (error) {
      next(error);
    }
  }

  // ─── Payments ───────────────────────────────────

  async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await financeService.listPayments(req.query as never, actorFromReq(req));
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await financeService.getPaymentById(req.params.id!, actorFromReq(req)));
    } catch (error) {
      next(error);
    }
  }

  async createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const p = await financeService.createPayment(req.body, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'PAYMENT_CREATED',
        category: 'FINANCE',
        entity: { type: 'PAYMENT', id: p.id, displayName: p.receiptNumber },
        changes: {
          after: {
            invoice: p.invoice.invoiceNumber,
            amount: p.amount,
            method: p.method,
          },
        },
      });
      sendCreated(res, p);
    } catch (error) {
      next(error);
    }
  }

  async voidPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const p = await financeService.voidPayment(req.params.id!, req.body, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'PAYMENT_VOIDED',
        category: 'FINANCE',
        entity: { type: 'PAYMENT', id: p.id, displayName: p.receiptNumber },
        additionalContext: { reason: req.body.reason },
      });
      sendSuccess(res, p);
    } catch (error) {
      next(error);
    }
  }

  async myPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      sendSuccess(res, await financeService.listOwnPayments(req.currentUser.id));
    } catch (error) {
      next(error);
    }
  }

  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await financeService.getStats(actorFromReq(req)));
    } catch (error) {
      next(error);
    }
  }
}

export const financeController = new FinanceController();