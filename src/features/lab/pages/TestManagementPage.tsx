
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TestCatalogTable } from '../components/TestCatalogTable';
import { TestForm } from '../components/TestForm';
import type { LabTest } from '@/types';
import type { LabTestFormData } from '../schemas/test.schema';

export function TestManagementPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState<LabTest | null>(null);

  const fetchTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .order('test_name');

      if (error) throw error;

      const mapped: LabTest[] = (data ?? []).map((row) => ({
        id: row.id,
        testName: row.test_name,
        testCode: row.test_code,
        category: row.category,
        price: row.price,
        sampleType: row.sample_type,
        parameters: row.parameters ?? [],
        isActive: row.is_active,
        createdAt: row.created_at,
      }));

      setTests(mapped);
    } catch (err) {
      toast.error('Failed to fetch lab tests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleSubmit = useCallback(
    async (data: LabTestFormData) => {
      setIsSubmitting(true);
      try {
        const payload = {
          test_name: data.testName,
          test_code: data.testCode,
          category: data.category,
          price: data.price,
          sample_type: data.sampleType,
          parameters: data.parameters,
        };

        if (editingTest) {
          const { error } = await supabase
            .from('lab_tests')
            .update(payload)
            .eq('id', editingTest.id);
          if (error) throw error;
          toast.success('Test updated successfully');
        } else {
          const { error } = await supabase
            .from('lab_tests')
            .insert({ ...payload, is_active: true });
          if (error) throw error;
          toast.success('Test added successfully');
        }

        setShowForm(false);
        setEditingTest(null);
        fetchTests();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save test');
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingTest, fetchTests]
  );

  const handleEdit = useCallback((test: LabTest) => {
    setEditingTest(test);
    setShowForm(true);
  }, []);

  const handleToggleActive = useCallback((test: LabTest) => {
    setToggleConfirm(test);
  }, []);

  const confirmToggle = useCallback(async () => {
    if (!toggleConfirm) return;
    try {
      const { error } = await supabase
        .from('lab_tests')
        .update({ is_active: !toggleConfirm.isActive })
        .eq('id', toggleConfirm.id);
      if (error) throw error;
      toast.success(
        `Test ${toggleConfirm.isActive ? 'deactivated' : 'activated'} successfully`
      );
      fetchTests();
    } catch (err) {
      toast.error('Failed to update test status');
    } finally {
      setToggleConfirm(null);
    }
  }, [toggleConfirm, fetchTests]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingTest(null);
  }, []);

  return (
    <div>
      <PageHeader
        title="Lab Tests"
        subtitle="Manage test catalog and parameters"
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowForm(true)}
          >
            Add Test
          </Button>
        }
      />

      <TestCatalogTable
        tests={tests}
        isLoading={isLoading}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
      />

      {/* Add/Edit Test Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingTest ? 'Edit Lab Test' : 'Add Lab Test'}
        size="lg"
      >
        <TestForm
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
          isSubmitting={isSubmitting}
          defaultValues={
            editingTest
              ? {
                  testName: editingTest.testName,
                  testCode: editingTest.testCode,
                  category: editingTest.category,
                  price: editingTest.price,
                  sampleType: editingTest.sampleType,
                  parameters: editingTest.parameters,
                }
              : undefined
          }
        />
      </Modal>

      {/* Toggle Active Confirmation */}
      <ConfirmDialog
        isOpen={!!toggleConfirm}
        onClose={() => setToggleConfirm(null)}
        onConfirm={confirmToggle}
        title={toggleConfirm?.isActive ? 'Deactivate Test' : 'Activate Test'}
        message={
          toggleConfirm
            ? `Are you sure you want to ${toggleConfirm.isActive ? 'deactivate' : 'activate'} "${toggleConfirm.testName}"? ${toggleConfirm.isActive ? 'It will no longer appear in booking selections.' : 'It will be available for new bookings.'}`
            : ''
        }
        confirmText={toggleConfirm?.isActive ? 'Deactivate' : 'Activate'}
      />
    </div>
  );
}
