// #must: Custom hook for lab booking CRUD operations with Supabase
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { LAB_STATUS } from '@/config/constants';
import type { LabBooking, LabStatus } from '@/types';
import type { LabBookingFormData } from '../schemas/lab-booking.schema';

interface BookingFilters {
  status?: LabStatus;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
}

const STATUS_ORDER: LabStatus[] = [...LAB_STATUS];

function getNextStatus(current: LabStatus): LabStatus | null {
  const currentIndex = STATUS_ORDER.indexOf(current);
  if (currentIndex < 0 || currentIndex >= STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[currentIndex + 1];
}

function isValidTransition(from: LabStatus, to: LabStatus): boolean {
  const fromIndex = STATUS_ORDER.indexOf(from);
  const toIndex = STATUS_ORDER.indexOf(to);
  return toIndex === fromIndex + 1;
}

export function useLabBookings() {
  const [bookings, setBookings] = useState<LabBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const user = useAuthStore((s) => s.user);

  const fetchBookings = useCallback(async (filters?: BookingFilters) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('lab_bookings')
        .select(`
          *,
          patient:patients(*),
          tests:lab_booking_tests(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters?.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped: LabBooking[] = (data ?? []).map((row) => ({
        id: row.id,
        bookingNumber: row.booking_number,
        patientId: row.patient_id,
        patient: row.patient ?? undefined,
        tests: (row.tests ?? []).map((t: Record<string, unknown>) => ({
          id: t.id as string,
          labBookingId: t.lab_booking_id as string,
          labTestId: t.lab_test_id as string,
          testName: t.test_name as string,
          price: t.price as number,
        })),
        totalAmount: row.total_amount,
        paymentStatus: row.payment_status,
        paymentMethod: row.payment_method ?? undefined,
        status: row.status,
        collectedBy: row.collected_by ?? undefined,
        processedBy: row.processed_by ?? undefined,
        verifiedBy: row.verified_by ?? undefined,
        createdAt: row.created_at,
      }));

      setBookings(mapped);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBooking = useCallback(
    async (data: LabBookingFormData) => {
      // Fetch selected tests to get names and prices
      const { data: tests, error: testsError } = await supabase
        .from('lab_tests')
        .select('id, test_name, price')
        .in('id', data.testIds);

      if (testsError) throw testsError;
      if (!tests || tests.length === 0) throw new Error('No valid tests selected');

      const totalAmount = tests.reduce((sum, t) => sum + (t.price as number), 0);

      // Generate booking number
      const { count } = await supabase
        .from('lab_bookings')
        .select('*', { count: 'exact', head: true });

      const seq = String((count ?? 0) + 1).padStart(4, '0');
      const today = new Date();
      const dateSegment = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const bookingNumber = `LAB-${dateSegment}-${seq}`;

      // Insert booking
      const { data: booking, error: bookingError } = await supabase
        .from('lab_bookings')
        .insert({
          booking_number: bookingNumber,
          patient_id: data.patientId,
          total_amount: totalAmount,
          payment_status: 'paid',
          payment_method: data.paymentMethod,
          status: 'booked',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Insert booking tests
      const bookingTests = tests.map((t) => ({
        lab_booking_id: booking.id,
        lab_test_id: t.id,
        test_name: t.test_name,
        price: t.price,
      }));

      const { error: btError } = await supabase
        .from('lab_booking_tests')
        .insert(bookingTests);

      if (btError) throw btError;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_name: user?.name ?? 'Unknown',
        action: 'lab_booking_created',
        description: `Lab booking ${bookingNumber} created`,
        metadata: { bookingId: booking.id, patientId: data.patientId },
      });

      return booking;
    },
    [user]
  );

  const updateStatus = useCallback(
    async (id: string, newStatus: LabStatus) => {
      // Fetch current status
      const { data: current, error: fetchError } = await supabase
        .from('lab_bookings')
        .select('status, booking_number')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (!isValidTransition(current.status as LabStatus, newStatus)) {
        throw new Error(
          `Invalid status transition from "${current.status}" to "${newStatus}"`
        );
      }

      const updateFields: Record<string, unknown> = { status: newStatus };

      if (newStatus === 'sample_collected') {
        updateFields.collected_by = user?.id;
      } else if (newStatus === 'processing') {
        updateFields.processed_by = user?.id;
      } else if (newStatus === 'completed') {
        updateFields.verified_by = user?.id;
      }

      const { error: updateError } = await supabase
        .from('lab_bookings')
        .update(updateFields)
        .eq('id', id);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_name: user?.name ?? 'Unknown',
        action: 'lab_status_updated',
        description: `Booking ${current.booking_number} status updated to ${newStatus}`,
        metadata: { bookingId: id, from: current.status, to: newStatus },
      });
    },
    [user]
  );

  const fetchBookingById = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('lab_bookings')
      .select(`
        *,
        patient:patients(*),
        tests:lab_booking_tests(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    const booking: LabBooking = {
      id: data.id,
      bookingNumber: data.booking_number,
      patientId: data.patient_id,
      patient: data.patient ?? undefined,
      tests: (data.tests ?? []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        labBookingId: t.lab_booking_id as string,
        labTestId: t.lab_test_id as string,
        testName: t.test_name as string,
        price: t.price as number,
      })),
      totalAmount: data.total_amount,
      paymentStatus: data.payment_status,
      paymentMethod: data.payment_method ?? undefined,
      status: data.status,
      collectedBy: data.collected_by ?? undefined,
      processedBy: data.processed_by ?? undefined,
      verifiedBy: data.verified_by ?? undefined,
      createdAt: data.created_at,
    };

    return booking;
  }, []);

  const fetchPatientBookings = useCallback(async (patientId: string) => {
    await fetchBookings({ patientId });
  }, [fetchBookings]);

  return {
    bookings,
    isLoading,
    fetchBookings,
    createBooking,
    updateStatus,
    fetchBookingById,
    fetchPatientBookings,
    getNextStatus,
  };
}
