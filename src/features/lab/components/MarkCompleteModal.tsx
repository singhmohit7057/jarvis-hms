
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface MarkCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preparedBy: string) => void;
  isLoading?: boolean;
}

export function MarkCompleteModal({ isOpen, onClose, onConfirm, isLoading }: MarkCompleteModalProps) {
  const [preparedBy, setPreparedBy] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!preparedBy.trim()) {
      setError('This field is required');
      return;
    }
    setError('');
    onConfirm(preparedBy.trim());
  };

  const handleClose = () => {
    setPreparedBy('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Mark Report Complete" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All parameter values will be finalized. Please confirm who prepared this report.
        </p>

        <Input
          label="Report Prepared By"
          placeholder="Enter staff / lab technician name"
          value={preparedBy}
          onChange={(e) => {
            setPreparedBy(e.target.value);
            if (e.target.value.trim()) setError('');
          }}
          error={error}
          autoFocus
        />

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleConfirm} isLoading={isLoading}>
            Confirm & Complete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
