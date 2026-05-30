// #must: Lab booking form — patient select, multi-select tests, total, payment method
import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { labBookingSchema } from '../schemas/lab-booking.schema';
import type { LabBookingFormData } from '../schemas/lab-booking.schema';
import { supabase } from '@/lib/supabase';
import { SearchableSelect } from '@/components/forms/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { PAYMENT_METHODS } from '@/config/constants';
import { formatCurrency } from '@/lib/formatters';
import { Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LabTest, Patient } from '@/types';

interface LabBookingFormProps {
  onSubmit: (data: LabBookingFormData) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function LabBookingForm({ onSubmit, onClose, isSubmitting }: LabBookingFormProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [testSearch, setTestSearch] = useState('');
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [testsLoading, setTestsLoading] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<LabBookingFormData>({
    resolver: zodResolver(labBookingSchema),
    defaultValues: {
      patientId: '',
      testIds: [],
      paymentMethod: 'cash',
      notes: '',
    },
  });

  const selectedTestIds = watch('testIds');

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      setPatientsLoading(true);
      try {
        const { data } = await supabase
          .from('patients')
          .select('*')
          .order('name');
        setPatients((data ?? []) as unknown as Patient[]);
      } finally {
        setPatientsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Fetch active tests
  useEffect(() => {
    const fetchTests = async () => {
      setTestsLoading(true);
      try {
        const { data } = await supabase
          .from('lab_tests')
          .select('*')
          .eq('is_active', true)
          .order('test_name');
        const mapped: LabTest[] = (data ?? []).map((t) => ({
          id: t.id,
          testName: t.test_name,
          testCode: t.test_code,
          category: t.category,
          price: t.price,
          sampleType: t.sample_type,
          parameters: t.parameters ?? [],
          isActive: t.is_active,
          createdAt: t.created_at,
        }));
        setTests(mapped);
      } finally {
        setTestsLoading(false);
      }
    };
    fetchTests();
  }, []);

  const toggleTest = useCallback(
    (testId: string) => {
      const current = selectedTestIds ?? [];
      if (current.includes(testId)) {
        setValue(
          'testIds',
          current.filter((id) => id !== testId),
          { shouldValidate: true }
        );
      } else {
        setValue('testIds', [...current, testId], { shouldValidate: true });
      }
    },
    [selectedTestIds, setValue]
  );

  const totalAmount = tests
    .filter((t) => selectedTestIds?.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);

  const filteredTests = tests.filter(
    (t) =>
      t.testName.toLowerCase().includes(testSearch.toLowerCase()) ||
      t.testCode.toLowerCase().includes(testSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(testSearch.toLowerCase())
  );

  const patientOptions = patients.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.patientId}) - ${p.phone}`,
  }));

  const paymentOptions = PAYMENT_METHODS.map((m) => ({
    value: m,
    label: m.charAt(0).toUpperCase() + m.slice(1),
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Patient selection */}
      <Controller
        control={control}
        name="patientId"
        render={({ field }) => (
          <SearchableSelect
            label="Patient"
            options={patientOptions}
            value={field.value}
            onChange={field.onChange}
            placeholder="Search patient by name, ID, or phone..."
            isLoading={patientsLoading}
            error={errors.patientId?.message}
          />
        )}
      />

      {/* Test multi-select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Select Tests
        </label>
        {errors.testIds && (
          <p className="mb-2 text-xs text-red-500">{errors.testIds.message}</p>
        )}

        {/* Test search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={testSearch}
            onChange={(e) => setTestSearch(e.target.value)}
            placeholder="Search tests..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Test list */}
        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
          {testsLoading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">Loading tests...</div>
          ) : filteredTests.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">No tests found</div>
          ) : (
            filteredTests.map((test) => {
              const isSelected = selectedTestIds?.includes(test.id) ?? false;
              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => toggleTest(test.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-slate-700/50',
                    isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 dark:border-slate-600'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {test.testName}
                      </span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        ({test.testCode})
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(test.price)}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Selected count */}
        {selectedTestIds && selectedTestIds.length > 0 && (
          <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
            {selectedTestIds.length} test{selectedTestIds.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Payment method */}
      <Controller
        control={control}
        name="paymentMethod"
        render={({ field }) => (
          <SearchableSelect
            label="Payment Method"
            options={paymentOptions}
            value={field.value}
            onChange={field.onChange}
            error={errors.paymentMethod?.message}
          />
        )}
      />

      {/* Notes */}
      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <Textarea
            label="Notes (optional)"
            value={field.value ?? ''}
            onChange={field.onChange}
            placeholder="Any additional notes..."
            rows={2}
          />
        )}
      />

      {/* Total */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-slate-800/50 px-4 py-3 border border-gray-200 dark:border-slate-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Total Amount
        </span>
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {formatCurrency(totalAmount)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Create Booking
        </Button>
      </div>
    </form>
  );
}
