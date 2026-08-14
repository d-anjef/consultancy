import { Types } from 'mongoose';
import { ORGANIZATION_WIDE_ROLE_CODES, type RoleCode } from '@consultancy/config';
import { LeadModel } from '../leads/lead.model.js';
import { StudentModel } from '../students/student.model.js';
import { ApplicationModel } from '../applications/application.model.js';
import { InvoiceModel } from '../finance/invoice.model.js';
import { AttendanceModel } from '../attendance/attendance.model.js';

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

export class ReportService {
  private getBranchMatch(actor: ActorContext): Record<string, unknown> {
    if (ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role)) return {};
    if (actor.branch && Types.ObjectId.isValid(actor.branch)) {
      return { branch: new Types.ObjectId(actor.branch) };
    }
    return {};
  }

  async getLeadConversionReport(actor: ActorContext) {
    const match = this.getBranchMatch(actor);

    const [statusCounts, sourceCounts, monthlyLeads] = await Promise.all([
      LeadModel.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      LeadModel.aggregate([
        { $match: match },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
      LeadModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
            converted: {
              $sum: { $cond: [{ $eq: ['$status', 'CONVERTED'] }, 1, 0] },
            },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    for (const r of statusCounts) byStatus[r._id] = r.count;
    const bySource: Record<string, number> = {};
    for (const r of sourceCounts) bySource[r._id] = r.count;

    const total = Object.values(byStatus).reduce((s, n) => s + n, 0);
    const converted = byStatus.CONVERTED ?? 0;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    return {
      total,
      converted,
      conversionRate,
      byStatus,
      bySource,
      monthly: monthlyLeads.map((m) => ({
        year: m._id.year,
        month: m._id.month,
        leads: m.count,
        converted: m.converted,
        rate: m.count > 0 ? Math.round((m.converted / m.count) * 100) : 0,
      })),
    };
  }

  async getApplicationPipelineReport(actor: ActorContext) {
    const match = this.getBranchMatch(actor);

    const [statusCounts, visaCounts] = await Promise.all([
      ApplicationModel.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ApplicationModel.aggregate([
        { $match: match },
        {
          $lookup: {
            from: 'visa_categories',
            localField: 'visaCategory',
            foreignField: '_id',
            as: 'visa',
          },
        },
        { $unwind: '$visa' },
        {
          $group: {
            _id: { visa: '$visa.name', status: '$status' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    for (const r of statusCounts) byStatus[r._id] = r.count;

    const total = Object.values(byStatus).reduce((s, n) => s + n, 0);
    const approved = byStatus.APPROVED ?? 0;
    const rejected = byStatus.REJECTED ?? 0;
    const successRate =
      approved + rejected > 0
        ? Math.round((approved / (approved + rejected)) * 100)
        : 0;

    const byVisa: Record<string, Record<string, number>> = {};
for (const r of visaCounts) {
  if (!byVisa[r._id.visa]) byVisa[r._id.visa] = {};
  const visaBucket = byVisa[r._id.visa]!;
  visaBucket[r._id.status] = r.count;
}

    return { total, byStatus, successRate, byVisa };
  }

  async getFinanceSummaryReport(actor: ActorContext) {
    const match = this.getBranchMatch(actor);

    const [invoiceStats, monthlyRevenue] = await Promise.all([
      InvoiceModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalInvoiced: { $sum: '$totalAmount' },
            totalPaid: { $sum: '$paidAmount' },
            totalOutstanding: { $sum: '$balanceAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      InvoiceModel.aggregate([
        { $match: { ...match, status: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: {
              year: { $year: '$issueDate' },
              month: { $month: '$issueDate' },
            },
            invoiced: { $sum: '$totalAmount' },
            collected: { $sum: '$paidAmount' },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
    ]);

    const stats = invoiceStats[0] ?? {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      count: 0,
    };

    return {
      ...stats,
      collectionRate:
        stats.totalInvoiced > 0
          ? Math.round((stats.totalPaid / stats.totalInvoiced) * 100)
          : 0,
      monthly: monthlyRevenue.map((m) => ({
        year: m._id.year,
        month: m._id.month,
        invoiced: m.invoiced,
        collected: m.collected,
      })),
    };
  }

  async getAttendanceSummaryReport(actor: ActorContext) {
    const match = this.getBranchMatch(actor);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [statusCounts, dailyCounts] = await Promise.all([
      AttendanceModel.aggregate([
        { $match: { ...match, date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      AttendanceModel.aggregate([
        { $match: { ...match, date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': -1 } },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    for (const r of statusCounts) byStatus[r._id] = r.count;

    const total = Object.values(byStatus).reduce((s, n) => s + n, 0);
    const present = byStatus.PRESENT ?? 0;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    const daily: Record<string, Record<string, number>> = {};
for (const r of dailyCounts) {
  if (!daily[r._id.date]) daily[r._id.date] = {};
  const dayBucket = daily[r._id.date]!;
  dayBucket[r._id.status] = r.count;
}

    return { total, byStatus, attendanceRate, daily };
  }

  async getOverviewReport(actor: ActorContext) {
    const match = this.getBranchMatch(actor);

    const [totalLeads, totalStudents, totalApplications, activeStudents] =
      await Promise.all([
        LeadModel.countDocuments(match),
        StudentModel.countDocuments(match),
        ApplicationModel.countDocuments(match),
        StudentModel.countDocuments({ ...match, status: 'ACTIVE' }),
      ]);

    return {
      totalLeads,
      totalStudents,
      activeStudents,
      totalApplications,
    };
  }
}

export const reportService = new ReportService();