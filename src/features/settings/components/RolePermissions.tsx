
import { Card } from '@/components/ui';
import { ShieldCheck } from 'lucide-react';

interface RolePermissionRow {
  role: string;
  modules: string[];
  badgeColor: string;
}

const ROLE_PERMISSIONS: RolePermissionRow[] = [
  {
    role: 'Super Admin',
    modules: [
      'Dashboard',
      'Patients',
      'Pharmacy (Inventory, Billing, Sales)',
      'Appointments & Consultations',
      'Prescriptions',
      'Lab (Bookings, Tests, Reports)',
      'All Reports',
      'Clinic Settings',
      'User Management',
      'Activity Log',
    ],
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  {
    role: 'Doctor',
    modules: [
      'Dashboard',
      'Patients (view/edit)',
      'Appointments & Consultations',
      'Prescriptions',
      'Doctor Collection Report',
    ],
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    role: 'Pharmacist',
    modules: [
      'Dashboard',
      'Pharmacy (Inventory, Billing, Sales)',
      'Sales Report',
      'Stock Report',
      'Expiry Report',
    ],
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    role: 'Lab Staff',
    modules: [
      'Dashboard',
      'Patients (view)',
      'Lab Bookings',
      'Test Management',
      'Report Entry',
      'Lab Revenue Report',
    ],
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    role: 'Receptionist',
    modules: [
      'Dashboard',
      'Patients (register/view)',
      'Appointments (schedule/manage)',
      'Lab Bookings (create)',
    ],
    badgeColor: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
  },
];

export function RolePermissions() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Role Permissions Reference
        </h3>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Access is enforced via route guards. Permissions are fixed and cannot be changed from this
        screen.
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Accessible Modules
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
            {ROLE_PERMISSIONS.map((row) => (
              <tr key={row.role}>
                <td className="px-4 py-3 align-top">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${row.badgeColor}`}
                  >
                    {row.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ul className="flex flex-wrap gap-1.5">
                    {row.modules.map((mod) => (
                      <li
                        key={mod}
                        className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300"
                      >
                        {mod}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
