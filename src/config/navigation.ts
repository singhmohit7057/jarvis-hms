// #must: Sidebar navigation configuration — defines menu structure and role-based access

import { USER_ROLES } from './constants';
import { ROUTES } from './routes';

export interface NavItem {
  title: string;
  icon: string;
  path: string;
  allowedRoles: string[];
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

const allRoles = Object.values(USER_ROLES);

export const NAVIGATION: NavGroup[] = [
  {
    group: 'Dashboard',
    items: [
      {
        title: 'Dashboard',
        icon: 'LayoutDashboard',
        path: ROUTES.DASHBOARD,
        allowedRoles: allRoles,
      },
    ],
  },
  {
    group: 'Patients',
    items: [
      {
        title: 'Patient Records',
        icon: 'Users',
        path: ROUTES.PATIENTS,
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.RECEPTIONIST, USER_ROLES.DOCTOR],
      },
    ],
  },
  {
    group: 'Pharmacy',
    items: [
      {
        title: 'Inventory',
        icon: 'Package',
        path: ROUTES.PHARMACY_INVENTORY,
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.PHARMACIST],
      },
      {
        title: 'Billing',
        icon: 'ShoppingCart',
        path: ROUTES.PHARMACY_BILLING,
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.PHARMACIST],
      },
      {
        title: 'Add Medicine',
        icon: 'PlusCircle',
        path: ROUTES.PHARMACY_ADD_MEDICINE,
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.PHARMACIST],
      },
      {
        title: 'Sales History',
        icon: 'Receipt',
        path: ROUTES.PHARMACY_SALES,
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.PHARMACIST],
      },
    ],
  },
  {
    group: 'Doctor',
    items: [
      {
        title: 'Appointments',
        icon: 'Calendar',
        path: ROUTES.APPOINTMENTS,
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DOCTOR, USER_ROLES.RECEPTIONIST],
      },
      {
        title: 'Prescriptions',
        icon: 'FileText',
        path: ROUTES.PRESCRIPTIONS,
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DOCTOR],
      },
    ],
  },
  {
    group: 'Lab',
    items: [
      {
        title: 'Bookings',
        icon: 'TestTube',
        path: ROUTES.LAB_BOOKINGS,
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.LAB_STAFF, USER_ROLES.RECEPTIONIST],
      },
      {
        title: 'Test Catalog',
        icon: 'Beaker',
        path: ROUTES.LAB_TESTS,
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.LAB_STAFF],
      },
    ],
  },
  {
    group: 'Reports',
    items: [
      {
        title: 'Sales Report',
        icon: 'TrendingUp',
        path: ROUTES.REPORTS_SALES,
        allowedRoles: [USER_ROLES.SUPER_ADMIN],
      },
      {
        title: 'Stock Report',
        icon: 'BarChart3',
        path: ROUTES.REPORTS_STOCK,
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.PHARMACIST],
      },
      {
        title: 'Expiry Report',
        icon: 'AlertTriangle',
        path: ROUTES.REPORTS_EXPIRY,
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.PHARMACIST],
      },
      {
        title: 'Doctor Report',
        icon: 'Stethoscope',
        path: ROUTES.REPORTS_DOCTOR,
        allowedRoles: [USER_ROLES.SUPER_ADMIN],
      },
      {
        title: 'Lab Report',
        icon: 'FlaskConical',
        path: ROUTES.REPORTS_LAB,
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.LAB_STAFF],
      },
    ],
  },
  {
    group: 'Settings',
    items: [
      {
        title: 'Clinic Settings',
        icon: 'Settings',
        path: ROUTES.SETTINGS_CLINIC,
        allowedRoles: [USER_ROLES.SUPER_ADMIN],
      },
      {
        title: 'User Management',
        icon: 'UserCog',
        path: ROUTES.SETTINGS_USERS,
        allowedRoles: [USER_ROLES.SUPER_ADMIN],
      },
      {
        title: 'Doctors',
        icon: 'Stethoscope',
        path: ROUTES.SETTINGS_DOCTORS,
        allowedRoles: [USER_ROLES.SUPER_ADMIN],
      },
      {
        title: 'Activity Log',
        icon: 'ScrollText',
        path: ROUTES.ACTIVITY_LOG,
        allowedRoles: [USER_ROLES.SUPER_ADMIN],
      },
    ],
  },
];
