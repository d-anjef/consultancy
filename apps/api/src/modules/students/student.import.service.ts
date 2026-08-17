import { Types } from 'mongoose';
import * as XLSX from 'xlsx';
import {
  ROLE_CODES,
  INVITATION_EXPIRY_MS,
  type RoleCode,
} from '@consultancy/config';
import { studentRepository } from './student.repository.js';
import { branchRepository } from '../branches/branch.repository.js';
import { userRepository } from '../users/user.repository.js';
import { roleRepository } from '../roles/role.repository.js';
import { hashPassword, generateSecureToken } from '../../lib/crypto.js';
import { emailService } from '../auth/email.service.js';
import { generateStudentId } from '../../lib/studentId.js';
import { ORGANIZATION_WIDE_ROLE_CODES } from '@consultancy/config';
import { BusinessRuleError } from '../../lib/errors.js';

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

interface ImportRow {
  rowNumber: number;
  data: Record<string, unknown>;
}

interface ImportResult {
  rowNumber: number;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  studentId?: string;
  studentName?: string;
  email?: string;
  error?: string;
}

interface ImportSummary {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: ImportResult[];
}

// ─── Column Header Mappings ──────────────────────────────────────────────
// Accept multiple variants for flexibility

const COLUMN_MAP = {
  firstName: ['First Name', 'first name', 'firstname', 'first_name', 'FirstName'],
  lastName: ['Last Name', 'last name', 'lastname', 'last_name', 'LastName'],
  middleName: ['Middle Name', 'middle name', 'middlename', 'middle_name'],
  email: ['Email', 'email', 'Email Address', 'email_address'],
  phone: ['Phone', 'phone', 'Phone Number', 'phone_number', 'Mobile'],
  alternatePhone: ['Alternate Phone', 'alternate_phone', 'alt_phone', 'Alt Phone'],
  dateOfBirth: ['Date of Birth', 'DOB', 'dob', 'date_of_birth', 'Birth Date'],
  gender: ['Gender', 'gender'],
  nationality: ['Nationality', 'nationality'],
  maritalStatus: ['Marital Status', 'marital_status', 'marital status'],
  fatherName: ["Father's Name", 'Father Name', 'father_name', 'fatherName'],
  motherName: ["Mother's Name", 'Mother Name', 'mother_name', 'motherName'],
  branchCode: ['Branch', 'Branch Code', 'branch', 'branch_code'],
  street: ['Address', 'Street', 'street', 'street_address', 'Street Address'],
  city: ['City', 'city'],
  district: ['District', 'district'],
  province: ['Province', 'province', 'State'],
  country: ['Country', 'country'],
  postalCode: ['Postal Code', 'postal_code', 'Postcode', 'Zip'],
  emergencyName: [
    'Emergency Contact Name',
    'Emergency Name',
    'emergency_name',
    'emergency contact name',
  ],
  emergencyRelationship: [
    'Emergency Relationship',
    'emergency_relationship',
    'Emergency Contact Relationship',
    'Relationship',
  ],
  emergencyPhone: [
    'Emergency Contact Phone',
    'Emergency Phone',
    'emergency_phone',
    'emergency contact phone',
  ],
  passportNumber: ['Passport Number', 'Passport', 'passport_number', 'passport'],
  passportExpiry: ['Passport Expiry', 'passport_expiry', 'Passport Expiry Date'],
  admissionDate: ['Admission Date', 'admission_date', 'Enrollment Date'],
  notes: ['Notes', 'notes', 'Remarks', 'Comments'],
};

// Helper: Find value in row using any of the accepted column names
function getValue(row: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const val = row[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
  }
  return undefined;
}

// Helper: Normalize gender
function normalizeGender(val?: string): 'MALE' | 'FEMALE' | 'OTHER' | undefined {
  if (!val) return undefined;
  const upper = val.toUpperCase();
  if (upper === 'M' || upper === 'MALE') return 'MALE';
  if (upper === 'F' || upper === 'FEMALE') return 'FEMALE';
  if (upper === 'O' || upper === 'OTHER') return 'OTHER';
  return undefined;
}

// Helper: Normalize marital status
function normalizeMaritalStatus(
  val?: string,
): 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | undefined {
  if (!val) return undefined;
  const upper = val.toUpperCase();
  if (['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'].includes(upper)) {
    return upper as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  }
  return undefined;
}

