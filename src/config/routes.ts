// #must: Centralized route definitions — single source of truth for all app paths

export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  DASHBOARD: '/',

  PATIENTS: '/patients',
  PATIENT_DETAIL: '/patients/:id',

  PHARMACY_INVENTORY: '/pharmacy/inventory',
  PHARMACY_BILLING: '/pharmacy/billing',
  PHARMACY_ADD_MEDICINE: '/pharmacy/add-medicine',
  PHARMACY_SALES: '/pharmacy/sales',

  APPOINTMENTS: '/appointments',
  CONSULTATION: '/consultation/:id',
  PRESCRIPTIONS: '/prescriptions',

  LAB_BOOKINGS: '/lab/bookings',
  LAB_TESTS: '/lab/tests',
  LAB_REPORT_ENTRY: '/lab/report/:id',

  REPORTS_SALES: '/reports/sales',
  REPORTS_STOCK: '/reports/stock',
  REPORTS_EXPIRY: '/reports/expiry',
  REPORTS_DOCTOR: '/reports/doctor',
  REPORTS_LAB: '/reports/lab',

  SETTINGS_CLINIC: '/settings/clinic',
  SETTINGS_USERS: '/settings/users',
  SETTINGS_DOCTORS: '/settings/doctors',

  ACTIVITY_LOG: '/activity-log',
} as const;
