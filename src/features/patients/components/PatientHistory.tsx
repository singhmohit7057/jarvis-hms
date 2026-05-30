// #must: Patient history panel for consultation page — past visits, prescriptions, lab results
import { useState } from 'react';
import { ChevronDown, ChevronRight, Stethoscope, Pill, TestTube2 } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import type { Appointment, Prescription } from '@/types';

interface PatientHistoryProps {
  patientId: string;
}

interface VisitRecord {
  appointment: Appointment;
  prescription?: Prescription;
}

export function PatientHistory({ patientId }: PatientHistoryProps) {
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  // Fetch appointments with doctor info
  const { data: appointments, isLoading: loadingAppointments } = useSupabaseQuery<Appointment>(
    async () =>
      supabase
        .from('appointments')
        .select('*, doctor:doctors(name, specialization)')
        .eq('patient_id', patientId)
        .order('date', { ascending: false })
        .limit(20),
    [patientId]
  );

  // Fetch prescriptions for this patient
  const { data: prescriptions, isLoading: loadingPrescriptions } = useSupabaseQuery<Prescription>(
    async () =>
      supabase
        .from('prescriptions')
        .select('*, items:prescription_items(*), doctor:doctors(name)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
    [patientId]
  );

  // Fetch lab bookings for this patient
  const { data: labBookings, isLoading: loadingLabs } = useSupabaseQuery(
    async () =>
      supabase
        .from('lab_bookings')
        .select('*, tests:lab_booking_tests(test_name, price)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
    [patientId]
  );

  const isLoading = loadingAppointments || loadingPrescriptions || loadingLabs;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="No previous visits"
        description="This patient has no recorded consultations yet"
      />
    );
  }

  // Group prescriptions by appointment for easy lookup
  const prescriptionsByAppointment = new Map<string, Prescription>();
  prescriptions.forEach((rx) => {
    prescriptionsByAppointment.set(rx.appointmentId, rx);
  });

  const visits: VisitRecord[] = appointments.map((apt) => ({
    appointment: apt,
    prescription: prescriptionsByAppointment.get(apt.id),
  }));

  const toggleVisit = (id: string) => {
    setExpandedVisit((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Past Visits ({visits.length})
      </h3>

      {visits.map(({ appointment, prescription }) => {
        const isExpanded = expandedVisit === appointment.id;
        const doctorName = appointment.doctor?.name ?? 'Unknown Doctor';

        return (
          <div
            key={appointment.id}
            className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
          >
            {/* Visit header */}
            <button
              type="button"
              onClick={() => toggleVisit(appointment.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(appointment.date)}
                  </span>
                  <Badge variant="default" size="sm">
                    {appointment.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Dr. {doctorName}
                </p>
              </div>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-slate-700 pt-3">
                {/* Prescription details */}
                {prescription ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Pill className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Diagnosis
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 pl-5">
                      {prescription.diagnosis}
                    </p>

                    {prescription.items && prescription.items.length > 0 && (
                      <div className="pl-5">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Medicines:
                        </p>
                        <ul className="space-y-1">
                          {prescription.items.map((item) => (
                            <li
                              key={item.id}
                              className="text-xs text-gray-700 dark:text-gray-300"
                            >
                              {item.medicineName} - {item.dosage} ({item.frequency}, {item.duration})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic pl-5">
                    No prescription recorded for this visit
                  </p>
                )}

                {/* Lab tests associated with this visit date */}
                {labBookings.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TestTube2 className="h-3.5 w-3.5 text-purple-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Lab Tests
                      </span>
                    </div>
                    {labBookings
                      .filter(
                        (lb) =>
                          formatDate(lb.createdAt) === formatDate(appointment.date)
                      )
                      .map((lb) => (
                        <div key={lb.id} className="pl-5">
                          <p className={cn('text-xs text-gray-700 dark:text-gray-300')}>
                            {lb.tests?.map((t: { test_name: string }) => t.test_name).join(', ') || 'Tests booked'}
                            {' '}
                            <Badge variant={lb.status === 'completed' ? 'success' : 'warning'} size="sm">
                              {lb.status}
                            </Badge>
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
