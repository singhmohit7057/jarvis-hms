// #must: Patient list page — registration modal, search, DataTable with navigation to detail
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/config/routes';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useToast } from '@/hooks/useToast';
import { useActivityLog } from '@/hooks/useActivityLog';
import { PatientForm } from '../components/PatientForm';
import { getPatientColumns } from '../components/PatientTable';
import type { Patient } from '@/types';
import type { PatientSchemaType } from '../schemas/patient.schema';

export function PatientListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { logActivity } = useActivityLog();

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch patients
  const { data: patients, isLoading, error, refetch } = useSupabaseQuery<Record<string, unknown>>(
    async () =>
      supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false }),
    []
  );

  // Map DB snake_case to camelCase for our Patient type
  const mappedPatients: Patient[] = useMemo(
    () =>
      patients.map((p) => ({
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
      })),
    [patients]
  );

  // Handle row click — navigate to detail
  const handleRowClick = useCallback(
    (patient: Patient) => {
      navigate(ROUTES.PATIENT_DETAIL.replace(':id', patient.id));
    },
    [navigate]
  );

  // Handle view action
  const handleView = useCallback(
    (patient: Patient) => {
      navigate(ROUTES.PATIENT_DETAIL.replace(':id', patient.id));
    },
    [navigate]
  );

  // Handle edit action
  const handleEdit = useCallback((patient: Patient) => {
    setEditingPatient(patient);
    setIsEditOpen(true);
  }, []);

  // Register new patient
  const handleRegister = async (data: PatientSchemaType) => {
    setIsSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('patients').insert({
        name: data.name,
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        blood_group: data.bloodGroup || null,
        allergies: data.allergies || null,
        medical_history: data.medicalHistory || null,
        emergency_contact_name: data.emergencyContactName || null,
        emergency_contact_phone: data.emergencyContactPhone || null,
      });

      if (insertError) throw new Error(insertError.message);

      toast.success('Patient registered successfully');
      setIsRegisterOpen(false);
      refetch();

      logActivity({
        action: 'CREATE',
        entityType: 'patient',
        description: `Registered new patient: ${data.name}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update existing patient
  const handleUpdate = async (data: PatientSchemaType) => {
    if (!editingPatient) return;
    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          name: data.name,
          age: data.age,
          gender: data.gender,
          phone: data.phone,
          email: data.email || null,
          address: data.address || null,
          blood_group: data.bloodGroup || null,
          allergies: data.allergies || null,
          medical_history: data.medicalHistory || null,
          emergency_contact_name: data.emergencyContactName || null,
          emergency_contact_phone: data.emergencyContactPhone || null,
        })
        .eq('id', editingPatient.id);

      if (updateError) throw new Error(updateError.message);

      toast.success('Patient updated successfully');
      setIsEditOpen(false);
      setEditingPatient(null);
      refetch();

      logActivity({
        action: 'UPDATE',
        entityType: 'patient',
        entityId: editingPatient.id,
        description: `Updated patient: ${data.name}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table columns
  const columns = useMemo(
    () => getPatientColumns({ onView: handleView, onEdit: handleEdit }),
    [handleView, handleEdit]
  );

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="Manage patient registrations and records"
        actions={
          <Button onClick={() => setIsRegisterOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Register Patient
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <DataTable
        columns={columns}
        data={mappedPatients}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search by name, phone, or patient ID..."
        onRowClick={handleRowClick}
        emptyMessage="No patients found"
        pagination
        pageSize={10}
      />

      {/* Register Patient Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register New Patient"
        size="xl"
      >
        <PatientForm
          onSubmit={handleRegister}
          isLoading={isSubmitting}
          onClose={() => setIsRegisterOpen(false)}
        />
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingPatient(null);
        }}
        title="Edit Patient"
        size="xl"
      >
        {editingPatient && (
          <PatientForm
            onSubmit={handleUpdate}
            isLoading={isSubmitting}
            onClose={() => {
              setIsEditOpen(false);
              setEditingPatient(null);
            }}
            defaultValues={{
              name: editingPatient.name,
              age: editingPatient.age,
              gender: editingPatient.gender as PatientSchemaType['gender'],
              phone: editingPatient.phone,
              email: editingPatient.email ?? '',
              address: editingPatient.address ?? '',
              bloodGroup: (editingPatient.bloodGroup ?? '') as PatientSchemaType['bloodGroup'],
              allergies: editingPatient.allergies ?? '',
              medicalHistory: editingPatient.medicalHistory ?? '',
            }}
          />
        )}
      </Modal>
    </div>
  );
}
