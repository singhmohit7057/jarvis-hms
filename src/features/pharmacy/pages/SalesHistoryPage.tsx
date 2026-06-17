
import { useState, useEffect, useCallback } from 'react';
import { Eye, Edit, Printer, Trash2 } from 'lucide-react';
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
import { DatePickerField } from '@/components/forms/DatePickerField';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { generateInvoicePDF, fetchClinicSettings } from '@/lib/pdf/invoice.pdf';
import type { Sale, SaleItem } from '@/types';

interface SaleRow extends Sale {
  itemsCount: number;
}

const PAYMENT_METHODS = ['cash', 'upi', 'card'] as const;

export function SalesHistoryPage() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // view state
  const [selectedSale, setSelectedSale] = useState<(Sale & { items: SaleItem[] }) | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // edit state
  const [editSale, setEditSale] = useState<SaleRow | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    doctorName: '',
    discountType: 'fixed' as 'fixed' | 'percentage',
    discountValue: 0,
    paymentMethod: 'cash' as 'cash' | 'upi' | 'card',
  });
  const [isEditSaving, setIsEditSaving] = useState(false);

  // print loading
  const [printingId, setPrintingId] = useState<string | null>(null);

  // delete state
  const [deleteTarget, setDeleteTarget] = useState<SaleRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('sales')
        .select('*, sale_items(count)')
        .order('created_at', { ascending: false });

      if (dateFrom) query = query.gte('created_at', new Date(dateFrom.setHours(0, 0, 0, 0)).toISOString());
      if (dateTo)   query = query.lte('created_at', new Date(dateTo.setHours(23, 59, 59, 999)).toISOString());

      const { data, error } = await query;
      if (error) throw error;

      const mapped: SaleRow[] = (data ?? []).map((row) => ({
        id: row.id,
        invoiceNumber: row.invoice_number,
        patientId: row.patient_id ?? undefined,
        customerName: row.customer_name,
        customerPhone: row.customer_phone ?? '',
        doctorName: row.doctor_name ?? '',
        items: [],
        subtotal: row.subtotal,
        discountType: row.discount_type ?? 'fixed',
        discountValue: row.discount_value ?? 0,
        discountAmount: row.discount_amount ?? 0,
        gstTotal: row.gst_total,
        grandTotal: row.grand_total,
        paymentMethod: row.payment_method,
        paidAmount: row.paid_amount,
        changeAmount: row.change_amount ?? 0,
        billedBy: row.billed_by,
        createdAt: row.created_at,
        itemsCount: row.sale_items?.[0]?.count ?? 0,
      }));

      setSales(mapped);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Failed to fetch sales';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  // ── fetch items helper ─────────────────────────────────────────────────────
  const fetchItems = async (saleId: string): Promise<SaleItem[]> => {
    const { data, error } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId);
    if (error) throw error;
    return (data ?? []).map((item) => ({
      id: item.id,
      saleId: item.sale_id,
      medicineId: item.medicine_id,
      batchId: item.batch_id,
      medicineName: item.medicine_name,
      hsnCode: item.hsn_code,
      batchNumber: item.batch_number,
      expiryDate: item.expiry_date ?? '',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      gstPercentage: item.gst_percentage,
      gstAmount: item.gst_amount,
      totalPrice: item.total_price,
    }));
  };

  // ── view ───────────────────────────────────────────────────────────────────
  const handleView = async (sale: SaleRow) => {
    setIsDetailLoading(true);
    try {
      const items = await fetchItems(sale.id);
      setSelectedSale({ ...sale, items });
    } catch {
      toast.error('Failed to fetch sale details');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // ── print ──────────────────────────────────────────────────────────────────
  const handlePrint = async (sale: SaleRow) => {
    setPrintingId(sale.id);
    try {
      const [items, clinic] = await Promise.all([fetchItems(sale.id), fetchClinicSettings()]);
      const pdf = generateInvoicePDF({ ...sale, items }, clinic);
      pdf.save(`${sale.invoiceNumber}.pdf`);
      toast.success('Invoice downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setPrintingId(null);
    }
  };

  // ── edit ───────────────────────────────────────────────────────────────────
  const handleEditOpen = (sale: SaleRow) => {
    setEditSale(sale);
    setEditForm({
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      doctorName: sale.doctorName ?? '',
      discountType: sale.discountType as 'fixed' | 'percentage',
      discountValue: sale.discountValue,
      paymentMethod: sale.paymentMethod as 'cash' | 'upi' | 'card',
    });
  };

  const handleEditSave = async () => {
    if (!editSale) return;
    setIsEditSaving(true);
    try {
      // GST is included in MRP — grand total = subtotal - discount, rounded to nearest rupee
      const discountAmount = editForm.discountType === 'percentage'
        ? Math.round(editSale.subtotal * editForm.discountValue / 100 * 100) / 100
        : Math.min(editForm.discountValue, editSale.subtotal);
      const grandTotal = Math.round(editSale.subtotal - discountAmount);

      const { error } = await supabase
        .from('sales')
        .update({
          customer_name:   editForm.customerName,
          customer_phone:  editForm.customerPhone,
          doctor_name:     editForm.doctorName,
          discount_type:   editForm.discountType,
          discount_value:  editForm.discountValue,
          discount_amount: discountAmount,
          grand_total:     grandTotal,
          payment_method:  editForm.paymentMethod,
        })
        .eq('id', editSale.id);

      if (error) throw error;
      toast.success('Bill updated');
      setEditSale(null);
      fetchSales();
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Failed to update bill';
      toast.error(msg);
    } finally {
      setIsEditSaving(false);
    }
  };

  // ── print from view modal ──────────────────────────────────────────────────
  const handleDownloadPDF = async (sale: Sale & { items: SaleItem[] }) => {
    try {
      const clinic = await fetchClinicSettings();
      const pdf = generateInvoicePDF(sale, clinic);
      pdf.save(`${sale.invoiceNumber}.pdf`);
      toast.success('Invoice PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('sales').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Sale deleted');
      setDeleteTarget(null);
      fetchSales();
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Failed to delete sale';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<SaleRow, unknown>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.invoiceNumber}</span>,
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
      cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.original.grandTotal)}</span>,
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Payment',
      cell: ({ row }) => <Badge variant="info">{row.original.paymentMethod.toUpperCase()}</Badge>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleView(row.original); }}
            leftIcon={<Eye className="h-3.5 w-3.5" />}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEditOpen(row.original); }}
            leftIcon={<Edit className="h-3.5 w-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isLoading={printingId === row.original.id}
            onClick={(e) => { e.stopPropagation(); handlePrint(row.original); }}
            leftIcon={<Printer className="h-3.5 w-3.5" />}
          >
            Print
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.original); }}
            leftIcon={<Trash2 className="h-3.5 w-3.5 text-red-500" />}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Delete
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Sales History" subtitle="View and manage past sales and invoices" />

      {/* Date Range Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-44">
            <DatePickerField
              label="From Date"
              selected={dateFrom}
              onChange={(d) => setDateFrom(d)}
              placeholder="dd/mm/yyyy"
              maxDate={dateTo ?? undefined}
            />
          </div>
          <div className="w-44">
            <DatePickerField
              label="To Date"
              selected={dateTo}
              onChange={(d) => setDateTo(d)}
              placeholder="dd/mm/yyyy"
              minDate={dateFrom ?? undefined}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setDateFrom(null); setDateTo(null); }}>
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

      {/* ── View Modal ──────────────────────────────────────────────────────── */}
      {(selectedSale || isDetailLoading) && (
        <Modal
          isOpen
          onClose={() => setSelectedSale(null)}
          title={selectedSale ? `Invoice: ${selectedSale.invoiceNumber}` : 'Loading...'}
          size="xl"
          footer={
            selectedSale && (
              <>
                <Button variant="secondary" onClick={() => setSelectedSale(null)}>Close</Button>
                <Button
                  leftIcon={<Printer className="h-4 w-4" />}
                  onClick={() => handleDownloadPDF(selectedSale)}
                >
                  Print / Download
                </Button>
              </>
            )
          }
        >
          {isDetailLoading ? (
            <div className="flex items-center justify-center py-8"><Spinner size="lg" /></div>
          ) : selectedSale ? (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 text-sm">
                {[
                  ['Patient',        selectedSale.customerName],
                  ['Phone',          selectedSale.customerPhone || '—'],
                  ['Doctor',         selectedSale.doctorName || '—'],
                  ['Date',           formatDateTime(selectedSale.createdAt)],
                  ['Payment',        selectedSale.paymentMethod.toUpperCase()],
                  ['Paid',           formatCurrency(selectedSale.paidAmount)],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{val}</p>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-slate-600">
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
              <div className="space-y-1.5 pt-3 border-t border-gray-200 dark:border-slate-600 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">GST</span>
                  <span>{formatCurrency(selectedSale.gstTotal)}</span>
                </div>
                {selectedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
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

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {editSale && (
        <Modal
          isOpen
          onClose={() => setEditSale(null)}
          title={`Edit Bill — ${editSale.invoiceNumber}`}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditSale(null)}>Cancel</Button>
              <Button isLoading={isEditSaving} onClick={handleEditSave}>Save Changes</Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Patient info */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Patient Info</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm(f => ({ ...f, customerName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact</label>
                    <input
                      type="text"
                      value={editForm.customerPhone}
                      onChange={(e) => setEditForm(f => ({ ...f, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor Name</label>
                    <input
                      type="text"
                      value={editForm.doctorName}
                      onChange={(e) => setEditForm(f => ({ ...f, doctorName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Discount */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Discount</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={editForm.discountType}
                    onChange={(e) => setEditForm(f => ({ ...f, discountType: e.target.value as 'fixed' | 'percentage' }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="fixed">Fixed (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Value {editForm.discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editForm.discountValue || ''}
                    onChange={(e) => setEditForm(f => ({ ...f, discountValue: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Payment Method</p>
              <div className="flex gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setEditForm(f => ({ ...f, paymentMethod: m }))}
                    className={`flex-1 py-2 text-sm rounded-lg border-2 font-medium capitalize transition-colors ${
                      editForm.paymentMethod === m
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary preview */}
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 text-sm space-y-1">
              {(() => {
                const disc = editForm.discountType === 'percentage'
                  ? Math.round((editSale.subtotal + editSale.gstTotal) * editForm.discountValue / 100 * 100) / 100
                  : Math.min(editForm.discountValue, editSale.subtotal + editSale.gstTotal);
                const grand = Math.round((editSale.subtotal + editSale.gstTotal - disc) * 100) / 100;
                return (
                  <>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Subtotal + GST</span>
                      <span>{formatCurrency(editSale.subtotal + editSale.gstTotal)}</span>
                    </div>
                    {disc > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Discount</span>
                        <span>-{formatCurrency(disc)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200 dark:border-slate-600">
                      <span>Grand Total</span>
                      <span>{formatCurrency(grand)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      {deleteTarget && (
        <Modal
          isOpen
          onClose={() => setDeleteTarget(null)}
          title="Delete Sale"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                variant="danger"
                isLoading={isDeleting}
                onClick={handleDeleteConfirm}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Delete
              </Button>
            </>
          }
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to delete invoice{' '}
              <span className="font-mono font-semibold">{deleteTarget.invoiceNumber}</span>?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This will permanently remove the sale record. This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
