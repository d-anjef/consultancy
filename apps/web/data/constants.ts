export const APP_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  TABLE_PAGE_SIZE_OPTIONS: [10, 20, 50, 100],

  DATE_FORMAT: {
    SHORT: 'MMM dd, yyyy' as string,
    LONG: 'MMMM dd, yyyy' as string,
    WITH_TIME: 'MMM dd, yyyy hh:mm a' as string,
    ISO: 'yyyy-MM-dd' as string,
    TIME_ONLY: 'hh:mm a' as string,
  },

  CURRENCY: {
    CODE: 'NPR',
    SYMBOL: 'Rs.',
    LOCALE: 'en-NP',
  },

  TIMEZONE: 'Asia/Kathmandu',

  DEBOUNCE_MS: {
    SEARCH: 300,
    INPUT: 500,
  },

  TOAST_DURATION_MS: {
    SUCCESS: 3000,
    ERROR: 5000,
    INFO: 4000,
  },

  STATUS_COLORS: {
    ACTIVE: 'success',
    PENDING: 'warning',
    INACTIVE: 'muted',
    APPROVED: 'success',
    REJECTED: 'destructive',
    DRAFT: 'muted',
    NEW: 'primary',
  } as const,
} as const;

export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ACTIVATE: '/activate',
  MFA_VERIFY: '/verify-mfa',

  DASHBOARD: '/dashboard',

  LEADS: '/leads',
  COUNSELING: '/counseling',
  STUDENTS: '/students',
  APPLICATIONS: '/applications',
  DOCUMENTS: '/documents',
  FINANCE: '/finance',
  ATTENDANCE: '/attendance',
  CLASSES: '/classes',
  TEACHERS: '/teachers',
  BRANCHES: '/branches',
  USERS: '/users',
  ROLES: '/roles',
  NOTIFICATIONS: '/notifications',
  TASKS: '/tasks',
  REPORTS: '/reports',
  AUDIT: '/audit',
  SETTINGS: '/settings',

  MY_DASHBOARD: '/my/dashboard',
  MY_PROFILE: '/my/profile',
  MY_APPLICATION: '/my/application',
  MY_DOCUMENTS: '/my/documents',
  MY_FEES: '/my/fees',
  MY_CLASSES: '/my/classes',
  MY_ATTENDANCE: '/my/attendance',
  MY_NOTIFICATIONS: '/my/notifications',
  MY_QR: '/my/qr',
} as const;