// #must: Sales history page with date range filter, data table, and invoice detail modal
import { useState, useEffect, useCallback } from 'react';
import { Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/data/DataTable';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { generateInvoicePDF } from '@/lib/pdf/invoice.pdf';
import type { Sale, SaleItem } from '@/types';

interface SaleRow extends Sale {
  itemsCount: number;
}

export function SalesHistoryPage() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSale, setSelectedSale] = useState<(Sale & { items: SaleItem[] }) | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('sales')
        .select('*, sale_items(count)')
        .order('created_at', { ascending: false });

      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00`);
      }
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: SaleRow[] = (data ?? []).map((row) => ({
        id: row.id,
        invoiceNumber: row.invoice_number,
        patientId: row.patient_id ?? undefined,
        customerName: row.customer_name,
        customerPhone: row.customer_phone ?? '',
        items: [],
        subtotal: row.subtotal,
        discountType: row.discount_type,
        discountValue: row.discount_value,
        discountAmount: row.discount_amount,
        gstTotal: row.gst_total,
        grandTotal: row.grand_total,
        paymentMethod: row.payment_method,
        paidAmount: row.paid_amount,
        changeAmount: row.change_amount,
        billedBy: row.billed_by,
        createdAt: row.created_at,
        itemsCount: row.sale_items?.[0]?.count ?? 0,
      }));

      setSales(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sales';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleViewDetails = async (sale: SaleRow) => {
    setIsDetailLoading(true);
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', sale.id);

      if (error) throw error;

      const items: SaleItem[] = (data ?? []).map((item) => ({
        id: item.id,
        saleId: item.sale_id,
        medicineId: item.medicine_id,
        batchId: item.batch_id,
        medicineName: item.medicine_name,
        hsnCode: item.hsn_code,
        batchNumber: item.batch_number,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        gstPercentage: item.gst_percentage,
        gstAmount: item.gst_amount,
        totalPrice: item.total_price,
      }));

      setSelectedSale({ ...sale, items });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sale details';
      toast.error(message);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleDownloadPDF = (sale: Sale & { items: SaleItem[] }) => {
    try {
      const pdf = generateInvoicePDF(sale);
      pdf.save(`${sale.invoiceNumber}.pdf`);
      toast.success('Invoice PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const columns: ColumnDef<SaleRow, unknown>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.invoiceNumber}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
    },
    {
      id: 'itemsCount',
      header: 'Items',
      cell: ({ row }) => row.original.itemsCount,
    },
    {
      accessorKey: 'subtotal',
      header: 'Subtotal',
      cell: ({ row }) => formatCurrency(row.original.subtotal),
    },
    {
      accessorKey: 'gstTotal',
      header: 'GST',
      cell: ({ row }) => formatCurrency(row.original.gstTotal),
    },
    {
      accessorKey: 'grandTotal',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(row.original.grandTotal)}</span>
      ),
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Payment',
      cell: ({ row }) => (
        <Badge variant="info">{row.original.paymentMethod.toUpperCase()}</Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(row.original);
            }}
            leftIcon={<Eye className="h-3.5 w-3.5" />}
          >
            View
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sales History"
        subtitle="View and manage past sales and invoices"
      />

      {/* Date Range Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Sales Table */}
      <Card noPadding>
        <div className="p-4">
          <DataTable
            columns={columns}
            data={sales}
            isLoading={isLoading}
            searchable
            searchPlaceholder="Search by invoice or customer..."
            pagination
            pageSize={15}
            emptyMessage="No sales records found"
          />
        </div>
      </Card>

      {/* Sale Details Modal */}
      {(selectedSale || isDetailLoading) && (
        <Modal
          isOpen
          onClose={() => setSelectedSale(null)}
          title={selectedSale ? `Invoice: ${selectedSale.invoiceNumber}` : 'Loading...'}
          size="xl"
          footer={
            selectedSale && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedSale(null)}
                >
                  Close
                </Button>
                <Button
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => handleDownloadPDF(selectedSale)}
                >
                  Download PDF
                </Button>
              </>
            )
          }
        >
          {isDetailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : selectedSale ? (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Customer</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedSale.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDateTime(selectedSale.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedSale.paymentMethod.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedSale.customerPhone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b">
                      <th className="text-left py-2">Medicine</th>
                      <th className="text-left py-2">Batch</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Rate</th>
                      <th className="text-right py-2">GST%</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-600">
                    {selectedSale.items.map((item) => (
                      <tr key={item.id} className="text-gray-700 dark:text-gray-300">
                        <td className="py-2">{item.medicineName}</td>
                        <td className="py-2 font-mono text-xs">{item.batchNumber}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 text-right">{item.gstPercentage}%</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-slate-600">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">GST</span>
                  <span>{formatCurrency(selectedSale.gstTotal)}</span>
                </div>
                {selectedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedSale.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 dark:border-slate-600">
                  <span>Grand Total</span>
                  <span>{formatCurrency(selectedSale.grandTotal)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
}