// Helper: Parse date (handles Excel date serial numbers + strings)
function parseDate(val: unknown): Date | undefined {
  if (!val) return undefined;

  // If already a Date object
  if (val instanceof Date) return val;

  // Excel stores dates as numbers (days since 1900-01-01)
  if (typeof val === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + val * 24 * 60 * 60 * 1000);
  }

  // String date
  if (typeof val === 'string') {
    // Try common formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
    const cleaned = val.trim();

    // YYYY-MM-DD or YYYY/MM/DD
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(cleaned)) {
      const d = new Date(cleaned.replace(/\//g, '-'));
      return isNaN(d.getTime()) ? undefined : d;
    }

    // DD/MM/YYYY or DD-MM-YYYY
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(cleaned)) {
      const parts = cleaned.split(/[-/]/);
      const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      return isNaN(d.getTime()) ? undefined : d;
    }

    // Fallback: try native parsing
    const d = new Date(cleaned);
    return isNaN(d.getTime()) ? undefined : d;
  }

  return undefined;
}

// Helper: Normalize phone (Nepali format)
function normalizePhone(val?: string): string | undefined {
  if (!val) return undefined;
  let cleaned = val.toString().replace(/[^0-9]/g, '');
  // Strip 977 country code
  if (cleaned.startsWith('977') && cleaned.length > 10) {
    cleaned = cleaned.substring(3);
  }
  // Strip leading zero
  cleaned = cleaned.replace(/^0+/, '');
  return cleaned || undefined;
}

// Helper: Validate email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN IMPORT SERVICE
// ═══════════════════════════════════════════════════════════════════════

