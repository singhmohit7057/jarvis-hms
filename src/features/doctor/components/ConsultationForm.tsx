
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { PatientVitals } from './PatientVitals';
import { DiagnosisNotes } from './DiagnosisNotes';
import { PrescriptionEditor } from './PrescriptionEditor';
import { consultationSchema } from '../schemas/prescription.schema';
import { generatePrescriptionPDF } from '@/lib/pdf/prescription.pdf';
import type { ConsultationFormData } from '../schemas/prescription.schema';
import type { Doctor, Patient, Vitals } from '@/types';
import { useState } from 'react';

interface ConsultationFormProps {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  patient: Patient;
  doctor: Doctor;
  onSave: () => void;
}

export function ConsultationForm({
  appointmentId,
  patientId,
  doctorId,
  patient,
  doctor,
  onSave,
}: ConsultationFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      symptoms: '',
      diagnosis: '',
      notes: '',
      vitals: {
        bp: '',
        pulse: '',
        temperature: '',
        weight: '',
        height: '',
        spo2: '',
      },
      prescription: {
        diagnosis: '',
        advice: '',
        followupDate: '',
        items: [
          {
            medicineName: '',
            dosage: '',
            frequency: '',
            duration: '',
            timing: '',
            instructions: '',
          },
        ],
      },
    },
  });

  const saveConsultation = async (data: ConsultationFormData, generatePDF: boolean) => {
    setIsSaving(true);
    try {
      // Build vitals object matching DB schema
      const vitals: Vitals = {
        bp: data.vitals.bp ?? '',
        pulse: data.vitals.pulse ?? '',
        temp: data.vitals.temperature ?? '',
        weight: data.vitals.weight ?? '',
        height: data.vitals.height ?? '',
        spo2: data.vitals.spo2 ?? '',
      };

      // 1. Insert consultation
      const { data: consultation, error: consultError } = await supabase
        .from('consultations')
        .insert({
          appointment_id: appointmentId,
          patient_id: patientId,
          doctor_id: doctorId,
          vitals,
          symptoms: data.symptoms,
          diagnosis: data.diagnosis,
          notes: data.notes ?? null,
        })
        .select()
        .single();

      if (consultError) throw consultError;

      // 2. Insert prescription
      const { data: prescription, error: rxError } = await supabase
        .from('prescriptions')
        .insert({
          prescription_no: `RX-${Date.now()}`,
          appointment_id: appointmentId,
          consultation_id: consultation.id,
          patient_id: patientId,
          doctor_id: doctorId,
          diagnosis: data.prescription.diagnosis || data.diagnosis,
          advice: data.prescription.advice || null,
          followup_note: data.prescription.followupDate || null,
          followup_date: null,
        })
        .select()
        .single();

      if (rxError) throw rxError;

      // 3. Insert prescription items (only rows with a medicine name filled in)
      const items = (data.prescription.items ?? [])
        .filter((item) => item.medicineName?.trim())
        .map((item) => ({
          prescription_id: prescription.id,
          medicine_name: item.medicineName!.trim(),
          dosage: item.dosage?.trim() || '-',
          frequency: item.frequency?.trim() || '-',
          duration: item.duration?.trim() || '-',
          timing: item.timing || null,
          instructions: item.instructions || null,
        }));

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('prescription_items')
          .insert(items);
        if (itemsError) throw itemsError;
      }

      // 4. Update appointment status to completed
      const { error: aptError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (aptError) throw aptError;

      // 5. Generate PDF if requested
      if (generatePDF) {
        const pdfData = {
          id: prescription.id,
          prescriptionNo: prescription.prescription_no,
          appointmentId,
          consultationId: consultation.id,
          patientId,
          doctorId,
          diagnosis: data.prescription.diagnosis || data.diagnosis,
          advice: data.prescription.advice ?? '',
          followupDate: data.prescription.followupDate ?? '',
          symptoms: data.symptoms,
          clinicalNotes: data.notes,
          items: (data.prescription.items ?? []).filter((item) => item.medicineName?.trim()).map((item, idx) => ({
            id: `item-${idx}`,
            prescriptionId: prescription.id,
            medicineName: item.medicineName ?? '',
            dosage: item.dosage?.trim() || '-',
            frequency: item.frequency?.trim() || '-',
            duration: item.duration?.trim() || '-',
            timing: item.timing ?? '',
            instructions: item.instructions,
          })),
          patient,
          doctor,
          createdAt: new Date().toISOString(),
        };

        const pdf = generatePrescriptionPDF(pdfData, vitals);
        pdf.save(`Rx_${prescription.prescription_no}_${patient.name}.pdf`);
      }

      // Log activity (non-blocking — don't fail the save if this errors)
      supabase.from('activity_logs').insert({
        action: 'consultation_completed',
        entity_type: 'consultation',
        entity_id: consultation.id,
        description: `Consultation completed for ${patient.name} by Dr. ${doctor.name}`,
        user_name: doctor.name,
      }).then(({ error }) => { if (error) console.warn('Activity log failed:', error.message); });

      toast.success('Consultation saved successfully');
      setIsSaving(false);
      onSave();
    } catch (error) {
      console.error('Save consultation error:', error);
      const message = error instanceof Error ? error.message
        : (error as { message?: string })?.message ?? 'Failed to save consultation';
      toast.error(message);
      setIsSaving(false);
    }
  };

  return (
    <form className="space-y-6">
      {/* Vitals Section */}
      <Card>
        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Vitals
          </h3>
        </div>
        <div className="p-4">
          <PatientVitals mode="edit" control={control} />
        </div>
      </Card>

      {/* Diagnosis Section */}
      <Card>
        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Consultation
          </h3>
        </div>
        <div className="p-4">
          <DiagnosisNotes control={control} />
        </div>
      </Card>

      {/* Prescription Section */}
      <Card>
        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
          <Controller
            control={control}
            name="prescription.diagnosis"
            render={({ field, fieldState: { error } }) => (
              <Input
                label="Prescription Diagnosis (shown on Rx)"
                placeholder="Same as above or specific for Rx"
                error={error?.message}
                {...field}
              />
            )}
          />
        </div>
        <div className="p-4">
          <PrescriptionEditor control={control} errors={errors} />
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 space-y-4">
          <Controller
            control={control}
            name="prescription.advice"
            render={({ field }) => (
              <Textarea
                label="Advice"
                placeholder="e.g. Rest for 3 days, drink plenty of fluids..."
                rows={2}
                {...field}
                value={field.value ?? ''}
              />
            )}
          />
          <Controller
            control={control}
            name="prescription.followupDate"
            render={({ field }) => (
              <Input
                label="Follow-up Date"
                type="text"
                placeholder="e.g. After 5 days"
                {...field}
                value={field.value ?? ''}
              />
            )}
          />
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <Button
          type="button"
          variant="primary"
          disabled={isSaving}
          onClick={handleSubmit((data) => saveConsultation(data, false))}
          className="flex-1 sm:flex-none"
        >
          {isSaving ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Consultation
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={handleSubmit((data) => saveConsultation(data, true))}
          className="flex-1 sm:flex-none"
        >
          <FileText className="h-4 w-4 mr-2" />
          Save & Generate PDF
        </Button>
      </div>
    </form>
  );
}
