
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReportParameterRow } from './ReportParameterRow';
import type { LabTest, LabBookingTest, LabResultEntry, LabReport } from '@/types';

interface ReportEntryFormProps {
  test: LabTest;
  bookingTest: LabBookingTest;
  onSave: (data: { results: LabResultEntry[]; interpretation: string }) => void;
  existingReport?: LabReport;
}

export function ReportEntryForm({
  test,
  bookingTest,
  onSave,
  existingReport,
}: ReportEntryFormProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [interpretation, setInterpretation] = useState(
    existingReport?.interpretation ?? ''
  );
  const [results, setResults] = useState<LabResultEntry[]>(() => {
    if (existingReport?.results) return existingReport.results;
    return test.parameters.map((p) => ({
      parameter: p.name,
      value: '',
      unit: p.unit,
      normalRange: p.normalRange,
      flag: 'normal' as const,
    }));
  });

  useEffect(() => {
    if (existingReport) {
      setResults(existingReport.results);
      setInterpretation(existingReport.interpretation ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingReport?.id]);

  const handleValueChange = (index: number, value: string) => {
    const updated = results.map((r, i) => i === index ? { ...r, value } : r);
    setResults(updated);
    onSave({ results: updated, interpretation });
  };

  const handleFlagChange = (index: number, newFlag: LabResultEntry['flag']) => {
    const updated = results.map((r, i) => i === index ? { ...r, flag: newFlag } : r);
    setResults(updated);
    onSave({ results: updated, interpretation });
  };

  const handleInterpretationChange = (val: string) => {
    setInterpretation(val);
    onSave({ results, interpretation: val });
  };

  const filledCount = results.filter((r) => r.value.trim() !== '').length;
  const totalParams = results.length;

  return (
    <div className="border rounded-lg border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-5 py-3.5',
          'bg-gray-50 dark:bg-slate-800/50',
          'hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors'
        )}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {bookingTest.testName}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({filledCount}/{totalParams} parameters filled)
          </span>
          {filledCount === totalParams && totalParams > 0 && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Complete
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="px-5 py-4">
          {/* Parameters table */}
          <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Parameter
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Value
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Unit
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Reference Range
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Flag
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
                {results.map((result, index) => (
                  <ReportParameterRow
                    key={result.parameter}
                    parameter={{
                      name: result.parameter,
                      unit: result.unit,
                      normalRange: result.normalRange,
                    }}
                    value={result.value}
                    onChange={(val) => handleValueChange(index, val)}
                    flag={result.flag}
                    onFlagChange={(f) => handleFlagChange(index, f)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Interpretation */}
          <div className="mt-4">
            <Textarea
              label="Interpretation / Comments"
              value={interpretation}
              onChange={(e) => handleInterpretationChange(e.target.value)}
              placeholder="Enter clinical interpretation or additional comments..."
              rows={3}
            />
          </div>

        </div>
      )}
    </div>
  );
}
