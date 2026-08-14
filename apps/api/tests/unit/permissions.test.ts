import { describe, it, expect } from 'vitest';
import {
  ALL_PERMISSION_CODES,
  PERMISSION_METADATA,
  ROLE_PERMISSIONS,
  ROLE_CODES,
  ALL_ROLE_CODES,
} from '@consultancy/config';

describe('Permissions Registry', () => {
  it('should have metadata for every permission code', () => {
    for (const code of ALL_PERMISSION_CODES) {
      expect(PERMISSION_METADATA[code]).toBeDefined();
      expect(PERMISSION_METADATA[code].category).toBeTruthy();
      expect(PERMISSION_METADATA[code].description).toBeTruthy();
    }
  });

  it('should have all 78 permissions defined', () => {
    expect(ALL_PERMISSION_CODES.length).toBe(78);
  });

  it('should have unique permission codes', () => {
    const set = new Set(ALL_PERMISSION_CODES);
    expect(set.size).toBe(ALL_PERMISSION_CODES.length);
  });
});

describe('Roles Registry', () => {
  it('should have exactly 7 system roles', () => {
    expect(ALL_ROLE_CODES.length).toBe(7);
  });

  it('should have permission mappings for every role', () => {
    for (const roleCode of ALL_ROLE_CODES) {
      expect(ROLE_PERMISSIONS[roleCode]).toBeDefined();
      expect(Array.isArray(ROLE_PERMISSIONS[roleCode])).toBe(true);
    }
  });

  it('Super Admin should have all 78 permissions', () => {
    expect(ROLE_PERMISSIONS[ROLE_CODES.SUPER_ADMIN].length).toBe(78);
  });

  it('Student should NOT have staff permissions', () => {
    const studentPerms = ROLE_PERMISSIONS[ROLE_CODES.STUDENT];
    expect(studentPerms).not.toContain('CREATE_STUDENT');
    expect(studentPerms).not.toContain('VIEW_STUDENT');
    expect(studentPerms).not.toContain('UPLOAD_DOCUMENT');
    expect(studentPerms).not.toContain('CREATE_INVOICE');
    expect(studentPerms).not.toContain('FINAL_APPROVE_DOCUMENT');
  });

  it('Branch Manager should NOT have FINAL_APPROVE_DOCUMENT', () => {
    const bmPerms = ROLE_PERMISSIONS[ROLE_CODES.BRANCH_MANAGER];
    expect(bmPerms).not.toContain('FINAL_APPROVE_DOCUMENT');
    expect(bmPerms).toContain('VERIFY_DOCUMENT');
  });

  it('Receptionist should have payment recording but NOT invoice creation', () => {
    const recPerms = ROLE_PERMISSIONS[ROLE_CODES.RECEPTIONIST];
    expect(recPerms).toContain('CREATE_PAYMENT');
    expect(recPerms).toContain('VIEW_FINANCE');
    expect(recPerms).not.toContain('CREATE_INVOICE');
    expect(recPerms).not.toContain('CREATE_APPLICATION');
  });

  it('Teacher should have QR scan but NOT student edit', () => {
    const teachPerms = ROLE_PERMISSIONS[ROLE_CODES.TEACHER];
    expect(teachPerms).toContain('SCAN_QR_ATTENDANCE');
    expect(teachPerms).toContain('VIEW_OWN_CLASSES');
    expect(teachPerms).not.toContain('EDIT_STUDENT');
    expect(teachPerms).not.toContain('CREATE_APPLICATION');
  });

  it('all role permissions must exist in ALL_PERMISSION_CODES', () => {
    for (const roleCode of ALL_ROLE_CODES) {
      for (const perm of ROLE_PERMISSIONS[roleCode]) {
        expect(ALL_PERMISSION_CODES).toContain(perm);
      }
    }
  });
});