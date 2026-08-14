import { Types } from 'mongoose';
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_METHODS,
  ORGANIZATION_WIDE_ROLE_CODES,
  type AttendanceStatus,
  type AttendanceMethod,
  type RoleCode,
} from '@consultancy/config';
import { attendanceRepository } from './attendance.repository.js';
import { QRIdentityModel } from '../qr/qr-identity.model.js';
import { userRepository } from '../users/user.repository.js';
import type { AttendanceDocument } from './attendance.model.js';
import type { UserDocument } from '../users/user.model.js';
import type { BranchDocument } from '../branches/branch.model.js';
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../lib/errors.js';
import { verifyQrPayload } from '../../lib/qr.js';
import { getStartOfDayUTC } from '../../lib/timezone.js';
import type {
  ScanAttendanceDto,
  ManualAttendanceDto,
  EditAttendanceDto,
  ListAttendanceQueryDto,
} from './attendance.validators.js';
import type { PaginationMeta } from '@consultancy/types';

export interface FormattedAttendance {
  id: string;
  user: { id: string; email: string; firstName: string; lastName: string };
  userType: 'STUDENT' | 'TEACHER';
  branch: { id: string; code: string; name: string };
  class?: { id: string; classCode: string; name: string } | null;
  date: Date;
  scannedAt: Date;
  status: AttendanceStatus;
  method: AttendanceMethod;
  scannedBy: { id: string; firstName: string; lastName: string };
  editedAt?: Date;
  editReason?: string;
  notes?: string;
  createdAt: Date;
}

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

export class AttendanceService {
  async scanQR(
    data: ScanAttendanceDto,
    actor: ActorContext,
  ): Promise<FormattedAttendance> {
    // Verify QR payload
    const decoded = verifyQrPayload(data.qrPayload);
    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired QR code');
    }

    // Find the QR identity
    const qrIdentity = await QRIdentityModel.findOne({
      token: decoded.token,
      isActive: true,
    }).lean();

    if (!qrIdentity) {
      throw new UnauthorizedError('QR code is not active or has been revoked');
    }

    // Verify user matches
    if (String(qrIdentity.user) !== decoded.sub) {
      throw new UnauthorizedError('QR code mismatch');
    }

    const userId = new Types.ObjectId(decoded.sub);
    const today = getStartOfDayUTC();

    // Check duplicate
    const existing = await attendanceRepository.findByUserAndDate(userId, today);
    if (existing) {
      throw new ConflictError('Attendance already recorded for today');
    }

    // Determine branch
    let branchId: Types.ObjectId;
    if (actor.branch) {
      branchId = new Types.ObjectId(actor.branch);
    } else {
      // Fallback — get branch from user
      const user = await userRepository.findById(decoded.sub);
      if (!user || !user.branch) {
        throw new BusinessRuleError('Cannot determine branch for attendance');
      }
      branchId = user.branch as Types.ObjectId;
    }

    const created = await attendanceRepository.create({
      user: userId,
      userType: decoded.type,
      branch: branchId,
      class: data.classId ? new Types.ObjectId(data.classId) : undefined,
      date: today,
      scannedAt: new Date(),
      status: ATTENDANCE_STATUSES.PRESENT,
      method: ATTENDANCE_METHODS.QR_SCAN,
      scannedBy: new Types.ObjectId(actor.id),
      scannerDevice: data.scannerDevice,
    });

