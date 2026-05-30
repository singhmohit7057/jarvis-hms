// #must: Lab report entry page — enter results for each test in a booking
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Save, CheckCircle, FileText, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/config/routes';
import { formatDate } from '@/lib/formatters';
import { LabStatusTracker } from '../components/LabStatusTracker';
import { ReportEntryForm } from '../components/ReportEntryForm';
import { generateLabReportPDF } from '@/lib/pdf/lab-report.pdf';
import type { LabBooking, LabTest, LabReport, LabResultEntry } from '@/types';

interface TestWithReport {
  test: LabTest;
  bookingTestId: string;
  bookingTestName: string;
  report: LabReport | null;
}

interface DraftResult {
  testId: string;
  results: LabResultEntry[];
  interpretation: string;
}

export function ReportEntryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [booking, setBooking] = useState<LabBooking | null>(null);
  const [testsWithReports, setTestsWithReports] = useState<TestWithReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [drafts, setDrafts] = useState<Map<string, DraftResult>>(new Map());
  const [error, setError] = useState<string | null>(null);

  // Fetch booking details + tests + existing reports
  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch booking with patient and booking tests
      const { data: bookingData, error: bookingError } = await supabase
        .from('lab_bookings')
        .select(`
          *,
          patient:patients(*),
          tests:lab_booking_tests(*)
        `)
        .eq('id', id)
        .single();

      if (bookingError) throw bookingError;
      if (!bookingData) throw new Error('Booking not found');

      const mappedBooking: LabBooking = {
        id: bookingData.id,
        bookingNumber: bookingData.booking_number,
        patientId: bookingData.patient_id,
        patient: bookingData.patient ?? undefined,
        tests: (bookingData.tests ?? []).map((t: Record<string, unknown>) => ({
          id: t.id as string,
          labBookingId: t.lab_booking_id as string,
          labTestId: t.lab_test_id as string,
          testName: t.test_name as string,
          price: t.price as number,
        })),
        totalAmount: bookingData.total_amount,
        paymentStatus: bookingData.payment_status,
        paymentMethod: bookingData.payment_method ?? undefined,
        status: bookingData.status,
        collectedBy: bookingData.collected_by ?? undefined,
        processedBy: bookingData.processed_by ?? undefined,
        verifiedBy: bookingData.verified_by ?? undefined,
        createdAt: bookingData.created_at,
      };

      setBooking(mappedBooking);

      // Fetch the full test definitions for each booking test
      const testIds = mappedBooking.tests.map((t) => t.labTestId);
      const { data: testDefs, error: testError } = await supabase
        .from('lab_tests')
        .select('*')
        .in('id', testIds);

      if (testError) throw testError;

      // Fetch existing reports for this booking
      const { data: existingReports, error: reportError } = await supabase
        .from('lab_reports')
        .select('*')
        .eq('lab_booking_id', id);

      if (reportError) throw reportError;

      // Map tests with their reports
      const mapped: TestWithReport[] = mappedBooking.tests.map((bt) => {
        const testDef = (testDefs ?? []).find((td) => td.id === bt.labTestId);
        const report = (existingReports ?? []).find(
          (r) => r.lab_test_id === bt.labTestId
        );

        const labTest: LabTest = testDef
          ? {
              id: testDef.id,
              testName: testDef.test_name,
              testCode: testDef.test_code,
              category: testDef.category,
              price: testDef.price,
              sampleType: testDef.sample_type,
              parameters: testDef.parameters ?? [],
              isActive: testDef.is_active,
              createdAt: testDef.created_at,
            }
          : {
              id: bt.labTestId,
              testName: bt.testName,
              testCode: '',
              category: '',
              price: bt.price,
              sampleType: '',
              parameters: [],
              isActive: true,
              createdAt: '',
            };

        const labReport: LabReport | null = report
          ? {
              id: report.id,
              labBookingId: report.lab_booking_id,
              labTestId: report.lab_test_id,
              testName: report.test_name,
              patientId: report.patient_id,
              results: report.results ?? [],
              interpretation: report.interpretation ?? undefined,
              verifiedBy: report.verified_by,
              createdAt: report.created_at,
            }
          : null;

        return {
          test: labTest,
          bookingTestId: bt.id,
          bookingTestName: bt.testName,
          report: labReport,
        };
      });

      setTestsWithReports(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle save for a single test
  const handleSaveTest = useCallback(
    (testId: string, data: { results: LabResultEntry[]; interpretation: string }) => {
      setDrafts((prev) => {
        const next = new Map(prev);
        next.set(testId, { testId, results: data.results, interpretation: data.interpretation });
        return next;
      });
      toast.success('Results saved to draft');
    },
    []
  );

  // Save all drafts (without completing)
  const handleSaveDraft = useCallback(async () => {
    if (!booking || drafts.size === 0) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      for (const [testId, draft] of drafts) {
        // Upsert report
        const existing = testsWithReports.find((t) => t.test.id === testId)?.report;
        const testInfo = testsWithReports.find((t) => t.test.id === testId);

        const reportNumber = `RPT-${booking.bookingNumber}-${testId.slice(-4).toUpperCase()}`;
        const payload = {
          lab_booking_id: booking.id,
          lab_test_id: testId,
          test_name: testInfo?.bookingTestName ?? '',
          patient_id: booking.patientId,
          results: draft.results,
          interpretation: draft.interpretation || null,
          verified_by: user?.name ?? 'Lab Staff',
        };

        if (existing) {
          const { error } = await supabase
            .from('lab_reports')
            .update(payload)
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('lab_reports').insert({ ...payload, report_number: reportNumber });
          if (error) throw error;
        }
      }

      toast.success('Draft saved successfully');
      setDrafts(new Map());
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  }, [booking, drafts, testsWithReports, user, fetchData]);

  // Mark complete — validates all values, updates status
  const handleMarkComplete = useCallback(async () => {
    if (!booking) return;

    // Validate: all tests must have all parameters filled
    // Check both drafts and existing reports
    for (const tw of testsWithReports) {
      const draft = drafts.get(tw.test.id);
      const results = draft?.results ?? tw.report?.results ?? [];

      if (results.length === 0 && tw.test.parameters.length > 0) {
        toast.error(`Please enter results for "${tw.bookingTestName}"`);
        return;
      }

      const emptyResults = results.filter((r) => r.value.trim() === '');
      if (emptyResults.length > 0) {
        toast.error(
          `All parameters must have values in "${tw.bookingTestName}"`
        );
        return;
      }
    }

    if (booking.status !== 'processing') {
      toast.error('Booking must be in processing status to complete');
      return;
    }

    setIsSaving(true);
    try {
      // Save any unsaved drafts first
      for (const [testId, draft] of drafts) {
        const existing = testsWithReports.find((t) => t.test.id === testId)?.report;
        const testInfo = testsWithReports.find((t) => t.test.id === testId);

        const reportNumber = `RPT-${booking.bookingNumber}-${testId.slice(-4).toUpperCase()}`;
        const payload = {
          lab_booking_id: booking.id,
          lab_test_id: testId,
          test_name: testInfo?.bookingTestName ?? '',
          patient_id: booking.patientId,
          results: draft.results,
          interpretation: draft.interpretation || null,
          verified_by: user?.name ?? 'Lab Staff',
        };

        if (existing) {
          const { error } = await supabase
            .from('lab_reports')
            .update(payload)
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('lab_reports').insert({ ...payload, report_number: reportNumber });
          if (error) throw error;
        }
      }

      // Update booking status to completed
      const { error: statusError } = await supabase
        .from('lab_bookings')
        .update({ status: 'completed', verified_by: user?.id })
        .eq('id', booking.id);

      if (statusError) throw statusError;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_name: user?.name ?? 'Unknown',
        action: 'lab_report_completed',
        description: `Lab report completed for booking ${booking.bookingNumber}`,
        metadata: { bookingId: booking.id },
      });

      toast.success('Report marked as complete');
      setDrafts(new Map());
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete report');
    } finally {
      setIsSaving(false);
    }
  }, [booking, drafts, testsWithReports, user, fetchData]);

  // Generate PDF
  const handleGeneratePDF = useCallback(async () => {
    if (!booking) return;

    try {
      // Fetch latest reports
      const { data: reports, error: reportsError } = await supabase
        .from('lab_reports')
        .select('*')
        .eq('lab_booking_id', booking.id);

      if (reportsError) throw reportsError;
      if (!reports || reports.length === 0) {
        toast.error('No reports found. Please save results first.');
        return;
      }

      // Map reports with their test definitions
      const mappedReports = reports.map((r) => {
        const tw = testsWithReports.find((t) => t.test.id === r.lab_test_id);
        return {
          id: r.id,
          labBookingId: r.lab_booking_id,
          labTestId: r.lab_test_id,
          testName: r.test_name,
          patientId: r.patient_id,
          results: r.results ?? [],
          interpretation: r.interpretation ?? undefined,
          verifiedBy: r.verified_by,
          createdAt: r.created_at,
          test: tw?.test ?? {
            id: r.lab_test_id,
            testName: r.test_name,
            testCode: '',
            category: '',
            price: 0,
            sampleType: '',
            parameters: [],
            isActive: true,
            createdAt: '',
          },
        };
      });

      const bookingWithPatient = {
        ...booking,
        patient: booking.patient!,
      };

      const pdf = generateLabReportPDF(bookingWithPatient, mappedReports);
      pdf.save(`Lab-Report-${booking.bookingNumber}.pdf`);
      toast.success('PDF generated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate PDF');
    }
  }, [booking, testsWithReports]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <Alert variant="error" title="Error">
          {error ?? 'Booking not found'}
        </Alert>
        <Button
          variant="secondary"
          className="mt-4"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate(ROUTES.LAB_BOOKINGS)}
        >
          Back to Bookings
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Report Entry - ${booking.bookingNumber}`}
        subtitle={`Patient: ${booking.patient?.name ?? 'Unknown'} | ${booking.patient?.age ?? ''}/${booking.patient?.gender ?? ''}`}
        breadcrumbs={[
          { label: 'Lab Bookings', path: ROUTES.LAB_BOOKINGS },
          { label: 'Report Entry' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(ROUTES.LAB_BOOKINGS)}
            >
              Back
            </Button>
            <Button
              variant="outline"
              leftIcon={<FileText className="h-4 w-4" />}
              onClick={handleGeneratePDF}
            >
              Generate PDF
            </Button>
          </div>
        }
      />

      {/* Status tracker */}
      <Card className="mb-6 p-4">
        <LabStatusTracker currentStatus={booking.status} />
      </Card>

      {/* Booking metadata */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Booking Date</span>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {formatDate(booking.createdAt)}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Sample Collected By</span>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {booking.collectedBy ?? 'Pending'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Tests</span>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {booking.tests.length} test{booking.tests.length > 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Status</span>
            <p className="font-medium capitalize text-gray-900 dark:text-gray-100">
              {booking.status.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </Card>

      {/* Test report forms */}
      <div className="space-y-4 mb-6">
        {testsWithReports.map((tw) => (
          <ReportEntryForm
            key={tw.test.id}
            test={tw.test}
            bookingTest={{
              id: tw.bookingTestId,
              labBookingId: booking.id,
              labTestId: tw.test.id,
              testName: tw.bookingTestName,
              price: tw.test.price,
            }}
            existingReport={tw.report ?? undefined}
            onSave={(data) => handleSaveTest(tw.test.id, data)}
          />
        ))}
      </div>

      {/* Bottom actions */}
      <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 px-6 py-4 -mx-6 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {drafts.size > 0
            ? `${drafts.size} unsaved change${drafts.size > 1 ? 's' : ''}`
            : 'All changes saved'}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<Save className="h-4 w-4" />}
            onClick={handleSaveDraft}
            isLoading={isSaving}
            disabled={drafts.size === 0}
          >
            Save Draft
          </Button>
          <Button
            variant="success"
            leftIcon={<CheckCircle className="h-4 w-4" />}
            onClick={handleMarkComplete}
            isLoading={isSaving}
          >
            Mark Complete
          </Button>
        </div>
      </div>
    </div>
  );
}
