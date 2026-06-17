
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/formatters';
import { Edit, ToggleLeft, ToggleRight, ChevronDown, ChevronRight } from 'lucide-react';
import type { LabTest } from '@/types';

interface TestCatalogTableProps {
  tests: LabTest[];
  isLoading: boolean;
  onEdit: (test: LabTest) => void;
  onToggleActive: (test: LabTest) => void;
}

export function TestCatalogTable({
  tests,
  isLoading,
  onEdit,
  onToggleActive,
}: TestCatalogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const columns = useMemo<ColumnDef<LabTest, unknown>[]>(
    () => [
      {
        id: 'expand',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(row.original.id);
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            {expandedRows.has(row.original.id) ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        ),
        size: 40,
      },
      {
        accessorKey: 'testCode',
        header: 'Test Code',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
            {row.original.testCode}
          </span>
        ),
      },
      {
        accessorKey: 'testName',
        header: 'Test Name',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.testName}
          </span>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <Badge variant="default" size="sm">
            {row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: 'sampleType',
        header: 'Sample Type',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {row.original.sampleType}
          </span>
        ),
      },
      {
        accessorKey: 'parameters',
        header: 'Parameters',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.original.parameters.length}
          </span>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(row.original.price)}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'default'} size="sm">
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const test = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(test);
                }}
                title="Edit Test"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleActive(test);
                }}
                title={test.isActive ? 'Deactivate' : 'Activate'}
              >
                {test.isActive ? (
                  <ToggleRight className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          );
        },
      },
    ],
    [expandedRows, onEdit, onToggleActive]
  );

  return (
    <div>
      <DataTable
        columns={columns}
        data={tests}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search tests by name, code, category..."
        pagination
        pageSize={10}
        emptyMessage="No lab tests found"
      />

      {/* Expanded parameter details */}
      {tests
        .filter((t) => expandedRows.has(t.id))
        .map((test) => (
          <div
            key={`params-${test.id}`}
            className="mx-4 mb-4 p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700"
          >
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              {test.testName} - Parameters
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                    <th className="pb-2 pr-4">Parameter</th>
                    <th className="pb-2 pr-4">Unit</th>
                    <th className="pb-2">Normal Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {test.parameters.map((param, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 pr-4 text-gray-900 dark:text-gray-100">
                        {param.name}
                      </td>
                      <td className="py-1.5 pr-4 text-gray-600 dark:text-gray-400">
                        {param.unit}
                      </td>
                      <td className="py-1.5 text-gray-600 dark:text-gray-400">
                        {param.normalRange}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
}
