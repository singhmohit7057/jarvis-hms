// #must: Lab bookings management page — status tabs, booking table, new booking modal
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
      setStatusConfirm({ booking, nextStatus });
    },
    [getNextStatus]
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

  const handlePrintReceipt = useCallback((booking: LabBooking) => {
    // Simple receipt print
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const testLines = booking.tests
      .map((t) => `<tr><td>${t.testName}</td><td style="text-align:right">₹${t.price.toFixed(2)}</td></tr>`)
      .join('');
    printWindow.document.write(`
      <html><head><title>Receipt - ${booking.bookingNumber}</title>
      <style>body{font-family:sans-serif;padding:20px;max-width:400px;margin:0 auto}
      table{width:100%;border-collapse:collapse}td{padding:4px 0;border-bottom:1px solid #eee}
      .total{font-weight:bold;font-size:1.1em;border-top:2px solid #333}</style></head>
      <body><h2>Lab Receipt</h2><p><strong>Booking:</strong> ${booking.bookingNumber}</p>
      <p><strong>Patient:</strong> ${booking.patient?.name ?? 'N/A'}</p>
      <p><strong>Date:</strong> ${new Date(booking.createdAt).toLocaleDateString()}</p>
      <table>${testLines}<tr class="total"><td>Total</td><td style="text-align:right">₹${booking.totalAmount.toFixed(2)}</td></tr></table>
      <p><strong>Payment:</strong> ${booking.paymentMethod ?? 'N/A'} (${booking.paymentStatus})</p>
      <p style="margin-top:20px;font-size:0.8em;color:#666">Thank you for choosing our services.</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
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
