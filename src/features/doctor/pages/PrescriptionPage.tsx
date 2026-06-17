
import { useState, useEffect, useCallback, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Eye, Download, Printer, FileText } from 'lucide-react'; // Download kept for modal
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/data/DataTable';
import { DatePickerField } from '@/components/forms/DatePickerField';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/formatters';
import { generatePrescriptionPDF } from '@/lib/pdf/prescription.pdf';
import { generateReceiptPDF, fetchReceiptClinic } from '@/lib/pdf/receipt.pdf';
import type { Prescription, PrescriptionItem, Patient, Doctor, Vitals } from '@/types';

interface PrescriptionRow extends Prescription {
  patient: Patient;
  doctor: Doctor;
  items: PrescriptionItem[];
}

export function PrescriptionPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRx, setSelectedRx] = useState<PrescriptionRow | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | null>(null);

  const fetchPrescriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('prescriptions')
        .select('*, patient:patients(*), doctor:doctors(*), items:prescription_items(*)')
        .order('created_at', { ascending: false });

      if (filterDate) {
        const dateStr = filterDate.toISOString().split('T')[0];
        query = query.gte('created_at', `${dateStr}T00:00:00`)
          .lte('created_at', `${dateStr}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: PrescriptionRow[] = (data ?? []).map((row) => ({
        id: row.id,
        prescriptionNo: row.prescription_no,
        appointmentId: row.appointment_id,
        consultationId: row.consultation_id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        diagnosis: row.diagnosis,
        advice: row.advice ?? '',
        followupDate: row.followup_note ?? row.followup_date ?? undefined,
        createdAt: row.created_at,
        patient: {
          id: row.patient.id,
          patientId: row.patient.patient_id,
          name: row.patient.name,
          age: row.patient.age,
          gender: row.patient.gender,
          phone: row.patient.phone,
          email: row.patient.email ?? undefined,
          address: row.patient.address,
          bloodGroup: row.patient.blood_group ?? undefined,
          allergies: row.patient.allergies ?? undefined,
          medicalHistory: row.patient.medical_history ?? undefined,
          emergencyContactName: row.patient.emergency_contact_name ?? undefined,
          emergencyContactPhone: row.patient.emergency_contact_phone ?? undefined,
          createdAt: row.patient.created_at,
        },
        doctor: {
          id: row.doctor.id,
          name: row.doctor.name,
          specialization: row.doctor.specialization,
          qualification: row.doctor.qualification,
          registrationNo: row.doctor.registration_no,
          phone: row.doctor.phone,
          email: row.doctor.email ?? undefined,
          consultationFee: row.doctor.consultation_fee,
          availableDays: row.doctor.available_days ?? [],
          availableTimeStart: row.doctor.available_time_start,
          availableTimeEnd: row.doctor.available_time_end,
          isActive: row.doctor.is_active,
          createdAt: row.doctor.created_at,
        },
        items: (row.items ?? []).map((item: Record<string, unknown>) => ({
          id: item.id as string,
          prescriptionId: item.prescription_id as string,
          medicineName: item.medicine_name as string,
          dosage: item.dosage as string,
          frequency: item.frequency as string,
          duration: item.duration as string,
          timing: (item.timing as string) ?? '',
          instructions: (item.instructions as string) ?? undefined,
        })),
      }));

      setPrescriptions(mapped);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setIsLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleView = (rx: PrescriptionRow) => {
    setSelectedRx(rx);
    setShowViewModal(true);
  };

  const fetchConsultationData = async (consultationId?: string) => {
    if (!consultationId) return { vitals: undefined, symptoms: undefined, clinicalNotes: undefined };
    const { data } = await supabase
      .from('consultations')
      .select('vitals, symptoms, notes')
      .eq('id', consultationId)
      .single();
    return {
      vitals: data?.vitals as Vitals | undefined,
      symptoms: (data?.symptoms as string) || undefined,
      clinicalNotes: (data?.notes as string) || undefined,
    };
  };

  const handleDownloadPDF = async (rx: PrescriptionRow) => {
    try {
      const { vitals, symptoms, clinicalNotes } = await fetchConsultationData(rx.consultationId);
      const pdf = generatePrescriptionPDF({ ...rx, symptoms, clinicalNotes }, vitals);
      pdf.save(`Rx_${rx.prescriptionNo}_${rx.patient.name}.pdf`);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const handlePrint = async (rx: PrescriptionRow) => {
    try {
      const { vitals, symptoms, clinicalNotes } = await fetchConsultationData(rx.consultationId);
      const pdf = generatePrescriptionPDF({ ...rx, symptoms, clinicalNotes }, vitals);
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } catch {
      toast.error('Failed to print prescription');
    }
  };

  const handlePrintReceipt = async (rx: PrescriptionRow) => {
    try {
      const clinic = await fetchReceiptClinic();
      const pdf = generateReceiptPDF({
        receiptNo: `RCT-${rx.prescriptionNo}`,
        date: rx.createdAt,
        patientName: rx.patient.name,
        patientPhone: rx.patient.phone,
        serviceType: 'Consultation',
        serviceDetails: rx.diagnosis ?? 'General Consultation',
        amount: rx.doctor.consultationFee ?? 0,
        paymentMethod: 'Cash',
        receivedBy: rx.doctor.name,
      }, clinic);
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } catch {
      toast.error('Failed to generate receipt');
    }
  };

  const columns = useMemo<ColumnDef<PrescriptionRow, unknown>[]>(
    () => [
      {
        accessorKey: 'prescriptionNo',
        header: 'Rx #',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorFn: (row) => row.patient.name,
        id: 'patientName',
        header: 'Patient',
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorFn: (row) => row.doctor.name,
        id: 'doctorName',
        header: 'Doctor',
        cell: ({ getValue }) => (
          <span className="text-gray-700 dark:text-gray-300">
            Dr. {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'diagnosis',
        header: 'Diagnosis',
        cell: ({ getValue }) => (
          <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px] block">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ getValue }) => formatDate(getValue() as string),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const rx = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleView(rx); }}
                className="flex items-center gap-1.5"
              >
                <Eye className="h-4 w-4" />
                <span className="text-xs">View</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handlePrintReceipt(rx); }}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
              >
                <Printer className="h-4 w-4" />
                <span className="text-xs">Receipt</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleDownloadPDF(rx); }}
                className="flex items-center gap-1.5 text-green-600 hover:text-green-700"
              >
                <FileText className="h-4 w-4" />
                <span className="text-xs">Prescription</span>
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        subtitle="View and manage patient prescriptions"
      />

      {/* Filters */}
      <Card className="mb-5">
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="w-full sm:w-48">
            <DatePickerField
              label="Filter by Date"
              selected={filterDate}
              onChange={setFilterDate}
              placeholder="All dates"
            />
          </div>
          {filterDate && (
            <Button variant="ghost" size="sm" onClick={() => setFilterDate(null)}>
              Clear Filter
            </Button>
          )}
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={prescriptions}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search by patient name, Rx number, diagnosis..."
        pagination
        pageSize={10}
        emptyMessage="No prescriptions found"
      />

      {/* View Prescription Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`Prescription ${selectedRx?.prescriptionNo ?? ''}`}
        size="lg"
      >
        {selectedRx && (
          <div className="space-y-4 p-1">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Patient</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedRx.patient.name} ({selectedRx.patient.age} yrs / {selectedRx.patient.gender})
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Doctor</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Dr. {selectedRx.doctor.name}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Diagnosis</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedRx.diagnosis}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Date</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(selectedRx.createdAt)}
                </p>
              </div>
            </div>

            {/* Medicines Table */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Medicines
              </h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Medicine</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Dosage</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Frequency</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Duration</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Timing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {selectedRx.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                          {item.medicineName}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.dosage}</td>
                        <td className="px-3 py-2">
                          <Badge variant="info" size="sm">{item.frequency}</Badge>
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.duration}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.timing || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Advice & Follow-up */}
            {selectedRx.advice && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Advice
                </span>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                  {selectedRx.advice}
                </p>
              </div>
            )}

            {selectedRx.followupDate && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Follow-up
                </span>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                  {selectedRx.followupDate}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPDF(selectedRx)}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrint(selectedRx)}
              >
                <Printer className="h-4 w-4 mr-1.5" />
                Print
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
