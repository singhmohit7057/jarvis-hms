// #must: Custom hook for appointment CRUD operations with Supabase
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Appointment, AppointmentStatus } from '@/types';
import type { AppointmentFormData } from '../schemas/appointment.schema';

interface AppointmentFilters {
  date?: string;
  doctorId?: string;
  status?: AppointmentStatus;
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAppointments = useCallback(async (filters?: AppointmentFilters) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select('*, patient:patients(*), doctor:doctors(*)')
        .order('date', { ascending: false })
        .order('time', { ascending: true });

      if (filters?.date) {
        query = query.eq('date', filters.date);
      }
      if (filters?.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped: Appointment[] = (data ?? []).map((row) => ({
        id: row.id,
        appointmentNo: row.appointment_no,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        patient: row.patient
          ? {
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
            }
          : undefined,
        doctor: row.doctor
          ? {
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
            }
          : undefined,
        date: row.date,
        time: row.time,
        fee: row.fee,
        paymentStatus: row.payment_status,
        status: row.status,
        createdAt: row.created_at,
      }));

      setAppointments(mapped);
      return mapped;
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTodayAppointments = useCallback(
    async (doctorId?: string) => {
      const today = new Date().toISOString().split('T')[0];
      return fetchAppointments({ date: today, doctorId });
    },
    [fetchAppointments]
  );

  const createAppointment = useCallback(async (data: AppointmentFormData) => {
    const { data: result, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: data.patientId,
        doctor_id: data.doctorId,
        date: data.date,
        time: data.time,
        fee: data.fee,
        payment_method: data.paymentMethod,
        payment_status: data.paymentStatus ?? 'pending',
        status: 'scheduled',
        notes: data.notes ?? null,
      })
      .select('*, patient:patients(*), doctor:doctors(*)')
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'appointment_created',
      entity_type: 'appointment',
      entity_id: result.id,
      description: `Appointment booked for patient ${result.patient?.name ?? data.patientId}`,
      user_name: 'System',
    });

    return result;
  }, []);

  const updateAppointmentStatus = useCallback(
    async (id: string, status: AppointmentStatus) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
      );
    },
    []
  );

  const cancelAppointment = useCallback(
    async (id: string) => {
      await updateAppointmentStatus(id, 'cancelled');

      await supabase.from('activity_logs').insert({
        action: 'appointment_cancelled',
        entity_type: 'appointment',
        entity_id: id,
        description: 'Appointment cancelled',
        user_name: 'System',
      });
    },
    [updateAppointmentStatus]
  );

  return {
    appointments,
    isLoading,
    fetchAppointments,
    fetchTodayAppointments,
    createAppointment,
    updateAppointmentStatus,
    cancelAppointment,
  };
}
