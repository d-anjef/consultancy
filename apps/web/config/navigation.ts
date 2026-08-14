import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarClock,
  GraduationCap,
  FileText,
  Files,
  Wallet,
  ClipboardCheck,
  ClipboardList,
  BookOpen,
  Building2,
  Bell,
  BarChart3,
  ListTodo,
  ShieldCheck,
  Settings,
  Activity,
  User,
  QrCode,
  Stamp,
  Languages,
} from 'lucide-react';
import { PERMISSION_CODES, type PermissionCode } from '@consultancy/config';
import {MapPin} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredPermissions?: PermissionCode[];
  requireAny?: PermissionCode[];
  badge?: 'new' | 'beta';
  children?: NavItem[];
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const STAFF_NAVIGATION: NavSection[] = [
  {
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Leads',
        href: '/leads',
        icon: UserPlus,
        requireAny: [PERMISSION_CODES.VIEW_LEAD, PERMISSION_CODES.CREATE_LEAD],
      },
      {
        label: 'Counseling',
        href: '/counseling',
        icon: CalendarClock,
        requireAny: [PERMISSION_CODES.VIEW_COUNSELING, PERMISSION_CODES.CREATE_COUNSELING],
      },
      {
        label: 'Students',
        href: '/students',
        icon: GraduationCap,
        requiredPermissions: [PERMISSION_CODES.VIEW_STUDENT],
      },
      {
        label: 'Applications',
        href: '/applications',
        icon: FileText,
        requiredPermissions: [PERMISSION_CODES.VIEW_APPLICATION],
      },
      {
        label: 'Documents',
        href: '/documents',
        icon: Files,
        requiredPermissions: [PERMISSION_CODES.VIEW_DOCUMENT],
      },
    ],
  },
  {
    label: 'Academic',
    items: [
      {
        label: 'Classes',
        href: '/classes',
        icon: BookOpen,
        requireAny: [PERMISSION_CODES.VIEW_CLASS, PERMISSION_CODES.VIEW_OWN_CLASSES],
      },
       {
      label: 'Teachers Hub',  
      href: '/teachers-hub',
      icon: BookOpen,
      requireAny: [PERMISSION_CODES.VIEW_TEACHER, PERMISSION_CODES.VIEW_OWN_CLASSES],
    },
      {
        label: 'Attendance',
        href: '/attendance',
        icon: ClipboardCheck,
        requireAny: [PERMISSION_CODES.VIEW_ATTENDANCE, PERMISSION_CODES.RECORD_ATTENDANCE],
      },
      {
        label: 'Teachers',
        href: '/teachers',
        icon: Users,
        requiredPermissions: [PERMISSION_CODES.VIEW_TEACHER],
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        label: 'Finance',
        href: '/finance',
        icon: Wallet,
        requiredPermissions: [PERMISSION_CODES.VIEW_FINANCE],
      },
    ],
  },
  {
    label: 'Workspace',
    items: [
      {
        label: 'Tasks',
        href: '/tasks',
        icon: ListTodo,
        requiredPermissions: [PERMISSION_CODES.VIEW_TASK],
      },
      {
        label: 'Notifications',
        href: '/notifications',
        icon: Bell,
        requiredPermissions: [PERMISSION_CODES.VIEW_NOTIFICATION],
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        label: 'Reports',
        href: '/reports',
        icon: BarChart3,
        requiredPermissions: [PERMISSION_CODES.VIEW_REPORT],
      },
    ],
  },
  {
    label: 'Configuration',
    items: [
      {
        label: 'Programs',
        href: '/programs',
        icon: BookOpen,
        requiredPermissions: [PERMISSION_CODES.MANAGE_PROGRAMS],
      },
      {
        label: 'Visa Categories',
        href: '/visa-categories',
        icon: Stamp,
        requiredPermissions: [PERMISSION_CODES.MANAGE_VISA_CATEGORIES],
      },
      {
      label: 'Language Levels',   
      href: '/language-levels',
      icon: Languages,
      requiredPermissions: [PERMISSION_CODES.MANAGE_SETTINGS],
    },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Branches',
        href: '/branches',
        icon: Building2,
        requireAny: [PERMISSION_CODES.VIEW_ALL_BRANCHES, PERMISSION_CODES.CREATE_BRANCH],
      },
      {
        label: 'Users',
        href: '/users',
        icon: Users,
        requiredPermissions: [PERMISSION_CODES.VIEW_USERS],
      },
      {
        label: 'Roles',
        href: '/roles',
        icon: ShieldCheck,
        requiredPermissions: [PERMISSION_CODES.MANAGE_ROLES],
      },
      {
        label: 'Audit Logs',
        href: '/audit',
        icon: Activity,
        requiredPermissions: [PERMISSION_CODES.VIEW_AUDIT_LOG],
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        requiredPermissions: [PERMISSION_CODES.MANAGE_SETTINGS],
      },
    ],

    
  },
];



export const STUDENT_NAVIGATION: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/my/dashboard', icon: LayoutDashboard },
      { label: 'My Profile', href: '/my/profile', icon: User },
      {label: 'My Journey', href: '/my/journey', icon: MapPin},
      { label: 'My Application', href: '/my/application', icon: FileText },
      { label: 'Documents', href: '/my/documents', icon: Files },
      { label: 'Fees', href: '/my/fees', icon: Wallet },
      { label: 'Classes', href: '/my/classes', icon: BookOpen },
      { label: 'Attendance', href: '/my/attendance', icon: ClipboardList },
      { label: 'Notifications', href: '/my/notifications', icon: Bell },
      { label: 'My QR', href: '/my/qr', icon: QrCode },
      
    ],
  },
];