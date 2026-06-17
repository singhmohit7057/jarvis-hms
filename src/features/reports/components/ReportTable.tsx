import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data/DataTable';
import { ExportButton } from './ExportButton';
import type { ExportColumn } from './ExportButton';

export interface SummaryItem {
  label: string;
  value: string;
}

export interface ReportTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  title: string;
  filename: string;
  /** Columns definition for export — maps column headers to data keys */
  exportColumns?: ExportColumn[];
  showExport?: boolean;
  showPrint?: boolean;
  summary?: SummaryItem[];
  isLoading?: boolean;
  searchable?: boolean;
}

export function ReportTable<T extends Record<string, unknown>>({
  columns,
  data,
  title,
  filename,
  exportColumns,
  showExport = true,
  summary,
  isLoading = false,
  searchable = false,
}: ReportTableProps<T>) {
  const exportCols: ExportColumn[] = exportColumns ?? [];
  const exportData = data as Record<string, unknown>[];
  const canExport = showExport && exportCols.length > 0;

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {canExport && (
          <ExportButton data={exportData} columns={exportCols} filename={filename} />
        )}
      </div>

      {/* Table */}
      <div className="p-4">
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchable={searchable}
          pagination
          pageSize={15}
          emptyMessage="No data available for selected period"
        />
      </div>

      {/* Summary footer */}
      {summary && summary.length > 0 && !isLoading && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 rounded-b-xl">
          <div className="flex flex-wrap gap-6">
            {summary.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
