
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface CollectSampleModalProps {
  isOpen: boolean;
  bookingNumber: string;
  onClose: () => void;
  onConfirm: (collectorName: string, bottleNumber: string) => void;
  isLoading?: boolean;
}

export function CollectSampleModal({
  isOpen,
  bookingNumber,
  onClose,
  onConfirm,
  isLoading,
}: CollectSampleModalProps) {
  const [collectorName, setCollectorName] = useState('');
  const [bottleNumber, setBottleNumber] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!collectorName.trim()) {
      setError('Collector name is required');
      return;
    }
    setError('');
    onConfirm(collectorName.trim(), bottleNumber.trim());
  };

  const handleClose = () => {
    setCollectorName('');
    setBottleNumber('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Collect Sample" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mark sample collected for booking{' '}
          <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
            {bookingNumber}
          </span>
        </p>

        <Input
          label="Sample Collected By"
          placeholder="Enter staff name"
          value={collectorName}
          onChange={(e) => {
            setCollectorName(e.target.value);
            if (e.target.value.trim()) setError('');
          }}
          error={error}
          autoFocus
        />

        <Input
          label="Bottle / Tube Number (optional)"
          placeholder="e.g. A1, TUB-003"
          value={bottleNumber}
          onChange={(e) => setBottleNumber(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} isLoading={isLoading}>
            Confirm Collection
          </Button>
        </div>
      </div>
    </Modal>
  );
}
