/**
 * System Role Codes
 *
 * These are immutable identifiers used throughout the system.
 * Do not change these values — they are referenced by role checks,
 * seeds, and permission mappings.
 */

export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  COUNSELOR: 'COUNSELOR',
  RECEPTIONIST: 'RECEPTIONIST',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

export const ALL_ROLE_CODES: RoleCode[] = Object.values(ROLE_CODES);

export const STAFF_ROLE_CODES: RoleCode[] = [
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.ADMIN,
  ROLE_CODES.BRANCH_MANAGER,
  ROLE_CODES.COUNSELOR,
  ROLE_CODES.RECEPTIONIST,
  ROLE_CODES.TEACHER,
];

export const BRANCH_SCOPED_ROLE_CODES: RoleCode[] = [
  ROLE_CODES.BRANCH_MANAGER,
  ROLE_CODES.COUNSELOR,
  ROLE_CODES.RECEPTIONIST,
  ROLE_CODES.TEACHER,
];

export const ORGANIZATION_WIDE_ROLE_CODES: RoleCode[] = [
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.ADMIN,
];

export const ROLE_DISPLAY_NAMES: Record<RoleCode, string> = {
  [ROLE_CODES.SUPER_ADMIN]: 'Super Admin',
  [ROLE_CODES.ADMIN]: 'Admin',
  [ROLE_CODES.BRANCH_MANAGER]: 'Branch Manager',
  [ROLE_CODES.COUNSELOR]: 'Counselor',
  [ROLE_CODES.RECEPTIONIST]: 'Receptionist',
  [ROLE_CODES.TEACHER]: 'Teacher',
  [ROLE_CODES.STUDENT]: 'Student',
};

export const ROLE_DESCRIPTIONS: Record<RoleCode, string> = {
  [ROLE_CODES.SUPER_ADMIN]:
    'Full organizational authority. Manages roles, permissions, branches, and system settings.',
  [ROLE_CODES.ADMIN]:
    'Organization-wide operational authority. Final document approver.',
  [ROLE_CODES.BRANCH_MANAGER]:
    'Manages a specific branch. Verifies documents. Cannot final-approve documents.',
  [ROLE_CODES.COUNSELOR]:
    'Manages leads, counseling, and assigned students within a branch.',
  [ROLE_CODES.RECEPTIONIST]:
    'Records payments and views student information within a branch.',
  [ROLE_CODES.TEACHER]:
    'Accesses assigned classes and records student attendance.',
  [ROLE_CODES.STUDENT]:
    'Views own profile, application status, documents, fees, and attendance.',
};