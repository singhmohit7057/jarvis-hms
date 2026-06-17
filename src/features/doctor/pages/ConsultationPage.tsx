
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/data/StatusBadge';
import { PatientVitals } from '../components/PatientVitals';
import { ConsultationForm } from '../components/ConsultationForm';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/formatters';
import { ROUTES } from '@/config/routes';
import {
  ArrowLeft,
  User,
  Phone,
  Droplets,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  Stethoscope,
  Activity,
  Eye,
} from 'lucide-react';
import { generatePrescriptionPDF } from '@/lib/pdf/prescription.pdf';
import type { Appointment, Patient, Doctor, Consultation, Vitals, PrescriptionItem } from '@/types';

interface PastAppointment {
  id: string;
  date: string;
  diagnosis?: string;
  status: string;
}

interface PastPrescription {
  id: string;
  prescriptionNo: string;
  diagnosis: string;
  date: string;
  consultationId?: string;
  advice?: string;
  followupNote?: string;
  items: PrescriptionItem[];
}

interface PastVitals {
  date: string;
  diagnosis: string;
  vitals: Vitals;
}

export function ConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [existingConsultation, setExistingConsultation] = useState<Consultation | null>(null);
  const [existingVitals, setExistingVitals] = useState<Vitals | null>(null);
  const [pastAppointments, setPastAppointments] = useState<PastAppointment[]>([]);
  const [pastPrescriptions, setPastPrescriptions] = useState<PastPrescription[]>([]);
  const [pastVitalsList, setPastVitalsList] = useState<PastVitals[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [showVitals, setShowVitals] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      // Fetch appointment with patient and doctor
      const { data: aptData, error: aptError } = await supabase
        .from('appointments')
        .select('*, patient:patients(*), doctor:doctors(*)')
        .eq('id', id)
        .single();

      if (aptError) throw aptError;

      const apt: Appointment = {
        id: aptData.id,
        appointmentNo: aptData.appointment_no,
        patientId: aptData.patient_id,
        doctorId: aptData.doctor_id,
        date: aptData.date,
        time: aptData.time,
        fee: aptData.fee,
        paymentStatus: aptData.payment_status,
        status: aptData.status,
        createdAt: aptData.created_at,
      };
      setAppointment(apt);

      if (aptData.patient) {
        const p: Patient = {
          id: aptData.patient.id,
          patientId: aptData.patient.patient_id,
          name: aptData.patient.name,
          age: aptData.patient.age,
          gender: aptData.patient.gender,
          phone: aptData.patient.phone,
          email: aptData.patient.email ?? undefined,
          address: aptData.patient.address,
          bloodGroup: aptData.patient.blood_group ?? undefined,
          allergies: aptData.patient.allergies ?? undefined,
          medicalHistory: aptData.patient.medical_history ?? undefined,
          emergencyContactName: aptData.patient.emergency_contact_name ?? undefined,
          emergencyContactPhone: aptData.patient.emergency_contact_phone ?? undefined,
          createdAt: aptData.patient.created_at,
        };
        setPatient(p);

        // Fetch past appointments for this patient (excluding current)
        const { data: pastApts } = await supabase
          .from('appointments')
          .select('id, date, status')
          .eq('patient_id', p.id)
          .neq('id', id)
          .order('date', { ascending: false })
          .limit(10);

        if (pastApts) {
          // Fetch diagnoses from consultations for these appointments
          const aptIds = pastApts.map((a) => a.id);
          const { data: consultations } = await supabase
            .from('consultations')
            .select('appointment_id, diagnosis')
            .in('appointment_id', aptIds.length > 0 ? aptIds : ['__none__']);

          const diagMap = new Map(
            (consultations ?? []).map((c) => [c.appointment_id, c.diagnosis])
          );

          setPastAppointments(
            pastApts.map((a) => ({
              id: a.id,
              date: a.date,
              diagnosis: diagMap.get(a.id),
              status: a.status,
            }))
          );
        }

        // Fetch past prescriptions with items
        const { data: pastRx } = await supabase
          .from('prescriptions')
          .select('id, prescription_no, diagnosis, advice, followup_note, created_at, consultation_id, items:prescription_items(*)')
          .eq('patient_id', p.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (pastRx) {
          setPastPrescriptions(
            pastRx.map((rx) => ({
              id: rx.id,
              prescriptionNo: rx.prescription_no,
              diagnosis: rx.diagnosis,
              advice: rx.advice ?? undefined,
              followupNote: rx.followup_note ?? undefined,
              date: rx.created_at,
              consultationId: rx.consultation_id ?? undefined,
              items: ((rx.items ?? []) as Record<string, unknown>[]).map((item) => ({
                id: item.id as string,
                prescriptionId: item.prescription_id as string,
                medicineName: item.medicine_name as string,
                dosage: item.dosage as string,
                frequency: item.frequency as string,
                duration: item.duration as string,
                timing: (item.timing as string) ?? '',
                instructions: (item.instructions as string) ?? undefined,
              })),
            }))
          );
        }

        // Fetch past vitals from consultations (exclude current appointment)
        const { data: pastConsults } = await supabase
          .from('consultations')
          .select('created_at, diagnosis, vitals, appointment_id')
          .eq('patient_id', p.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (pastConsults) {
          // deduplicate by appointment_id — keep only the latest per visit
          const seen = new Set<string>();
          setPastVitalsList(
            pastConsults
              .filter((c) => c.appointment_id !== id)
              .filter((c) => {
                if (seen.has(c.appointment_id)) return false;
                seen.add(c.appointment_id);
                return true;
              })
              .filter((c) => c.vitals && Object.values(c.vitals as Record<string, string>).some(Boolean))
              .map((c) => ({
                date: c.created_at,
                diagnosis: c.diagnosis || '-',
                vitals: c.vitals as Vitals,
              }))
          );
        }
      }

      if (aptData.doctor) {
        const d: Doctor = {
          id: aptData.doctor.id,
          name: aptData.doctor.name,
          specialization: aptData.doctor.specialization,
          qualification: aptData.doctor.qualification,
          registrationNo: aptData.doctor.registration_no,
          phone: aptData.doctor.phone,
          email: aptData.doctor.email ?? undefined,
          consultationFee: aptData.doctor.consultation_fee,
          availableDays: aptData.doctor.available_days ?? [],
          availableTimeStart: aptData.doctor.available_time_start,
          availableTimeEnd: aptData.doctor.available_time_end,
          isActive: aptData.doctor.is_active,
          createdAt: aptData.doctor.created_at,
        };
        setDoctor(d);
      }

      // Check if consultation already exists
      const { data: existingC } = await supabase
        .from('consultations')
        .select('*')
        .eq('appointment_id', id)
        .maybeSingle();

      if (existingC) {
        setExistingConsultation({
          id: existingC.id,
          appointmentId: existingC.appointment_id,
          patientId: existingC.patient_id,
          doctorId: existingC.doctor_id,
          vitals: existingC.vitals,
          symptoms: existingC.symptoms,
          diagnosis: existingC.diagnosis,
          notes: existingC.notes ?? '',
          createdAt: existingC.created_at,
        });
        setExistingVitals(existingC.vitals);
      }
    } catch (error) {
      console.error('Failed to load consultation data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConsultationSaved = () => {
    navigate(ROUTES.APPOINTMENTS);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!appointment || !patient || !doctor) {
    return (
      <div className="p-6">
        <Alert variant="error">
          Appointment not found or data is incomplete. Please try again.
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate(ROUTES.APPOINTMENTS)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Appointments
        </Button>
      </div>
    );
  }

  const isCompleted = appointment.status === 'completed' || (appointment.status === 'in_progress' && !!existingConsultation);

  return (
    <div>
      <PageHeader
        title={`Consultation`}
        subtitle={`${patient.name} — ${formatDate(appointment.date)}`}
        breadcrumbs={[
          { label: 'Appointments', path: ROUTES.APPOINTMENTS },
          { label: `#${appointment.appointmentNo}` },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate(ROUTES.APPOINTMENTS)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Info & History */}
        <div className="lg:col-span-4 space-y-4">
          {/* Patient Info Card */}
          <Card>
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Patient Information
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {patient.name}
                </span>
                <Badge variant="info" size="sm">
                  {patient.patientId}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Age/Gender</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {patient.age} yrs / {patient.gender}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Phone</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {patient.phone}
                  </p>
                </div>
              </div>

              {patient.bloodGroup && (
                <div className="flex items-center gap-2 text-sm">
                  <Droplets className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-gray-500 dark:text-gray-400">Blood Group:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {patient.bloodGroup}
                  </span>
                </div>
              )}

              {patient.allergies && (
                <div className="flex items-start gap-2 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-800/30">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-red-700 dark:text-red-400 font-medium">Allergies:</span>
                    <p className="text-red-600 dark:text-red-300">{patient.allergies}</p>
                  </div>
                </div>
              )}

              {patient.medicalHistory && (
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Medical History</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-0.5">
                    {patient.medicalHistory}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Past Appointments */}
          <Card>
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors rounded-t-lg"
              onClick={() => setShowHistory(!showHistory)}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Visit History ({pastAppointments.length})
                </h3>
              </div>
              {showHistory ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {showHistory && (
              <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
                {pastAppointments.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    No past visits found
                  </p>
                ) : (
                  pastAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-slate-700/30 text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {formatDate(apt.date)}
                        </p>
                        {apt.diagnosis && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                            {apt.diagnosis}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={apt.status} type="appointment" />
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>

          {/* Past Vitals */}
          <Card>
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors rounded-t-lg"
              onClick={() => setShowVitals(!showVitals)}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Past Vitals ({pastVitalsList.length})
                </h3>
              </div>
              {showVitals ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            </button>
            {showVitals && (
              <div className="px-4 pb-4 space-y-2 max-h-72 overflow-y-auto">
                {pastVitalsList.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No past vitals found</p>
                ) : (
                  pastVitalsList.map((pv, i) => (
                    <div key={i} className="rounded-md border border-gray-100 dark:border-slate-700 text-sm overflow-hidden">
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 dark:bg-slate-700/40">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(pv.date)}</span>
                        <span className="text-xs text-gray-500 truncate max-w-[120px]">{pv.diagnosis}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-px bg-gray-100 dark:bg-slate-700">
                        {[
                          ['BP', pv.vitals.bp],
                          ['Pulse', pv.vitals.pulse],
                          ['Temp', pv.vitals.temp ? `${pv.vitals.temp}°F` : ''],
                          ['Weight', pv.vitals.weight ? `${pv.vitals.weight}kg` : ''],
                          ['Height', pv.vitals.height ? `${pv.vitals.height}cm` : ''],
                          ['SpO2', pv.vitals.spo2 ? `${pv.vitals.spo2}%` : ''],
                        ].filter(([, v]) => v).map(([label, value]) => (
                          <div key={label} className="bg-white dark:bg-slate-800 px-2 py-1.5 text-center">
                            <p className="text-[10px] text-gray-400 uppercase">{label}</p>
                            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>

          {/* Past Prescriptions */}
          <Card>
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors rounded-t-lg"
              onClick={() => setShowPrescriptions(!showPrescriptions)}
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Past Prescriptions ({pastPrescriptions.length})
                </h3>
              </div>
              {showPrescriptions ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {showPrescriptions && (
              <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
                {pastPrescriptions.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    No past prescriptions found
                  </p>
                ) : (
                  pastPrescriptions.map((rx) => (
                    <div key={rx.id} className="rounded-md border border-gray-100 dark:border-slate-700 text-sm overflow-hidden">
                      <div className="flex items-center justify-between px-2.5 py-2 bg-gray-50 dark:bg-slate-700/40">
                        <div>
                          <span className="font-mono text-xs text-gray-500">{rx.prescriptionNo}</span>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{rx.diagnosis}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">{formatDate(rx.date)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-blue-600 hover:text-blue-700"
                            onClick={async () => {
                              if (!patient || !doctor) return;
                              let vitals: Vitals | undefined;
                              let symptoms: string | undefined;
                              let clinicalNotes: string | undefined;
                              if (rx.consultationId) {
                                const { data } = await supabase
                                  .from('consultations')
                                  .select('vitals, symptoms, notes')
                                  .eq('id', rx.consultationId)
                                  .single();
                                if (data?.vitals) vitals = data.vitals as Vitals;
                                if (data?.symptoms) symptoms = data.symptoms as string;
                                if (data?.notes) clinicalNotes = data.notes as string;
                              }
                              const pdf = generatePrescriptionPDF({
                                id: rx.id,
                                prescriptionNo: rx.prescriptionNo,
                                patientId: patient.id,
                                doctorId: doctor.id,
                                appointmentId: '',
                                consultationId: rx.consultationId ?? '',
                                diagnosis: rx.diagnosis,
                                advice: rx.advice ?? '',
                                followupDate: rx.followupNote,
                                items: rx.items,
                                patient,
                                doctor,
                                createdAt: rx.date,
                                symptoms,
                                clinicalNotes,
                              }, vitals);
                              window.open(pdf.output('bloburl'), '_blank');
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {rx.items.length > 0 && (
                        <div className="px-2.5 py-1.5 space-y-0.5">
                          {rx.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium text-gray-800 dark:text-gray-200">{item.medicineName}</span>
                              <span className="text-gray-400">·</span>
                              <span>{item.frequency}</span>
                              <span className="text-gray-400">·</span>
                              <span>{item.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Consultation Form or Summary */}
        <div className="lg:col-span-8">
          {isCompleted && existingConsultation ? (
            <div className="space-y-4">
              <Alert variant="info">
                This consultation has been completed on {formatDate(existingConsultation.createdAt)}.
              </Alert>

              {/* Completed Vitals */}
              {existingVitals && (
                <Card>
                  <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Recorded Vitals
                    </h3>
                  </div>
                  <div className="p-4">
                    <PatientVitals mode="view" vitals={existingVitals} />
                  </div>
                </Card>
              )}

              {/* Consultation Summary */}
              <Card>
                <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Consultation Summary
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Symptoms
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                      {existingConsultation.symptoms}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Diagnosis
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                      {existingConsultation.diagnosis}
                    </p>
                  </div>
                  {existingConsultation.notes && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Notes
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                        {existingConsultation.notes}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <ConsultationForm
              appointmentId={appointment.id}
              patientId={patient.id}
              doctorId={doctor.id}
              patient={patient}
              doctor={doctor}
              onSave={handleConsultationSaved}
            />
          )}
        </div>
      </div>

    </div>
  );
}