    return this.format(created);
  }

  async recordManual(
    data: ManualAttendanceDto,
    actor: ActorContext,
  ): Promise<FormattedAttendance> {
    const user = await userRepository.findById(data.userId);
    if (!user) throw new NotFoundError('User', data.userId);

    const date = data.date ? getStartOfDayUTC(new Date(data.date)) : getStartOfDayUTC();

    // Check duplicate
    const existing = await attendanceRepository.findByUserAndDate(
      new Types.ObjectId(data.userId),
      date,
    );
    if (existing) {
      throw new ConflictError('Attendance already recorded for this user on this date');
    }

    let branchId: Types.ObjectId;
    if (actor.branch) {
      branchId = new Types.ObjectId(actor.branch);
    } else if (user.branch) {
      branchId = user.branch as Types.ObjectId;
    } else {
      throw new BusinessRuleError('Cannot determine branch');
    }

    const created = await attendanceRepository.create({
      user: new Types.ObjectId(data.userId),
      userType: data.userType,
      branch: branchId,
      class: data.classId ? new Types.ObjectId(data.classId) : undefined,
      date,
      scannedAt: new Date(),
      status: data.status as AttendanceStatus,
      method: ATTENDANCE_METHODS.MANUAL,
      scannedBy: new Types.ObjectId(actor.id),
      notes: data.notes,
    });

    return this.format(created);
  }

  async editAttendance(
    id: string,
    data: EditAttendanceDto,
    actor: ActorContext,
  ): Promise<FormattedAttendance> {
    const existing = await attendanceRepository.findById(id);
    if (!existing) throw new NotFoundError('Attendance', id);

    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    if (!isOrgWide) {
      const branchId = String((existing.branch as unknown as BranchDocument)._id);
      if (branchId !== actor.branch) {
        throw new ForbiddenError('You cannot edit attendance from another branch');
      }
    }

    const updated = await attendanceRepository.update(
      id,
      data.status as AttendanceStatus,
      new Types.ObjectId(actor.id),
      data.reason,
    );

    if (!updated) throw new NotFoundError('Attendance', id);
    return this.format(updated);
  }

  async listAttendance(
    query: ListAttendanceQueryDto,
    actor: ActorContext,
  ): Promise<{ items: FormattedAttendance[]; pagination: PaginationMeta }> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchFilter = isOrgWide ? query.branchId : actor.branch ?? undefined;

    let fromDate = query.fromDate ? new Date(query.fromDate) : undefined;
    let toDate = query.toDate ? new Date(query.toDate) : undefined;

    if (query.date) {
      fromDate = getStartOfDayUTC(new Date(query.date));
      toDate = new Date(fromDate);
      toDate.setUTCHours(23, 59, 59, 999);
    }

    const { items, pagination } = await attendanceRepository.list(
      {
        branchId: branchFilter,
        userId: query.userId,
        userType: query.userType,
        classId: query.classId,
        status: query.status as AttendanceStatus | undefined,
        fromDate,
        toDate,
      },
      query.page,
      query.limit,
    );

    return { items: items.map((a) => this.format(a)), pagination };
  }

  async getOwnAttendance(
    userId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<FormattedAttendance[]> {
    const records = await attendanceRepository.getOwnAttendance(
      userId,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
    return records.map((a) => this.format(a));
  }

  async getDailySummary(branchId: string, date?: string) {
    const d = date ? new Date(date) : new Date();
    return attendanceRepository.getDailySummary(branchId, d);
  }

  private format(a: AttendanceDocument): FormattedAttendance {
    const user = a.user as unknown as UserDocument;
    const branch = a.branch as unknown as BranchDocument;
    const cls = a.class as unknown as
      | { _id: Types.ObjectId; classCode: string; name: string }
      | undefined;
    const scanner = a.scannedBy as unknown as UserDocument;

    return {
      id: String(a._id),
      user: {
        id: String(user._id),
        email: user.email,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
      },
      userType: a.userType,
      branch: { id: String(branch._id), code: branch.code, name: branch.name },
      class: cls
        ? { id: String(cls._id), classCode: cls.classCode, name: cls.name }
        : null,
      date: a.date,
      scannedAt: a.scannedAt,
      status: a.status,
      method: a.method,
      scannedBy: {
        id: String(scanner._id),
        firstName: scanner.profile.firstName,
        lastName: scanner.profile.lastName,
      },
      editedAt: a.editedAt,
      editReason: a.editReason,
      notes: a.notes,
      createdAt: a.createdAt,
    };
  }
}

export const attendanceService = new AttendanceService();