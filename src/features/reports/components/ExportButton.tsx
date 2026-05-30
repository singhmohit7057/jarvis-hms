// #must: Export dropdown — Excel, CSV, and Print actions for report data

import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';

export interface ExportColumn {
  header: string;
  key: string;
}

export interface ExportButtonProps {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  filename: string;
}

function exportExcel(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string
): void {
  const ws = XLSX.utils.json_to_sheet(
    data.map((row) =>
      columns.reduce<Record<string, unknown>>(
        (acc, col) => ({ ...acc, [col.header]: row[col.key] }),
        {}
      )
    )
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportCSV(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string
): void {
  const headers = columns.map((c) => c.header).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key];
        const str = val === null || val === undefined ? '' : String(val);
        // Wrap in quotes if contains comma, newline, or quote
        return str.includes(',') || str.includes('\n') || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(',')
  );
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function printTable(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string
): void {
  const headerRow = columns.map((c) => `<th style="padding:6px 12px;border:1px solid #ddd;background:#f3f4f6;text-align:left;font-size:12px;">${c.header}</th>`).join('');
  const bodyRows = data
    .map(
      (row) =>
        `<tr>${columns
          .map(
            (col) =>
              `<td style="padding:6px 12px;border:1px solid #ddd;font-size:12px;">${
                row[col.key] === null || row[col.key] === undefined ? '' : String(row[col.key])
              }</td>`
          )
          .join('')}</tr>`
    )
    .join('');

  const html = `<!DOCTYPE html><html><head><title>${filename}</title><style>body{font-family:sans-serif;margin:20px;}h2{margin-bottom:12px;}table{border-collapse:collapse;width:100%;}@media print{body{margin:0;}}</style></head><body><h2>${filename}</h2><table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }
}

export function ExportButton({ data, columns, filename }: ExportButtonProps) {
  const items = [
    {
      label: 'Export Excel (.xlsx)',
      icon: FileSpreadsheet,
      onClick: () => exportExcel(data, columns, filename),
    },
    {
      label: 'Export CSV (.csv)',
      icon: FileText,
      onClick: () => exportCSV(data, columns, filename),
    },
    {
      label: 'Print',
      icon: Printer,
      onClick: () => printTable(data, columns, filename),
    },
  ];

  return (
    <Dropdown
      trigger={
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="h-3.5 w-3.5" />}
          rightIcon={<span className="text-gray-400">▾</span>}
        >
          Export
        </Button>
      }
      items={items}
      align="right"
    />
  );
}
