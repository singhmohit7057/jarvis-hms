// #must: Route definitions — all app routes with auth guards and role guards
import { Navigate, type RouteObject } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ROUTES } from '@/config/routes';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Spinner } from '@/components/ui';
import type { UserRole } from '@/types';

// Auth pages (not lazy — small, always needed)
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';

// Lazy-loaded page imports
const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);

// Patients
const PatientListPage = lazy(() =>
  import('@/features/patients/pages/PatientListPage').then((m) => ({ default: m.PatientListPage }))
);
const PatientDetailPage = lazy(() =>
  import('@/features/patients/pages/PatientDetailPage').then((m) => ({ default: m.PatientDetailPage }))
);

// Pharmacy
const InventoryPage = lazy(() =>
  import('@/features/pharmacy/pages/InventoryPage').then((m) => ({ default: m.InventoryPage }))
);
const POSPage = lazy(() =>
  import('@/features/pharmacy/pages/POSPage').then((m) => ({ default: m.POSPage }))
);
const AddMedicinePage = lazy(() =>
  import('@/features/pharmacy/pages/AddMedicinePage').then((m) => ({ default: m.AddMedicinePage }))
);
const SalesHistoryPage = lazy(() =>
  import('@/features/pharmacy/pages/SalesHistoryPage').then((m) => ({ default: m.SalesHistoryPage }))
);

