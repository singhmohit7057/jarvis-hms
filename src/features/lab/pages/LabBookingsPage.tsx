
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Plus } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useLabBookings } from '../hooks/useLabBookings';
import { LabBookingForm } from '../components/LabBookingForm';
import { LabBookingTable } from '../components/LabBookingTable';
import { LabStatusTracker } from '../components/LabStatusTracker';
import { CollectSampleModal } from '../components/CollectSampleModal';
import { generateLabReceiptPDF, fetchLabReceiptClinic } from '@/lib/pdf/lab-receipt.pdf';
import { generateLabReportPDF } from '@/lib/pdf/lab-report.pdf';
import { supabase } from '@/lib/supabase';
import type { LabBooking, LabStatus } from '@/types';
import type { LabBookingFormData } from '../schemas/lab-booking.schema';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'booked', label: 'Booked' },
  { id: 'sample_collected', label: 'Sample Collected' },
  { id: 'processing', label: 'Processing' },
  { id: 'completed', label: 'Completed' },
  { id: 'delivered', label: 'Delivered' },
];

export function LabBookingsPage() {
  const navigate = useNavigate();
  const {
    bookings,
    isLoading,
    fetchBookings,
    createBooking,
    updateStatus,
    getNextStatus,
  } = useLabBookings();

  const [activeTab, setActiveTab] = useState('all');
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<{
    booking: LabBooking;
    nextStatus: LabStatus;
  } | null>(null);
  const [collectSampleBooking, setCollectSampleBooking] = useState<LabBooking | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [detailBooking, setDetailBooking] = useState<LabBooking | null>(null);

  useEffect(() => {
    const filters = activeTab === 'all' ? undefined : { status: activeTab as LabStatus };
    fetchBookings(filters);
  }, [activeTab, fetchBookings]);

  const handleCreateBooking = useCallback(
    async (data: LabBookingFormData) => {
      setIsSubmitting(true);
      try {
        await createBooking(data);
        toast.success('Lab booking created successfully');
        setShowNewBooking(false);
        fetchBookings(activeTab === 'all' ? undefined : { status: activeTab as LabStatus });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create booking');
      } finally {
        setIsSubmitting(false);
      }
    },
    [createBooking, fetchBookings, activeTab]
  );

  const handleUpdateStatus = useCallback(
    (booking: LabBooking) => {
      const nextStatus = getNextStatus(booking.status);
      if (!nextStatus) return;
      if (booking.status === 'booked') {
        setCollectSampleBooking(booking);
      } else {
        setStatusConfirm({ booking, nextStatus });
      }
    },
    [getNextStatus]
  );

  const confirmCollectSample = useCallback(
    async (collectorName: string, bottleNumber: string) => {
      if (!collectSampleBooking) return;
      setIsCollecting(true);
      try {
        await updateStatus(collectSampleBooking.id, 'sample_collected', {
          collectorName,
          bottleNumber,
        });
        toast.success('Sample collected successfully');
        fetchBookings(activeTab === 'all' ? undefined : { status: activeTab as LabStatus });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to collect sample');
      } finally {
        setIsCollecting(false);
        setCollectSampleBooking(null);
      }
    },
    [collectSampleBooking, updateStatus, fetchBookings, activeTab]
  );

  const confirmStatusUpdate = useCallback(async () => {
    if (!statusConfirm) return;
    try {
      await updateStatus(statusConfirm.booking.id, statusConfirm.nextStatus);
      toast.success(
        `Status updated to "${statusConfirm.nextStatus.replace(/_/g, ' ')}"`
      );
      fetchBookings(activeTab === 'all' ? undefined : { status: activeTab as LabStatus });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusConfirm(null);
    }
  }, [statusConfirm, updateStatus, fetchBookings, activeTab]);

  const handleViewDetails = useCallback((booking: LabBooking) => {
    setDetailBooking(booking);
  }, []);

  const handleEnterReport = useCallback(
    (booking: LabBooking) => {
      navigate(ROUTES.LAB_REPORT_ENTRY.replace(':id', booking.id));
    },
    [navigate]
  );

  const handlePrintReport = useCallback(async (booking: LabBooking) => {
    try {
      const { data: reports, error } = await supabase
        .from('lab_reports')
        .select('*')
        .eq('lab_booking_id', booking.id);
      if (error) throw error;
      if (!reports || reports.length === 0) {
        toast.error('No report data found. Enter results first.');
        return;
      }
      const mappedReports = reports.map((r) => ({
        id: r.id,
        labBookingId: r.lab_booking_id,
        labTestId: r.lab_test_id,
        testName: r.test_name,
        patientId: r.patient_id,
        results: r.results ?? [],
        interpretation: r.interpretation ?? undefined,
        verifiedBy: r.verified_by,
        createdAt: r.created_at,
        test: {
          id: r.lab_test_id, testName: r.test_name, testCode: '',
          category: '', price: 0, sampleType: '', parameters: [],
          isActive: true, createdAt: '',
        },
      }));
      if (!booking.patient) {
        toast.error('Patient data not available');
        return;
      }
      const pdf = generateLabReportPDF(
        { ...booking, patient: booking.patient },
        mappedReports
      );
      pdf.save(`Lab-Report-${booking.bookingNumber}.pdf`);
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? 'Failed to generate report');
    }
  }, []);

  const handlePrintReceipt = useCallback(async (booking: LabBooking) => {
    try {
      const clinic = await fetchLabReceiptClinic();
      const pdf = generateLabReceiptPDF(
        {
          bookingNumber: booking.bookingNumber,
          date: booking.createdAt,
          patientName: booking.patient?.name ?? 'Unknown',
          patientId: booking.patient?.patientId,
          patientPhone: booking.patient?.phone,
          tests: booking.tests.map((t) => ({ testName: t.testName, price: t.price })),
          totalAmount: booking.totalAmount,
          paymentMethod: booking.paymentMethod ?? 'cash',
          collectorName: booking.collectorName,
          bottleNumber: booking.bottleNumber,
        },
        clinic
      );
      pdf.save(`Lab_Receipt_${booking.bookingNumber}.pdf`);
    } catch {
      toast.error('Failed to generate receipt');
    }
  }, []);

  return (
    <div>
      <PageHeader
        title="Lab Bookings"
        subtitle="Manage lab test bookings and track sample progress"
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowNewBooking(true)}
          >
            New Booking
          </Button>
        }
      />

      {/* Status tabs */}
      <Tabs tabs={STATUS_TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Bookings table */}
      <div className="mt-4">
        <LabBookingTable
          bookings={bookings}
          isLoading={isLoading}
          onUpdateStatus={handleUpdateStatus}
          onViewDetails={handleViewDetails}
          onEnterReport={handleEnterReport}
          onPrintReport={handlePrintReport}
          onPrintReceipt={handlePrintReceipt}
          getNextStatus={getNextStatus}
        />
      </div>

      {/* New Booking Modal */}
      <Modal
        isOpen={showNewBooking}
        onClose={() => setShowNewBooking(false)}
        title="New Lab Booking"
        size="lg"
      >
        <LabBookingForm
          onSubmit={handleCreateBooking}
          onClose={() => setShowNewBooking(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Collect Sample Modal */}
      <CollectSampleModal
        isOpen={!!collectSampleBooking}
        bookingNumber={collectSampleBooking?.bookingNumber ?? ''}
        onClose={() => setCollectSampleBooking(null)}
        onConfirm={confirmCollectSample}
        isLoading={isCollecting}
      />

      {/* Status Update Confirmation */}
      <ConfirmDialog
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={confirmStatusUpdate}
        title="Update Status"
        message={
          statusConfirm
            ? `Move booking ${statusConfirm.booking.bookingNumber} to "${statusConfirm.nextStatus.replace(/_/g, ' ')}"?`
            : ''
        }
        confirmText="Update"
      />

      {/* Detail View Modal */}
      <Modal
        isOpen={!!detailBooking}
        onClose={() => setDetailBooking(null)}
        title={`Booking Details - ${detailBooking?.bookingNumber ?? ''}`}
        size="lg"
      >
        {detailBooking && (
          <div className="space-y-4">
            <LabStatusTracker currentStatus={detailBooking.status} />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Patient</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {detailBooking.patient?.name ?? 'Unknown'}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Patient ID</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {detailBooking.patient?.patientId ?? 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Payment</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {detailBooking.paymentMethod?.toUpperCase()} ({detailBooking.paymentStatus})
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total</span>
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  ₹{detailBooking.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tests
              </h4>
              <div className="divide-y divide-gray-100 dark:divide-slate-700 rounded-lg border border-gray-200 dark:border-slate-700">
                {detailBooking.tests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {test.testName}
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      ₹{test.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
