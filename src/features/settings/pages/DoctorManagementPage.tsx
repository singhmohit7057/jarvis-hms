// #must: Doctor management page — CRUD for clinic doctors
import { useState, useMemo, useCallback } from 'react';
import { Stethoscope, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useActivityLog } from '@/hooks/useActivityLog';
import { DoctorForm } from '../components/DoctorForm';
import type { Doctor } from '@/types';
import type { DoctorSchemaType } from '../schemas/doctor.schema';

interface DoctorRow {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  registration_no: string;
  phone: string;
  email?: string;
  consultation_fee: number;
  available_days: string[] | null;
  available_time_start: string;
  available_time_end: string;
  is_active: boolean;
  created_at: string;
}

function mapRowToDoctor(row: DoctorRow): Doctor {
  return {
    id: row.id,
    name: row.name,
    specialization: row.specialization,
    qualification: row.qualification,
    registrationNo: row.registration_no,
    phone: row.phone,
    email: row.email,
    consultationFee: row.consultation_fee,
    availableDays: row.available_days ?? [],
    availableTimeStart: row.available_time_start,
    availableTimeEnd: row.available_time_end,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function DoctorCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-4 w-44" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
    </div>
  );
}

interface DoctorCardProps {
  doctor: Doctor;
  onEdit: (doctor: Doctor) => void;
  onToggleActive: (doctor: Doctor) => void;
}