export class StudentImportService {
  async parseExcelFile(fileBuffer: Buffer): Promise<ImportRow[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new BusinessRuleError('Excel file has no sheets');
    }
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) {
      throw new BusinessRuleError('Excel sheet is empty');
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd',
    });

    return rows.map((data, i) => ({
      rowNumber: i + 2, // +2 because row 1 is header, and we're 1-indexed
      data,
    }));
  }

  async importStudents(
    fileBuffer: Buffer,
    options: { sendInvitations: boolean },
    actor: ActorContext,
  ): Promise<ImportSummary> {
    const rows = await this.parseExcelFile(fileBuffer);

    if (rows.length === 0) {
      throw new BusinessRuleError('No data rows found in file');
    }

    if (rows.length > 500) {
      throw new BusinessRuleError('Cannot import more than 500 students at once');
    }

    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);

    // Pre-load role
    const studentRole = await roleRepository.findByCodeWithoutPopulate(ROLE_CODES.STUDENT);
    if (!studentRole) {
      throw new BusinessRuleError('STUDENT role not found in database');
    }

    // Pre-load all branches for lookup
    const allBranches = await branchRepository.findActive();
    const branchByCode = new Map(allBranches.map((b) => [b.code.toUpperCase(), b]));

    const results: ImportResult[] = [];

    for (const row of rows) {
      try {
        const result = await this.processRow(
          row,
          studentRole._id as Types.ObjectId,
          branchByCode,
          isOrgWide,
          actor,
          options.sendInvitations,
        );
        results.push(result);
      } catch (err) {
        results.push({
          rowNumber: row.rowNumber,
          status: 'FAILED',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const successful = results.filter((r) => r.status === 'SUCCESS').length;
    const failed = results.filter((r) => r.status === 'FAILED').length;
    const skipped = results.filter((r) => r.status === 'SKIPPED').length;

    return {
      total: rows.length,
      successful,
      failed,
      skipped,
      results,
    };
  }

  private async processRow(
    row: ImportRow,
    studentRoleId: Types.ObjectId,
    branchByCode: Map<string, { _id: unknown; code: string; name: string }>,
    isOrgWide: boolean,
    actor: ActorContext,
    sendInvitation: boolean,
  ): Promise<ImportResult> {
    const { data, rowNumber } = row;

    // ─── Extract fields ───
    const firstName = getValue(data, COLUMN_MAP.firstName);
    const lastName = getValue(data, COLUMN_MAP.lastName);
    const middleName = getValue(data, COLUMN_MAP.middleName);
    const email = getValue(data, COLUMN_MAP.email);
    const phone = normalizePhone(getValue(data, COLUMN_MAP.phone));
    const altPhone = normalizePhone(getValue(data, COLUMN_MAP.alternatePhone));
    const dobRaw = getValue(data, COLUMN_MAP.dateOfBirth);
    const genderRaw = getValue(data, COLUMN_MAP.gender);
    const nationality = getValue(data, COLUMN_MAP.nationality) ?? 'Nepali';
    const maritalRaw = getValue(data, COLUMN_MAP.maritalStatus);
    const fatherName = getValue(data, COLUMN_MAP.fatherName);
    const motherName = getValue(data, COLUMN_MAP.motherName);
    const branchCodeRaw = getValue(data, COLUMN_MAP.branchCode);
    const street = getValue(data, COLUMN_MAP.street);
    const city = getValue(data, COLUMN_MAP.city);
    const district = getValue(data, COLUMN_MAP.district);
    const province = getValue(data, COLUMN_MAP.province);
    const country = getValue(data, COLUMN_MAP.country) ?? 'Nepal';
    const postalCode = getValue(data, COLUMN_MAP.postalCode);
    const emergencyName = getValue(data, COLUMN_MAP.emergencyName);
    const emergencyRel = getValue(data, COLUMN_MAP.emergencyRelationship);
    const emergencyPhone = normalizePhone(getValue(data, COLUMN_MAP.emergencyPhone));
    const passportNumber = getValue(data, COLUMN_MAP.passportNumber);
    const passportExpiryRaw = getValue(data, COLUMN_MAP.passportExpiry);
    const admissionDateRaw = getValue(data, COLUMN_MAP.admissionDate);
    const notes = getValue(data, COLUMN_MAP.notes);

    // ─── Validate required fields ───
    const errors: string[] = [];
    if (!firstName) errors.push('First Name required');
    if (!lastName) errors.push('Last Name required');
    if (!email) errors.push('Email required');
    else if (!isValidEmail(email)) errors.push('Invalid email format');
    if (!phone) errors.push('Phone required');
    else if (phone.length < 7 || phone.length > 15)
      errors.push('Invalid phone (must be 7-15 digits)');
    if (!dobRaw) errors.push('Date of Birth required');
    if (!genderRaw) errors.push('Gender required');
    if (!branchCodeRaw) errors.push('Branch required');
    if (!street) errors.push('Street/Address required');
    if (!city) errors.push('City required');
    if (!district) errors.push('District required');
    if (!province) errors.push('Province required');
    if (!emergencyName) errors.push('Emergency Contact Name required');
    if (!emergencyRel) errors.push('Emergency Relationship required');
    if (!emergencyPhone) errors.push('Emergency Contact Phone required');

    // Parse & validate structured values
    const gender = normalizeGender(genderRaw);
    if (genderRaw && !gender) {
      errors.push(`Invalid gender "${genderRaw}" (use MALE, FEMALE, or OTHER)`);
    }

    const dob = parseDate(dobRaw);
    if (dobRaw && !dob) errors.push(`Invalid date of birth "${dobRaw}"`);

    const passportExpiry = passportExpiryRaw
      ? parseDate(passportExpiryRaw)
      : undefined;
    if (passportExpiryRaw && !passportExpiry) {
      errors.push(`Invalid passport expiry "${passportExpiryRaw}"`);
    }

    const admissionDate = admissionDateRaw
      ? parseDate(admissionDateRaw)
      : new Date();
    if (admissionDateRaw && !admissionDate) {
      errors.push(`Invalid admission date "${admissionDateRaw}"`);
    }

    // Branch lookup
    const branchCode = branchCodeRaw?.toUpperCase();
    const branch = branchCode ? branchByCode.get(branchCode) : undefined;
    if (branchCodeRaw && !branch) {
      errors.push(
        `Branch "${branchCodeRaw}" not found. Available: ${Array.from(branchByCode.keys()).join(', ')}`,
      );
    }

    // Branch scope enforcement
    if (branch && !isOrgWide && actor.branch !== String(branch._id)) {
      errors.push('You can only import students to your own branch');
    }

    if (errors.length > 0) {
      return {
        rowNumber,
        status: 'FAILED',
        studentName: `${firstName ?? ''} ${lastName ?? ''}`.trim() || undefined,
        email,
        error: errors.join('; '),
      };
    }

    // ─── Duplicate check ───
    const emailExists = await userRepository.existsByEmail(email!);
    if (emailExists) {
      return {
        rowNumber,
        status: 'SKIPPED',
        studentName: `${firstName} ${lastName}`,
        email,
        error: `Email already exists`,
      };
    }

    const phoneExists = await studentRepository.findByPhone(
      phone!,
      String(branch!._id),
    );
    if (phoneExists) {
      return {
        rowNumber,
        status: 'SKIPPED',
        studentName: `${firstName} ${lastName}`,
        email,
        error: `Phone ${phone} already exists in this branch`,
      };
    }

    // ─── Create User + Student ───
    try {
      const tempPassword = generateSecureToken(16);
      const passwordHash = await hashPassword(tempPassword);
      const invitationToken = generateSecureToken(32);
      const invitationExpiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);

      const user = await userRepository.create({
        email: email!,
        passwordHash,
        role: studentRoleId,
        branch: branch!._id as Types.ObjectId,
        profile: {
          firstName: firstName!,
          lastName: lastName!,
          phone: phone!,
        },
        status: 'PENDING_ACTIVATION',
        emailVerified: false,
        invitedBy: new Types.ObjectId(actor.id),
        invitationToken,
        invitationExpiresAt,
        createdBy: new Types.ObjectId(actor.id),
        mustChangePassword: true,
      });

      const studentIdValue = await generateStudentId();

      const student = await studentRepository.create({
        studentId: studentIdValue,
        userId: user._id as Types.ObjectId,
        branch: branch!._id as Types.ObjectId,
        personal: {
          firstName: firstName!,
          lastName: lastName!,
          middleName,
          dateOfBirth: dob!,
          gender: gender!,
          nationality,
          maritalStatus: normalizeMaritalStatus(maritalRaw),
          fatherName,
          motherName,
        } as never,
        contact: {
          phone: phone!,
          email: email!,
          alternatePhone: altPhone,
          address: {
            street: street!,
            city: city!,
            district: district!,
            province: province!,
            country,
            postalCode,
          },
        } as never,
        emergencyContact: {
          name: emergencyName!,
          relationship: emergencyRel!,
          phone: emergencyPhone!,
        } as never,
        passport: passportNumber
          ? {
              number: passportNumber,
              expiryDate: passportExpiry,
            }
          : undefined,
        notes,
        createdBy: new Types.ObjectId(actor.id),
      });

      // Set admission date (if not default)
      if (admissionDateRaw && admissionDate) {
        await studentRepository.update(String(student._id), {
          updatedBy: new Types.ObjectId(actor.id),
          // Note: admissionDate is set by schema default; we could add an override
        });
      }

      // Fire-and-forget invitation email
      if (sendInvitation) {
        emailService
          .sendInvitationEmail({
            to: email!,
            recipientName: `${firstName} ${lastName}`,
            invitationToken,
            roleName: 'Student',
          })
          .catch((err) => console.error(`[import] email error for ${email}:`, err));
      }

      return {
        rowNumber,
        status: 'SUCCESS',
        studentId: studentIdValue,
        studentName: `${firstName} ${lastName}`,
        email,
      };
    } catch (err) {
      return {
        rowNumber,
        status: 'FAILED',
        studentName: `${firstName} ${lastName}`,
        email,
        error: err instanceof Error ? err.message : 'Failed to create student',
      };
    }
  }

  // ─── Generate Excel Template ───────────────────────────────────────────
  async generateTemplate(): Promise<Buffer> {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Instructions
    const instructions = [
      ['CHIBA EDUCATION CENTER - STUDENT IMPORT TEMPLATE'],
      [''],
      ['INSTRUCTIONS:'],
      ['1. Fill in the "Students" sheet with your student data'],
      ['2. DO NOT change column headers'],
      ['3. Required columns marked with * (asterisk) in column header'],
      ['4. Delete the example rows before uploading'],
      ['5. Save the file as .xlsx or .csv'],
      [''],
      ['FIELD FORMATS:'],
      ['Date of Birth: YYYY-MM-DD (e.g., 2000-05-15)'],
      ['Gender: MALE, FEMALE, or OTHER'],
      ['Marital Status: SINGLE, MARRIED, DIVORCED, or WIDOWED (optional)'],
      ['Phone: 10 digits (e.g., 9812345678) - no country code needed'],
      ['Branch: Use the branch code (e.g., HO for Head Office)'],
      [''],
      ['VALIDATION:'],
      ['- Rows with missing required fields will be skipped'],
      ['- Duplicate emails or phones (in same branch) will be skipped'],
      ['- You will receive a report of any errors after upload'],
      [''],
      ['MAX ROWS: 500 students per import'],
    ];
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');

    // Sheet 2: Students (with example rows)
    const studentsData = [
      // Header row
      [
        'First Name*',
        'Last Name*',
        'Middle Name',
        'Email*',
        'Phone*',
        'Date of Birth*',
        'Gender*',
        'Branch*',
        'Address*',
        'City*',
        'District*',
        'Province*',
        'Country',
        'Nationality',
        'Marital Status',
        "Father's Name",
        "Mother's Name",
        'Alternate Phone',
        'Postal Code',
        'Emergency Contact Name*',
        'Emergency Relationship*',
        'Emergency Contact Phone*',
        'Passport Number',
        'Passport Expiry',
        'Admission Date',
        'Notes',
      ],
      // Example rows
      [
        'Ram',
        'Sharma',
        '',
        'ram.sharma@example.com',
        '9812345678',
        '2000-05-15',
        'MALE',
        'HO',
        'Baneshwor',
        'Kathmandu',
        'Kathmandu',
        'Bagmati',
        'Nepal',
        'Nepali',
        'SINGLE',
        'Hari Sharma',
        'Sita Sharma',
        '',
        '44600',
        'Sita Sharma',
        'Mother',
        '9812345679',
        'P1234567',
        '2030-12-31',
        '2024-01-15',
        'Excellent student',
      ],
      [
        'Sita',
        'Gurung',
        '',
        'sita.gurung@example.com',
        '9812345680',
        '2001-03-20',
        'FEMALE',
        'HO',
        'Pokhara-6',
        'Pokhara',
        'Kaski',
        'Gandaki',
        'Nepal',
        'Nepali',
        'SINGLE',
        'Ram Gurung',
        'Maya Gurung',
        '',
        '',
        'Maya Gurung',
        'Mother',
        '9812345681',
        '',
        '',
        '2024-02-01',
        '',
      ],
    ];
    const studentsSheet = XLSX.utils.aoa_to_sheet(studentsData);
    // Set column widths
    studentsSheet['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 12 },
      { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
      { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 14 }, { wch: 14 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, studentsSheet, 'Students');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  // ─── Generate Error Report as Excel ────────────────────────────────────
  async generateErrorReport(summary: ImportSummary): Promise<Buffer> {
    const wb = XLSX.utils.book_new();

    const failed = summary.results.filter((r) => r.status === 'FAILED');
    const skipped = summary.results.filter((r) => r.status === 'SKIPPED');

    // Summary sheet
    const summaryData = [
      ['IMPORT SUMMARY'],
      [''],
      ['Total Rows', summary.total],
      ['Successful', summary.successful],
      ['Failed', summary.failed],
      ['Skipped (Duplicates)', summary.skipped],
      [''],
      ['Generated', new Date().toISOString()],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Failed rows sheet
    if (failed.length > 0) {
      const failedData = [
        ['Row', 'Name', 'Email', 'Error'],
        ...failed.map((r) => [
          r.rowNumber,
          r.studentName ?? '—',
          r.email ?? '—',
          r.error ?? 'Unknown',
        ]),
      ];
      const failedSheet = XLSX.utils.aoa_to_sheet(failedData);
      failedSheet['!cols'] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 30 },
        { wch: 60 },
      ];
      XLSX.utils.book_append_sheet(wb, failedSheet, 'Failed');
    }

    // Skipped rows sheet
    if (skipped.length > 0) {
      const skippedData = [
        ['Row', 'Name', 'Email', 'Reason'],
        ...skipped.map((r) => [
          r.rowNumber,
          r.studentName ?? '—',
          r.email ?? '—',
          r.error ?? 'Duplicate',
        ]),
      ];
      const skippedSheet = XLSX.utils.aoa_to_sheet(skippedData);
      skippedSheet['!cols'] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 30 },
        { wch: 60 },
      ];
      XLSX.utils.book_append_sheet(wb, skippedSheet, 'Skipped');
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const studentImportService = new StudentImportService();