// Doctor
const AppointmentsPage = lazy(() =>
  import('@/features/doctor/pages/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage }))
);
const ConsultationPage = lazy(() =>
  import('@/features/doctor/pages/ConsultationPage').then((m) => ({ default: m.ConsultationPage }))
);
const PrescriptionPage = lazy(() =>
  import('@/features/doctor/pages/PrescriptionPage').then((m) => ({ default: m.PrescriptionPage }))
);

// Lab
const LabBookingsPage = lazy(() =>
  import('@/features/lab/pages/LabBookingsPage').then((m) => ({ default: m.LabBookingsPage }))
);
const TestManagementPage = lazy(() =>
  import('@/features/lab/pages/TestManagementPage').then((m) => ({ default: m.TestManagementPage }))
);
const ReportEntryPage = lazy(() =>
  import('@/features/lab/pages/ReportEntryPage').then((m) => ({ default: m.ReportEntryPage }))
);

// Reports
const SalesReportPage = lazy(() =>
  import('@/features/reports/pages/SalesReportPage').then((m) => ({ default: m.SalesReportPage }))
);
const StockReportPage = lazy(() =>
  import('@/features/reports/pages/StockReportPage').then((m) => ({ default: m.StockReportPage }))
);
const ExpiryReportPage = lazy(() =>
  import('@/features/reports/pages/ExpiryReportPage').then((m) => ({ default: m.ExpiryReportPage }))
);
const DoctorCollectionPage = lazy(() =>
  import('@/features/reports/pages/DoctorCollectionPage').then((m) => ({ default: m.DoctorCollectionPage }))
);
const LabRevenuePage = lazy(() =>
  import('@/features/reports/pages/LabRevenuePage').then((m) => ({ default: m.LabRevenuePage }))
);

// Settings
const ClinicSettingsPage = lazy(() =>
  import('@/features/settings/pages/ClinicSettingsPage').then((m) => ({ default: m.ClinicSettingsPage }))
);
const UserManagementPage = lazy(() =>
  import('@/features/settings/pages/UserManagementPage').then((m) => ({ default: m.UserManagementPage }))
);
const DoctorManagementPage = lazy(() =>
  import('@/features/settings/pages/DoctorManagementPage').then((m) => ({ default: m.DoctorManagementPage }))
);

// Activity Log
const ActivityLogPage = lazy(() =>
  import('@/features/activity-log/pages/ActivityLogPage').then((m) => ({ default: m.ActivityLogPage }))
);

// Shared suspense fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <Spinner size="lg" />
    </div>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

// Role group shortcuts
const ALL_ROLES: UserRole[] = ['super_admin', 'pharmacist', 'doctor', 'lab_staff', 'receptionist'];
const ADMIN_ONLY: UserRole[] = ['super_admin'];
const PHARMACY_ROLES: UserRole[] = ['super_admin', 'pharmacist'];
const DOCTOR_ROLES: UserRole[] = ['super_admin', 'doctor'];
const LAB_ROLES: UserRole[] = ['super_admin', 'lab_staff'];
const PATIENT_ROLES: UserRole[] = ['super_admin', 'receptionist', 'doctor', 'lab_staff'];
const APPOINTMENT_ROLES: UserRole[] = ['super_admin', 'doctor', 'receptionist'];

export const routes: RouteObject[] = [
  // Public routes
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgotPasswordPage />,
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: <ResetPasswordPage />,
  },

  // Protected routes — require authentication
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Dashboard — all roles
          {
            element: <RoleRoute allowedRoles={ALL_ROLES} />,
            children: [
              {
                path: ROUTES.DASHBOARD,
                element: withSuspense(<DashboardPage />),
              },
            ],
          },

          // Patients — admin, receptionist, doctor, lab_staff
          {
            element: <RoleRoute allowedRoles={PATIENT_ROLES} />,
            children: [
              {
                path: ROUTES.PATIENTS,
                element: withSuspense(<PatientListPage />),
              },
              {
                path: ROUTES.PATIENT_DETAIL,
                element: withSuspense(<PatientDetailPage />),
              },
            ],
          },

          // Pharmacy — admin, pharmacist
          {
            element: <RoleRoute allowedRoles={PHARMACY_ROLES} />,
            children: [
              {
                path: ROUTES.PHARMACY_INVENTORY,
                element: withSuspense(<InventoryPage />),
              },
              {
                path: ROUTES.PHARMACY_BILLING,
                element: withSuspense(<POSPage />),
              },
              {
                path: ROUTES.PHARMACY_ADD_MEDICINE,
                element: withSuspense(<AddMedicinePage />),
              },
              {
                path: ROUTES.PHARMACY_SALES,
                element: withSuspense(<SalesHistoryPage />),
              },
            ],
          },

          // Appointments — admin, doctor, receptionist
          {
            element: <RoleRoute allowedRoles={APPOINTMENT_ROLES} />,
            children: [
              {
                path: ROUTES.APPOINTMENTS,
                element: withSuspense(<AppointmentsPage />),
              },
              {
                path: ROUTES.CONSULTATION,
                element: withSuspense(<ConsultationPage />),
              },
            ],
          },

          // Prescriptions — admin, doctor
          {
            element: <RoleRoute allowedRoles={DOCTOR_ROLES} />,
            children: [
              {
                path: ROUTES.PRESCRIPTIONS,
                element: withSuspense(<PrescriptionPage />),
              },
            ],
          },

          // Lab bookings — admin, lab_staff, receptionist
          {
            element: <RoleRoute allowedRoles={[...LAB_ROLES, 'receptionist']} />,
            children: [
              {
                path: ROUTES.LAB_BOOKINGS,
                element: withSuspense(<LabBookingsPage />),
              },
            ],
          },

          // Lab management — admin, lab_staff
          {
            element: <RoleRoute allowedRoles={LAB_ROLES} />,
            children: [
              {
                path: ROUTES.LAB_TESTS,
                element: withSuspense(<TestManagementPage />),
              },
              {
                path: ROUTES.LAB_REPORT_ENTRY,
                element: withSuspense(<ReportEntryPage />),
              },
            ],
          },

          // Reports — sales (admin only)
          {
            element: <RoleRoute allowedRoles={ADMIN_ONLY} />,
            children: [
              {
                path: ROUTES.REPORTS_SALES,
                element: withSuspense(<SalesReportPage />),
              },
            ],
          },

          // Reports — pharmacy
          {
            element: <RoleRoute allowedRoles={PHARMACY_ROLES} />,
            children: [
              {
                path: ROUTES.REPORTS_STOCK,
                element: withSuspense(<StockReportPage />),
              },
              {
                path: ROUTES.REPORTS_EXPIRY,
                element: withSuspense(<ExpiryReportPage />),
              },
            ],
          },

          // Reports — doctor
          {
            element: <RoleRoute allowedRoles={DOCTOR_ROLES} />,
            children: [
              {
                path: ROUTES.REPORTS_DOCTOR,
                element: withSuspense(<DoctorCollectionPage />),
              },
            ],
          },

          // Reports — lab
          {
            element: <RoleRoute allowedRoles={LAB_ROLES} />,
            children: [
              {
                path: ROUTES.REPORTS_LAB,
                element: withSuspense(<LabRevenuePage />),
              },
            ],
          },

          // Settings — admin only
          {
            element: <RoleRoute allowedRoles={ADMIN_ONLY} />,
            children: [
              {
                path: ROUTES.SETTINGS_CLINIC,
                element: withSuspense(<ClinicSettingsPage />),
              },
              {
                path: ROUTES.SETTINGS_USERS,
                element: withSuspense(<UserManagementPage />),
              },
              {
                path: ROUTES.SETTINGS_DOCTORS,
                element: withSuspense(<DoctorManagementPage />),
              },
              {
                path: ROUTES.ACTIVITY_LOG,
                element: withSuspense(<ActivityLogPage />),
              },
            ],
          },

          // Catch-all — redirect to dashboard
          {
            path: '*',
            element: <Navigate to={ROUTES.DASHBOARD} replace />,
          },
        ],
      },
    ],
  },
];
