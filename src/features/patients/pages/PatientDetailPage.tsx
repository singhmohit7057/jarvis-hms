// #must: Patient detail page — info card, tabbed view (appointments, prescriptions, lab reports, timeline)
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Pill,
  TestTube2,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Droplets,
  AlertTriangle,
  Heart,
  Download,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/config/routes';
import { formatDate, formatDateTime, formatCurrency, formatPhone } from '@/lib/formatters';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import type { ColumnDef } from '@tanstack/react-table';
import type { Patient, Appointment, Prescription, LabBooking } from '@/types';

type TabId = 'appointments' | 'prescriptions' | 'lab-reports' | 'timeline';

interface TimelineEvent {
  id: string;
  type: 'appointment' | 'prescription' | 'lab';
  title: string;
  description: string;
  date: string;
  status: string;
}

const TAB_ITEMS = [
  { id: 'appointments' as const, label: 'Appointments', icon: Calendar },
  { id: 'prescriptions' as const, label: 'Prescriptions', icon: Pill },
  { id: 'lab-reports' as const, label: 'Lab Reports', icon: TestTube2 },
  { id: 'timeline' as const, label: 'Timeline', icon: Clock },
];

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('appointments');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  // Fetch patient details
  const { data: patientRows, isLoading: loadingPatient } = useSupabaseQuery<Record<string, unknown>>(
    async () =>
      supabase
        .from('patients')
        .select('*')
        .eq('id', id!)
        .limit(1),
    [id]
  );

  // Map patient data
  const patient: Patient | null = useMemo(() => {
    if (patientRows.length === 0) return null;
    const p = patientRows[0];
    return {
      id: p.id as string,
      patientId: (p.patient_id ?? p.patientId) as string,
      name: p.name as string,
      age: p.age as number,
      gender: p.gender as Patient['gender'],
      phone: p.phone as string,
      email: (p.email as string) || undefined,
      address: (p.address as string) || '',
      bloodGroup: (p.blood_group ?? p.bloodGroup) as string | undefined,
      allergies: (p.allergies as string) || undefined,
      medicalHistory: (p.medical_history ?? p.medicalHistory) as string | undefined,
      emergencyContactName: (p.emergency_contact_name ?? p.emergencyContactName) as string | undefined,
      emergencyContactPhone: (p.emergency_contact_phone ?? p.emergencyContactPhone) as string | undefined,
      createdAt: (p.created_at ?? p.createdAt) as string,
    };
  }, [patientRows]);

  // Fetch appointments
  const { data: appointmentsRaw, isLoading: loadingAppointments } = useSupabaseQuery<Record<string, unknown>>(
    async () =>
      supabase
        .from('appointments')
        .select('*, doctor:doctors(name, specialization)')
        .eq('patient_id', id!)
        .order('date', { ascending: false }),
    [id]
  );

  const appointments: Appointment[] = useMemo(
    () =>
      appointmentsRaw.map((a) => ({
        id: a.id as string,
        appointmentNo: (a.appointment_no ?? a.appointmentNo) as string,
        patientId: (a.patient_id ?? a.patientId) as string,
        doctorId: (a.doctor_id ?? a.doctorId) as string,
        doctor: a.doctor as Appointment['doctor'],
        date: a.date as string,
        time: a.time as string,
        fee: a.fee as number,
        paymentStatus: (a.payment_status ?? a.paymentStatus) as Appointment['paymentStatus'],
        status: a.status as Appointment['status'],
        createdAt: (a.created_at ?? a.createdAt) as string,
      })),
    [appointmentsRaw]
  );

  // Fetch prescriptions
  const { data: prescriptionsRaw, isLoading: loadingPrescriptions } = useSupabaseQuery<Record<string, unknown>>(
    async () =>
      supabase
        .from('prescriptions')
        .select('*, items:prescription_items(*), doctor:doctors(name)')
        .eq('patient_id', id!)
        .order('created_at', { ascending: false }),
    [id]
  );

  const prescriptions: Prescription[] = useMemo(
    () =>
      prescriptionsRaw.map((rx) => ({
        id: rx.id as string,
        prescriptionNo: (rx.prescription_no ?? rx.prescriptionNo) as string,
        appointmentId: (rx.appointment_id ?? rx.appointmentId) as string,
        consultationId: (rx.consultation_id ?? rx.consultationId) as string,
        patientId: (rx.patient_id ?? rx.patientId) as string,
        doctorId: (rx.doctor_id ?? rx.doctorId) as string,
        doctor: rx.doctor as Prescription['doctor'],
        diagnosis: rx.diagnosis as string,
        advice: (rx.advice as string) || '',
        followupDate: (rx.followup_date ?? rx.followupDate) as string | undefined,
        items: ((rx.items as Record<string, unknown>[]) || []).map((item) => ({
          id: item.id as string,
          prescriptionId: (item.prescription_id ?? item.prescriptionId) as string,
          medicineName: (item.medicine_name ?? item.medicineName) as string,
          dosage: item.dosage as string,
          frequency: item.frequency as string,
          duration: item.duration as string,
          timing: item.timing as string,
          instructions: item.instructions as string | undefined,
        })),
        createdAt: (rx.created_at ?? rx.createdAt) as string,
      })),
    [prescriptionsRaw]
  );

  // Fetch lab bookings
  const { data: labBookingsRaw, isLoading: loadingLabs } = useSupabaseQuery<Record<string, unknown>>(
    async () =>
      supabase
        .from('lab_bookings')
        .select('*, tests:lab_booking_tests(test_name, price)')
        .eq('patient_id', id!)
        .order('created_at', { ascending: false }),
    [id]
  );

  const labBookings: LabBooking[] = useMemo(
    () =>
      labBookingsRaw.map((lb) => ({
        id: lb.id as string,
        bookingNumber: (lb.booking_number ?? lb.bookingNumber) as string,
        patientId: (lb.patient_id ?? lb.patientId) as string,
        tests: ((lb.tests as Record<string, unknown>[]) || []).map((t) => ({
          id: (t.id as string) || '',
          labBookingId: (t.lab_booking_id ?? t.labBookingId) as string,
          labTestId: (t.lab_test_id ?? t.labTestId) as string,
          testName: (t.test_name ?? t.testName) as string,
          price: t.price as number,
        })),
        totalAmount: (lb.total_amount ?? lb.totalAmount) as number,
        paymentStatus: (lb.payment_status ?? lb.paymentStatus) as LabBooking['paymentStatus'],
        paymentMethod: (lb.payment_method ?? lb.paymentMethod) as LabBooking['paymentMethod'],
        status: lb.status as LabBooking['status'],
        collectedBy: (lb.collected_by ?? lb.collectedBy) as string | undefined,
        processedBy: (lb.processed_by ?? lb.processedBy) as string | undefined,
        verifiedBy: (lb.verified_by ?? lb.verifiedBy) as string | undefined,
        createdAt: (lb.created_at ?? lb.createdAt) as string,
      })),
    [labBookingsRaw]
  );

  // Build timeline events
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = [];

    appointments.forEach((apt) => {
      events.push({
        id: `apt-${apt.id}`,
        type: 'appointment',
        title: `Appointment with Dr. ${apt.doctor?.name ?? 'Unknown'}`,
        description: `${apt.status} - Fee: ${formatCurrency(apt.fee)}`,
        date: apt.date,
        status: apt.status,
      });
    });

    prescriptions.forEach((rx) => {
      events.push({
        id: `rx-${rx.id}`,
        type: 'prescription',
        title: `Prescription by Dr. ${rx.doctor?.name ?? 'Unknown'}`,
        description: `Diagnosis: ${rx.diagnosis}`,
        date: rx.createdAt,
        status: 'completed',
      });
    });

    labBookings.forEach((lb) => {
      const testNames = lb.tests.map((t) => t.testName).join(', ');
      events.push({
        id: `lab-${lb.id}`,
        type: 'lab',
        title: `Lab: ${testNames || 'Tests booked'}`,
        description: `Amount: ${formatCurrency(lb.totalAmount)} - ${lb.status}`,
        date: lb.createdAt,
        status: lb.status,
      });
    });

    // Sort by date descending
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events;
  }, [appointments, prescriptions, labBookings]);

  // Appointment columns
  const appointmentColumns: ColumnDef<Appointment, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'time',
        header: 'Time',
      },
      {
        id: 'doctor',
        header: 'Doctor',
        cell: ({ row }) => `Dr. ${row.original.doctor?.name ?? 'Unknown'}`,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} type="appointment" />,
      },
      {
        accessorKey: 'fee',
        header: 'Fee',
        cell: ({ row }) => formatCurrency(row.original.fee),
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} type="payment" />,
      },
    ],
    []
  );

  // Prescription columns
  const prescriptionColumns: ColumnDef<Prescription, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: 'prescriptionNo',
        header: 'Prescription No.',
        cell: ({ row }) => (
          <Badge variant="default" size="sm">
            {row.original.prescriptionNo}
          </Badge>
        ),
      },
      {
        id: 'doctor',
        header: 'Doctor',
        cell: ({ row }) => `Dr. ${row.original.doctor?.name ?? 'Unknown'}`,
      },
      {
        accessorKey: 'diagnosis',
        header: 'Diagnosis',
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate block">
            {row.original.diagnosis}
          </span>
        ),
      },
      {
        id: 'medicines',
        header: 'Medicines',
        cell: ({ row }) => (
          <span className="text-gray-500">{row.original.items.length} items</span>
        ),
      },
    ],
    []
  );

  // Lab columns
  const labColumns: ColumnDef<LabBooking, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: 'bookingNumber',
        header: 'Booking No.',
        cell: ({ row }) => (
          <Badge variant="default" size="sm">
            {row.original.bookingNumber}
          </Badge>
        ),
      },
      {
        id: 'tests',
        header: 'Tests',
        cell: ({ row }) => (
          <span className="max-w-[250px] truncate block">
            {row.original.tests.map((t) => t.testName).join(', ')}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} type="lab" />,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Amount',
        cell: ({ row }) => formatCurrency(row.original.totalAmount),
      },
    ],
    []
  );

  // Loading state
  if (loadingPatient) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // Patient not found
  if (!patient) {
    return (
      <div>
        <PageHeader
          title="Patient Not Found"
          actions={
            <Button variant="ghost" onClick={() => navigate(ROUTES.PATIENTS)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Button>
          }
        />
        <EmptyState
          icon={User}
          title="Patient not found"
          description="The patient you are looking for does not exist or has been removed."
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={patient.name}
        subtitle={`${patient.patientId} | ${patient.gender}, ${patient.age} yrs`}
        breadcrumbs={[
          { label: 'Patients', path: ROUTES.PATIENTS },
          { label: patient.name },
        ]}
        actions={
          <Button variant="ghost" onClick={() => navigate(ROUTES.PATIENTS)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      {/* Patient Info Card */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <InfoItem icon={User} label="Full Name" value={patient.name} />
          <InfoItem icon={Calendar} label="Age / Gender" value={`${patient.age} yrs / ${patient.gender}`} />
          <InfoItem icon={Phone} label="Phone" value={formatPhone(patient.phone)} />
          <InfoItem icon={Mail} label="Email" value={patient.email || 'Not provided'} />
          <InfoItem icon={MapPin} label="Address" value={patient.address || 'Not provided'} />
          <InfoItem icon={Droplets} label="Blood Group" value={patient.bloodGroup || 'Unknown'} />
          <InfoItem icon={AlertTriangle} label="Allergies" value={patient.allergies || 'None reported'} />
          <InfoItem icon={Heart} label="Medical History" value={patient.medicalHistory || 'None recorded'} />
          {patient.emergencyContact && (
            <InfoItem icon={Phone} label="Emergency Contact" value={patient.emergencyContact} />
          )}
          <InfoItem icon={Clock} label="Registered On" value={formatDateTime(patient.createdAt)} />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={TAB_ITEMS}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as TabId)}
      />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'appointments' && (
          <AppointmentsTab
            appointments={appointments}
            columns={appointmentColumns}
            isLoading={loadingAppointments}
            navigate={navigate}
          />
        )}
        {activeTab === 'prescriptions' && (
          <PrescriptionsTab
            prescriptions={prescriptions}
            columns={prescriptionColumns}
            isLoading={loadingPrescriptions}
            onViewPrescription={setSelectedPrescription}
          />
        )}
        {activeTab === 'lab-reports' && (
          <LabReportsTab
            labBookings={labBookings}
            columns={labColumns}
            isLoading={loadingLabs}
          />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab events={timelineEvents} />
        )}
      </div>

      {/* Prescription Detail Modal */}
      <Modal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title={`Prescription ${selectedPrescription?.prescriptionNo ?? ''}`}
        size="lg"
      >
        {selectedPrescription && (
          <PrescriptionDetail prescription={selectedPrescription} />
        )}
      </Modal>
    </div>
  );
}

// --- Sub-components ---

function InfoItem({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 shrink-0">
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function AppointmentsTab({
  appointments,
  columns,
  isLoading,
  navigate,
}: {
  appointments: Appointment[];
  columns: ColumnDef<Appointment, unknown>[];
  isLoading: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <DataTable
      columns={columns}
      data={appointments}
      isLoading={isLoading}
      emptyMessage="No appointments found"
      pagination
      pageSize={10}
      onRowClick={(apt) => {
        if (apt.status === 'in_progress' || apt.status === 'completed') {
          navigate(ROUTES.CONSULTATION.replace(':id', apt.id));
        }
      }}
    />
  );
}

function PrescriptionsTab({
  prescriptions,
  columns,
  isLoading,
  onViewPrescription,
}: {
  prescriptions: Prescription[];
  columns: ColumnDef<Prescription, unknown>[];
  isLoading: boolean;
  onViewPrescription: (rx: Prescription) => void;
}) {
  return (
    <DataTable
      columns={columns}
      data={prescriptions}
      isLoading={isLoading}
      emptyMessage="No prescriptions found"
      pagination
      pageSize={10}
      onRowClick={onViewPrescription}
    />
  );
}

function LabReportsTab({
  labBookings,
  columns,
  isLoading,
}: {
  labBookings: LabBooking[];
  columns: ColumnDef<LabBooking, unknown>[];
  isLoading: boolean;
}) {
  return (
    <DataTable
      columns={columns}
      data={labBookings}
      isLoading={isLoading}
      emptyMessage="No lab reports found"
      pagination
      pageSize={10}
    />
  );
}

function TimelineTab({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No activity yet"
        description="This patient has no recorded events"
      />
    );
  }

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'appointment':
        return Calendar;
      case 'prescription':
        return Pill;
      case 'lab':
        return TestTube2;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'prescription':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'lab':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    }
  };

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-2 bottom-2 w-px bg-gray-200 dark:bg-slate-700" />

      <div className="space-y-4">
        {events.map((event) => {
          const Icon = getEventIcon(event.type);
          const colorClass = getEventColor(event.type);

          return (
            <div key={event.id} className="relative flex items-start gap-4 pl-2">
              {/* Icon */}
              <div className={`relative z-10 p-2 rounded-full shrink-0 ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {event.title}
                  </p>
                  <StatusBadge
                    status={event.status}
                    type={event.type === 'appointment' ? 'appointment' : event.type === 'lab' ? 'lab' : undefined}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {event.description}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatDateTime(event.date)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrescriptionDetail({ prescription }: { prescription: Prescription }) {
  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Doctor:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
            Dr. {prescription.doctor?.name ?? 'Unknown'}
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Date:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
            {formatDate(prescription.createdAt)}
          </span>
        </div>
      </div>

      {/* Diagnosis */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Diagnosis</h4>
        <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
          {prescription.diagnosis}
        </p>
      </div>

      {/* Medicines table */}
      {prescription.items.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Medicines</h4>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Medicine</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Dosage</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Frequency</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Duration</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Timing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {prescription.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                      {item.medicineName}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.dosage}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.frequency}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.duration}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.timing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Advice */}
      {prescription.advice && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Advice</h4>
          <p className="text-sm text-gray-800 dark:text-gray-200">{prescription.advice}</p>
        </div>
      )}

      {/* Follow-up */}
      {prescription.followupDate && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Follow-up Date</h4>
          <p className="text-sm text-gray-800 dark:text-gray-200">
            {formatDate(prescription.followupDate)}
          </p>
        </div>
      )}

      {/* Download button */}
      <div className="flex justify-end pt-2">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
