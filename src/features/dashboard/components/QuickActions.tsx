// #must: Role-appropriate quick action button grid — navigates to relevant routes

import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  CalendarPlus,
  FlaskConical,
  ShoppingCart,
  ClipboardList,
  BarChart2,
  Settings,
  Users,
  Pill,
  FileText,
  Stethoscope,
  TestTube,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';
import type { UserRole } from '@/types';
import type { LucideIcon } from 'lucide-react';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  route: string;
  color: string;
}

const ACTION_MAP: Record<UserRole, QuickAction[]> = {
  super_admin: [
    { label: 'Register Patient', icon: UserPlus, route: ROUTES.PATIENTS, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Book Appointment', icon: CalendarPlus, route: ROUTES.APPOINTMENTS, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
    { label: 'Book Lab Test', icon: FlaskConical, route: ROUTES.LAB_BOOKINGS, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Pharmacy Billing', icon: ShoppingCart, route: ROUTES.PHARMACY_BILLING, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'View Reports', icon: BarChart2, route: ROUTES.REPORTS_SALES, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
    { label: 'Manage Users', icon: Users, route: ROUTES.SETTINGS_USERS, color: 'text-slate-600 bg-slate-100 dark:bg-slate-700' },
  ],
  pharmacist: [
    { label: 'New Sale', icon: ShoppingCart, route: ROUTES.PHARMACY_BILLING, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Add Medicine', icon: Pill, route: ROUTES.PHARMACY_ADD_MEDICINE, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Inventory', icon: ClipboardList, route: ROUTES.PHARMACY_INVENTORY, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Sales Report', icon: BarChart2, route: ROUTES.REPORTS_SALES, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
    { label: 'Expiry Report', icon: FileText, route: ROUTES.REPORTS_EXPIRY, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
    { label: 'Stock Report', icon: Settings, route: ROUTES.REPORTS_STOCK, color: 'text-slate-600 bg-slate-100 dark:bg-slate-700' },
  ],
  doctor: [
    { label: 'Today\'s Schedule', icon: CalendarPlus, route: ROUTES.APPOINTMENTS, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Patients', icon: Users, route: ROUTES.PATIENTS, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Prescriptions', icon: FileText, route: ROUTES.PRESCRIPTIONS, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
    { label: 'Doctor Report', icon: Stethoscope, route: ROUTES.REPORTS_DOCTOR, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  ],
  lab_staff: [
    { label: 'Lab Bookings', icon: TestTube, route: ROUTES.LAB_BOOKINGS, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Lab Tests', icon: FlaskConical, route: ROUTES.LAB_TESTS, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Lab Report', icon: BarChart2, route: ROUTES.REPORTS_LAB, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Patients', icon: Users, route: ROUTES.PATIENTS, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
  ],
  receptionist: [
    { label: 'Register Patient', icon: UserPlus, route: ROUTES.PATIENTS, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Book Appointment', icon: CalendarPlus, route: ROUTES.APPOINTMENTS, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
    { label: 'Book Lab Test', icon: FlaskConical, route: ROUTES.LAB_BOOKINGS, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'All Patients', icon: Users, route: ROUTES.PATIENTS, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  ],
};

export interface QuickActionsProps {
  role: UserRole;
}

export function QuickActions({ role }: QuickActionsProps) {
  const navigate = useNavigate();
  const actions = ACTION_MAP[role] ?? ACTION_MAP.receptionist;

  return (
    <Card title="Quick Actions">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-transparent',
                'hover:border-gray-200 dark:hover:border-slate-600 hover:shadow-sm',
                'bg-gray-50 dark:bg-slate-700/50 transition-all duration-150 group'
              )}
            >
              <div className={cn('flex items-center justify-center h-10 w-10 rounded-lg', action.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight group-hover:text-gray-900 dark:group-hover:text-gray-100">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
