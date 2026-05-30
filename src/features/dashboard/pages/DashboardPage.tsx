// #must: Main dashboard page — renders role-specific dashboard with greeting header

import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { SuperAdminDashboard } from '../components/SuperAdminDashboard';
import { PharmacistDashboard } from '../components/PharmacistDashboard';
import { DoctorDashboard } from '../components/DoctorDashboard';
import { LabStaffDashboard } from '../components/LabStaffDashboard';
import { ReceptionistDashboard } from '../components/ReceptionistDashboard';

function formatGreetingDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" className="text-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  const greeting = `Welcome back, ${user.name}`;

  function renderDashboard() {
    switch (user!.role) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'pharmacist':
        return <PharmacistDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'lab_staff':
        return <LabStaffDashboard />;
      case 'receptionist':
        return <ReceptionistDashboard />;
      default:
        return (
          <div className="text-center py-20 text-gray-400">
            <p>Dashboard not configured for your role.</p>
          </div>
        );
    }
  }

  return (
    <div>
      <PageHeader
        title={greeting}
        subtitle={formatGreetingDate()}
      />
      {renderDashboard()}
    </div>
  );
}
