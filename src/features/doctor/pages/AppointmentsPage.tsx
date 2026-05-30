// #must: Full appointments management page with booking modal, filters, and data table
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Calendar, List } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/data/DataTable';
import { SearchableSelect } from '@/components/forms/SearchableSelect';
import { DatePickerField } from '@/components/forms/DatePickerField';
import { useAppointments } from '../hooks/useAppointments';
import { useAppointmentColumns } from '../components/AppointmentList';
import { AppointmentCalendar } from '../components/AppointmentCalendar';
import { appointmentSchema } from '../schemas/appointment.schema';
import { supabase } from '@/lib/supabase';
import { generateReceiptPDF } from '@/lib/pdf/receipt.pdf';
import { ROUTES } from '@/config/routes';
import { PAYMENT_METHODS } from '@/config/constants';
import type { AppointmentFormData } from '../schemas/appointment.schema';
import type { Appointment, AppointmentStatus } from '@/types';

interface PatientOption {
  value: string;
  label: string;
  phone: string;
}

interface DoctorOption {
  value: string;
  label: string;
  fee: number;
}

export function AppointmentsPage() {
  const navigate = useNavigate();
  const { appointments, isLoading, fetchAppointments, createAppointment, cancelAppointment } =
    useAppointments();

  // UI state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterDoctor, setFilterDoctor] = useState('');

  // Options for selects
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  // Form
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(appointmentSchema) as any,
    defaultValues: {
      patientId: '',
      doctorId: '',
      date: '',
      time: '',
      fee: 0,
      paymentMethod: 'cash',
      notes: '',
    },
  });

  const watchDoctorId = watch('doctorId');

  // Auto-fill fee when doctor is selected
  useEffect(() => {
    if (watchDoctorId) {
      const doc = doctorOptions.find((d) => d.value === watchDoctorId);
      if (doc) {
        setValue('fee', doc.fee);
      }
    }
  }, [watchDoctorId, doctorOptions, setValue]);

  // Load appointments on mount and filter change
  useEffect(() => {
    const filters: { date?: string; doctorId?: string; status?: AppointmentStatus } = {};
    if (filterDate) {
      filters.date = filterDate.toISOString().split('T')[0];
    }
    if (filterDoctor) {
      filters.doctorId = filterDoctor;
    }
    if (activeTab !== 'all') {
      filters.status = activeTab as AppointmentStatus;
    }
    fetchAppointments(filters);
  }, [fetchAppointments, filterDate, filterDoctor, activeTab]);

  // Fetch patients for booking modal
  const fetchPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone')
        .order('name');
      if (error) throw error;
      setPatientOptions(
        (data ?? []).map((p) => ({
          value: p.id,
          label: `${p.name} (${p.phone})`,
          phone: p.phone,
        }))
      );
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setIsLoadingPatients(false);
    }
  }, []);

  // Fetch doctors for booking modal & filter
  const fetchDoctors = useCallback(async () => {
    setIsLoadingDoctors(true);
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, consultation_fee')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setDoctorOptions(
        (data ?? []).map((d) => ({
          value: d.id,
          label: `Dr. ${d.name}`,
          fee: d.consultation_fee,
        }))
      );
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setIsLoadingDoctors(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const openBookingModal = () => {
    reset();
    fetchPatients();
    setShowBookingModal(true);
  };

  const onBookAppointment = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createAppointment(data);

      // Generate receipt
      const patient = patientOptions.find((p) => p.value === data.patientId);
      const doctor = doctorOptions.find((d) => d.value === data.doctorId);

      const receipt = generateReceiptPDF({
        receiptNo: result.appointment_no ?? `APT-${Date.now()}`,
        date: new Date().toISOString(),
        patientName: patient?.label.split(' (')[0] ?? 'Patient',
        patientPhone: patient?.phone ?? '',
        serviceType: 'Doctor Consultation',
        serviceDetails: doctor?.label ?? 'Consultation',
        amount: data.fee,
        paymentMethod: data.paymentMethod,
        receivedBy: 'Reception',
      });
      receipt.save(`Receipt_${result.appointment_no ?? 'APT'}.pdf`);

      toast.success('Appointment booked successfully');
      setShowBookingModal(false);
      fetchAppointments();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to book appointment';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartConsultation = (apt: Appointment) => {
    navigate(ROUTES.CONSULTATION.replace(':id', apt.id));
  };

  const handleCancelAppointment = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setShowCancelConfirm(true);
  };

  const confirmCancel = async () => {
    if (!selectedAppointment) return;
    try {
      await cancelAppointment(selectedAppointment.id);
      toast.success('Appointment cancelled');
      setShowCancelConfirm(false);
      setSelectedAppointment(null);
    } catch {
      toast.error('Failed to cancel appointment');
    }
  };

  const handleView = (apt: Appointment) => {
    navigate(ROUTES.CONSULTATION.replace(':id', apt.id));
  };

  const columns = useAppointmentColumns({
    onView: handleView,
    onStartConsultation: handleStartConsultation,
    onCancel: handleCancelAppointment,
  });

  const statusTabs = [
    { id: 'all', label: 'All' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Manage patient appointments and consultations"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                title="Table view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`p-2 transition-colors ${viewMode === 'calendar' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                title="Timeline view"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
            <Button variant="primary" onClick={openBookingModal}>
              <Plus className="h-4 w-4 mr-1.5" />
              Book Appointment
            </Button>
          </div>
        }
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
          <div className="w-full sm:w-56">
            <SearchableSelect
              label="Filter by Doctor"
              options={doctorOptions.map((d) => ({ value: d.value, label: d.label }))}
              value={filterDoctor}
              onChange={setFilterDoctor}
              placeholder="All doctors"
              isLoading={isLoadingDoctors}
            />
          </div>
          {(filterDate || filterDoctor) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterDate(null);
                setFilterDoctor('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Status Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={statusTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={appointments}
          isLoading={isLoading}
          searchable
          searchPlaceholder="Search by patient name, doctor..."
          pagination
          pageSize={10}
          emptyMessage="No appointments found"
        />
      ) : (
        <Card>
          <div className="p-4">
            <AppointmentCalendar
              appointments={appointments}
              onSlotClick={handleView}
            />
          </div>
        </Card>
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Book New Appointment"
        size="lg"
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <form onSubmit={handleSubmit(onBookAppointment as any)} className="space-y-4 p-1">
          <Controller
            control={control}
            name="patientId"
            render={({ field }) => (
              <SearchableSelect
                label="Patient"
                options={patientOptions.map((p) => ({ value: p.value, label: p.label }))}
                value={field.value}
                onChange={field.onChange}
                placeholder="Search patient by name or phone..."
                isLoading={isLoadingPatients}
                error={errors.patientId?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="doctorId"
            render={({ field }) => (
              <SearchableSelect
                label="Doctor"
                options={doctorOptions.map((d) => ({ value: d.value, label: d.label }))}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select doctor..."
                isLoading={isLoadingDoctors}
                error={errors.doctorId?.message}
              />
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <Input
                  label="Date"
                  type="text"
                  placeholder="YYYY-MM-DD"
                  error={errors.date?.message}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Controller
              control={control}
              name="time"
              render={({ field }) => (
                <Input
                  label="Time"
                  type="text"
                  placeholder="HH:MM (24h)"
                  error={errors.time?.message}
                  {...field}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="fee"
              render={({ field }) => (
                <Input
                  label="Consultation Fee"
                  type="number"
                  placeholder="500"
                  error={errors.fee?.message}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  value={field.value || ''}
                />
              )}
            />
            <Controller
              control={control}
              name="paymentMethod"
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100"
                    {...field}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.paymentMethod?.message && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.paymentMethod.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <Input
                label="Notes (optional)"
                placeholder="Any special instructions..."
                {...field}
                value={field.value ?? ''}
              />
            )}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBookingModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting && <Spinner size="sm" className="mr-2" />}
              Book Appointment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={confirmCancel}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel the appointment for ${selectedAppointment?.patient?.name ?? 'this patient'}? This action cannot be undone.`}
        confirmText="Yes, Cancel"
        variant="danger"
      />
    </div>
  );
}
