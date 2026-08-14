/**
 * Re-export permission codes from shared config for convenient client-side usage.
 * Keep this thin — the source of truth is @consultancy/config.
 */
export { PERMISSION_CODES, ROLE_CODES } from '@consultancy/config';
export type { PermissionCode, RoleCode } from '@consultancy/config';