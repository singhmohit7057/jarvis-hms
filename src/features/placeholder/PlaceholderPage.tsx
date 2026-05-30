// #must: Temporary placeholder page — renders title so routing works before real pages are built
import { PageHeader } from '@/components/layout/PageHeader';

interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {title} — coming soon
        </p>
      </div>
    </div>
  );
}

// Pre-built placeholder components for each route (avoids lazy loading complexity)
export function DashboardPage() { return <PlaceholderPage title="Dashboard" />; }
export function PatientListPage() { return <PlaceholderPage title="Patients" />; }
export function PatientDetailPage() { return <PlaceholderPage title="Patient Details" />; }
export function InventoryPage() { return <PlaceholderPage title="Pharmacy Inventory" />; }
export function POSPage() { return <PlaceholderPage title="Pharmacy Billing" />; }
export function AddMedicinePage() { return <PlaceholderPage title="Add Medicine" />; }
export function SalesHistoryPage() { return <PlaceholderPage title="Sales History" />; }
export function AppointmentsPage() { return <PlaceholderPage title="Appointments" />; }
export function ConsultationPage() { return <PlaceholderPage title="Consultation" />; }
export function PrescriptionPage() { return <PlaceholderPage title="Prescriptions" />; }
export function LabBookingsPage() { return <PlaceholderPage title="Lab Bookings" />; }
export function TestManagementPage() { return <PlaceholderPage title="Test Management" />; }
export function ReportEntryPage() { return <PlaceholderPage title="Report Entry" />; }
export function SalesReportPage() { return <PlaceholderPage title="Sales Report" />; }
export function StockReportPage() { return <PlaceholderPage title="Stock Report" />; }
export function ExpiryReportPage() { return <PlaceholderPage title="Expiry Report" />; }
export function DoctorCollectionPage() { return <PlaceholderPage title="Doctor Collection Report" />; }
export function LabRevenuePage() { return <PlaceholderPage title="Lab Revenue Report" />; }
export function ClinicSettingsPage() { return <PlaceholderPage title="Clinic Settings" />; }
export function UserManagementPage() { return <PlaceholderPage title="User Management" />; }
export function ActivityLogPage() { return <PlaceholderPage title="Activity Log" />; }
