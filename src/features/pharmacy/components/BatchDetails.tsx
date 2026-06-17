
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import type { MedicineBatch } from '@/types';
import { ArrowDownCircle, ArrowUpCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface BatchDetailsProps {
  medicineId: string;
  packSize?: number;
  looseSell?: boolean;
  category?: string;
}

const ML_CATS = new Set(['Syrup', 'Drops', 'Injection', 'Inhaler']);

function fmtQty(qty: number, packSize: number, looseSell: boolean, category: string): string {
  const ps = Math.max(packSize, 1);
  const isLiquid = ML_CATS.has(category);

  if (looseSell && ps > 1) {
    const strips = Math.floor(qty / ps);
    const rem = qty % ps;
    const stripLabel = isLiquid ? 'bottles' : 'strips';
    const pieceLabel = isLiquid ? 'ml' : 'pcs';
    if (strips > 0 && rem > 0) return `${strips} ${stripLabel} + ${rem} ${pieceLabel} (${qty} ${pieceLabel} total)`;
    if (strips > 0) return `${strips} ${stripLabel} (${qty} ${pieceLabel})`;
    return `${qty} ${pieceLabel}`;
  }
  if (!looseSell && ps > 1) {
    const unit = isLiquid ? `bottle${qty !== 1 ? 's' : ''}` : `strip${qty !== 1 ? 's' : ''}`;
    const detail = isLiquid ? `${qty * ps} ml` : `${qty * ps} pcs`;
    return `${qty} ${unit} · ${detail}`;
  }
  return `${qty} ${isLiquid ? 'ml' : 'pcs'}`;
}

interface TxRow {
  date: string;
  type: 'added' | 'sold';
  batchNumber: string;
  quantity: number;
  invoiceNumber?: string;
}

export function BatchDetails({ medicineId, packSize = 1, looseSell = false, category = '' }: BatchDetailsProps) {
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [{ data: bData }, { data: sData }] = await Promise.all([
          supabase
            .from('medicine_batches')
            .select('*')
            .eq('medicine_id', medicineId)
            .order('expiry_date', { ascending: true }),
          supabase
            .from('sale_items')
            .select('quantity, batch_number, created_at, sales(invoice_number, created_at)')
            .eq('medicine_id', medicineId)
            .order('created_at', { ascending: false })
            .limit(100),
        ]);

        const mapped: MedicineBatch[] = (bData ?? []).map((b) => ({
          id: b.id,
          medicineId: b.medicine_id,
          batchNumber: b.batch_number,
          expiryDate: b.expiry_date,
          mrp: b.mrp,
          purchasePrice: b.purchase_price,
          sellingPrice: b.selling_price,
          quantityInStock: b.quantity_in_stock,
          createdAt: b.created_at,
        }));

        // Stock additions: original qty = current stock + all pieces sold from that batch
        const soldPerBatch = new Map<string, number>();
        (sData ?? []).forEach((s) => {
          const bn = s.batch_number ?? '';
          soldPerBatch.set(bn, (soldPerBatch.get(bn) ?? 0) + s.quantity);
        });

        const addedRows: TxRow[] = mapped.map((b) => ({
          date: b.createdAt,
          type: 'added',
          batchNumber: b.batchNumber,
          quantity: b.quantityInStock + (soldPerBatch.get(b.batchNumber) ?? 0),
        }));

        // Sales
        const soldRows: TxRow[] = (sData ?? []).map((s) => {
          const sale = Array.isArray(s.sales) ? s.sales[0] : s.sales;
          return {
            date: sale?.created_at ?? '',
            type: 'sold',
            batchNumber: s.batch_number ?? '',
            quantity: s.quantity,
            invoiceNumber: sale?.invoice_number ?? '',
          };
        });

        const allTx = [...addedRows, ...soldRows].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setBatches(mapped);
        setTransactions(allTx);
      } catch {
        setBatches([]);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [medicineId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
        No batches found for this medicine.
      </p>
    );
  }

  const totalAdded = transactions.filter((t) => t.type === 'added').reduce((s, t) => s + t.quantity, 0);
  const totalSold  = transactions.filter((t) => t.type === 'sold').reduce((s, t) => s + t.quantity, 0);
  const totalStock = batches.reduce((s, b) => s + b.quantityInStock, 0);
  const fmt = (qty: number) => fmtQty(qty, packSize, looseSell, category);

  return (
    <div className="space-y-4">
      {/* ── Summary chips ──────────────────────────────────────────────────── */}
      <div className="flex gap-3 text-sm">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium">
          <ArrowDownCircle className="h-3.5 w-3.5" />
          Added: {fmt(totalAdded)}
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium">
          <ArrowUpCircle className="h-3.5 w-3.5" />
          Sold: {fmt(totalSold)}
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium">
          In Stock: {fmt(totalStock)}
        </span>
      </div>

      {/* ── Batch table ────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-600">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700/50">
            <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
              <th className="text-left py-2 px-3 w-6"></th>
              <th className="text-left py-2 px-3">Batch #</th>
              <th className="text-left py-2 px-3">Expiry</th>
              <th className="text-right py-2 px-3">MRP</th>
              <th className="text-right py-2 px-3">Purchase</th>
              <th className="text-right py-2 px-3">Stock</th>
              <th className="text-left py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-600">
            {batches.map((batch) => {
              const isExpired   = new Date(batch.expiryDate) < new Date();
              const isLowStock  = batch.quantityInStock > 0 && batch.quantityInStock <= 10;
              const isOutOfStock = batch.quantityInStock === 0;
              const batchTx     = transactions.filter((t) => t.batchNumber === batch.batchNumber);
              const isExpanded  = expandedBatch === batch.id;

              return (
                <React.Fragment key={batch.id}>
                  <tr
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer"
                    onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                  >
                    <td className="py-2 px-3 text-gray-400">
                      {isExpanded
                        ? <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronRight className="h-3.5 w-3.5" />}
                    </td>
                    <td className="py-2 px-3 font-mono text-xs">{batch.batchNumber}</td>
                    <td className="py-2 px-3">{formatDate(batch.expiryDate)}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(batch.mrp)}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(batch.purchasePrice)}</td>
                    <td className="py-2 px-3 text-right font-medium">{fmt(batch.quantityInStock)}</td>
                    <td className="py-2 px-3">
                      {isExpired ? (
                        <Badge variant="danger" size="sm">Expired</Badge>
                      ) : isOutOfStock ? (
                        <Badge variant="danger" size="sm">Out of Stock</Badge>
                      ) : isLowStock ? (
                        <Badge variant="warning" size="sm">Low Stock</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Available</Badge>
                      )}
                    </td>
                  </tr>

                  {/* ── Per-batch transaction history ── */}
                  {isExpanded && (
                    <tr className="bg-gray-50/60 dark:bg-slate-800/40">
                      <td colSpan={7} className="px-6 py-3">
                        {batchTx.length === 0 ? (
                          <p className="text-xs text-gray-400">No transactions recorded.</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-400 uppercase">
                                <th className="text-left pb-1 pr-4">Date & Time</th>
                                <th className="text-left pb-1 pr-4">Type</th>
                                <th className="text-right pb-1 pr-4">Qty</th>
                                <th className="text-left pb-1">Invoice</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                              {batchTx.map((tx, i) => (
                                <tr key={i} className="text-gray-600 dark:text-gray-400">
                                  <td className="py-1 pr-4">{tx.date ? formatDateTime(tx.date) : '—'}</td>
                                  <td className="py-1 pr-4">
                                    {tx.type === 'added' ? (
                                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                        <ArrowDownCircle className="h-3 w-3" /> Added
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                                        <ArrowUpCircle className="h-3 w-3" /> Sold
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-1 pr-4 text-right font-medium">{fmt(tx.quantity)}</td>
                                  <td className="py-1 font-mono">{tx.invoiceNumber || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