function DoctorCard({ doctor, onEdit, onToggleActive }: DoctorCardProps) {
  const timeRange =
    doctor.availableTimeStart && doctor.availableTimeEnd
      ? `${doctor.availableTimeStart} – ${doctor.availableTimeEnd}`
      : null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{doctor.name}</h3>
          <div className="mt-1">
            <Badge variant="info">{doctor.specialization}</Badge>
          </div>
        </div>
        <Badge variant={doctor.isActive ? 'success' : 'danger'}>
          {doctor.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
        <p>
          <span className="font-medium text-gray-700 dark:text-gray-300">Qualification:</span>{' '}
          {doctor.qualification}
        </p>
        {doctor.registrationNo && (
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">Reg. No:</span>{' '}
            {doctor.registrationNo}
          </p>
        )}
        <p>
          <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span>{' '}
          {doctor.phone}
        </p>
        {doctor.email && (
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>{' '}
            {doctor.email}
          </p>
        )}
        <p>
          <span className="font-medium text-gray-700 dark:text-gray-300">Fee:</span>{' '}
          ₹{doctor.consultationFee}
        </p>
        {doctor.availableDays.length > 0 && (
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">Days:</span>{' '}
            {doctor.availableDays.join(', ')}
          </p>
        )}
        {timeRange && (
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">Time:</span>{' '}
            {timeRange}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={() => onEdit(doctor)}>
          Edit
        </Button>
        <Button
          variant={doctor.isActive ? 'danger' : 'success'}
          size="sm"
          onClick={() => onToggleActive(doctor)}
        >
          {doctor.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </div>
  );
}

export function DoctorManagementPage() {
  const { logActivity } = useActivityLog();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: rows, isLoading, refetch } = useSupabaseQuery<DoctorRow>(
    async () =>
      supabase
        .from('doctors')
        .select('*')
        .order('name'),
    []
  );

  const doctors: Doctor[] = useMemo(() => rows.map(mapRowToDoctor), [rows]);

  const handleAdd = useCallback(
    async (data: DoctorSchemaType) => {
      setIsSubmitting(true);
      try {
        const { error } = await supabase.from('doctors').insert({
          name: data.name,
          specialization: data.specialization,
          qualification: data.qualification,
          registration_no: data.registration_no ?? null,
          phone: data.phone,
          email: data.email || null,
          consultation_fee: data.consultation_fee,
          available_days: data.available_days ?? [],
          available_time_start: data.available_time_start || null,
          available_time_end: data.available_time_end || null,
          is_active: data.is_active ?? true,
        });

        if (error) throw new Error(error.message);

        toast.success('Doctor added successfully');
        setIsAddOpen(false);
        refetch();

        void logActivity({
          action: 'create',
          entityType: 'doctor',
          description: `Added new doctor: ${data.name}`,
          metadata: { specialization: data.specialization },
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to add doctor');
      } finally {
        setIsSubmitting(false);
      }
    },
    [logActivity, refetch]
  );

  const handleUpdate = useCallback(
    async (data: DoctorSchemaType) => {
      if (!editingDoctor) return;
      setIsSubmitting(true);
      try {
        const { error } = await supabase
          .from('doctors')
          .update({
            name: data.name,
            specialization: data.specialization,
            qualification: data.qualification,
            registration_no: data.registration_no ?? null,
            phone: data.phone,
            email: data.email || null,
            consultation_fee: data.consultation_fee,
            available_days: data.available_days ?? [],
            available_time_start: data.available_time_start || null,
            available_time_end: data.available_time_end || null,
            is_active: data.is_active ?? editingDoctor.isActive,
          })
          .eq('id', editingDoctor.id);

        if (error) throw new Error(error.message);

        toast.success('Doctor updated successfully');
        setEditingDoctor(null);
        refetch();

        void logActivity({
          action: 'update',
          entityType: 'doctor',
          entityId: editingDoctor.id,
          description: `Updated doctor: ${data.name}`,
          metadata: { specialization: data.specialization },
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update doctor');
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingDoctor, logActivity, refetch]
  );

  const handleToggleActive = useCallback(
    async (doctor: Doctor) => {
      const newStatus = !doctor.isActive;
      const { error } = await supabase
        .from('doctors')
        .update({ is_active: newStatus })
        .eq('id', doctor.id);

      if (error) {
        toast.error('Failed to update status: ' + error.message);
        return;
      }

      void logActivity({
        action: 'update',
        entityType: 'doctor',
        entityId: doctor.id,
        description: `${newStatus ? 'Activated' : 'Deactivated'} doctor ${doctor.name}`,
      });

      toast.success(`${doctor.name} ${newStatus ? 'activated' : 'deactivated'}`);
      refetch();
    },
    [logActivity, refetch]
  );

  const editDefaultValues = useMemo((): DoctorSchemaType | undefined => {
    if (!editingDoctor) return undefined;
    return {
      name: editingDoctor.name,
      specialization: editingDoctor.specialization,
      qualification: editingDoctor.qualification,
      registration_no: editingDoctor.registrationNo ?? '',
      phone: editingDoctor.phone,
      email: editingDoctor.email ?? '',
      consultation_fee: editingDoctor.consultationFee,
      available_days: editingDoctor.availableDays,
      available_time_start: editingDoctor.availableTimeStart ?? '',
      available_time_end: editingDoctor.availableTimeEnd ?? '',
      is_active: editingDoctor.isActive,
    };
  }, [editingDoctor]);

  return (
    <div>
      <PageHeader
        title="Doctors"
        subtitle="Manage clinic doctors and their schedules"
        actions={
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Doctor
          </Button>
        }
      />

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <DoctorCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && doctors.length === 0 && (
        <EmptyState
          icon={Stethoscope}
          title="No doctors added yet"
          description="Add your first doctor to start booking appointments"
          action={
            <Button onClick={() => setIsAddOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Doctor
            </Button>
          }
        />
      )}

      {/* Doctor card grid */}
      {!isLoading && doctors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onEdit={setEditingDoctor}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Doctor"
        size="xl"
      >
        <DoctorForm
          onSubmit={handleAdd}
          isLoading={isSubmitting}
          onClose={() => setIsAddOpen(false)}
        />
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        isOpen={editingDoctor !== null}
        onClose={() => setEditingDoctor(null)}
        title="Edit Doctor"
        size="xl"
      >
        {editingDoctor && (
          <DoctorForm
            onSubmit={handleUpdate}
            isLoading={isSubmitting}
            onClose={() => setEditingDoctor(null)}
            defaultValues={editDefaultValues}
          />
        )}
      </Modal>
    </div>
  );
}
