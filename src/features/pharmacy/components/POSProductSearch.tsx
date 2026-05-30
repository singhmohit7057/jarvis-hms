// #must: Left-side medicine search panel for POS with debounced search and batch cards
import { useState, useEffect, useCallback } from 'react';
import { Search, Package, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Medicine, MedicineBatch } from '@/types';
import { useCart } from '../hooks/useCart';

interface MedicineSearchResult extends Medicine {
  batches: MedicineBatch[];
}

export function POSProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MedicineSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const searchMedicines = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchTerm = `%${searchQuery.trim()}%`;
      const { data, error } = await supabase
        .from('medicines')
        .select(`
          *,
          batches:medicine_batches(*)
        `)
        .eq('is_active', true)
        .or(`name.ilike.${searchTerm},generic_name.ilike.${searchTerm},company.ilike.${searchTerm}`)
        .order('name', { ascending: true })
        .limit(20);

      if (error) throw error;

      const mapped: MedicineSearchResult[] = (data ?? [])
        .map((item) => ({
          id: item.id,
          name: item.name,
          genericName: item.generic_name ?? '',
          company: item.company ?? '',
          category: item.category,
          composition: item.composition ?? '',
          hsnCode: item.hsn_code,
          gstPercentage: item.gst_percentage,
          unit: item.unit ?? 'Strip',
          isActive: item.is_active,
          createdAt: item.created_at,
          batches: (item.batches ?? [])
            .filter((b: Record<string, unknown>) => (b.quantity_in_stock as number) > 0)
            .map((batch: Record<string, unknown>) => ({
              id: batch.id as string,
              medicineId: batch.medicine_id as string,
              batchNumber: batch.batch_number as string,
              expiryDate: batch.expiry_date as string,
              mrp: batch.mrp as number,
              purchasePrice: batch.purchase_price as number,
              sellingPrice: batch.selling_price as number,
              quantityInStock: batch.quantity_in_stock as number,
              createdAt: batch.created_at as string,
            })),
        }))
        .filter((med) => med.batches.length > 0);

      setResults(mapped);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMedicines(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchMedicines]);

  const handleAddToCart = (medicine: MedicineSearchResult, batch: MedicineBatch) => {
    addItem(medicine, batch);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medicines by name, generic name, or company..."
          className={cn(
            'w-full pl-12 pr-4 py-3 text-base rounded-xl border',
            'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100 dark:placeholder:text-gray-500'
          )}
          autoFocus
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {!isSearching && !query && (
          <EmptyState
            icon={Search}
            title="Search for medicines"
            description="Type a medicine name, generic name, or company to find available stock"
          />
        )}

        {!isSearching && query && results.length === 0 && (
          <EmptyState
            icon={Package}
            title="No medicines found"
            description="Try a different search term or check spelling"
          />
        )}

        {!isSearching &&
          results.map((medicine) => (
            <div
              key={medicine.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{medicine.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {medicine.company} {medicine.genericName ? `| ${medicine.genericName}` : ''}
                  </p>
                </div>
                <Badge variant="info">{medicine.gstPercentage}% GST</Badge>
              </div>

              {/* Batches */}
              <div className="space-y-2 mt-3">
                {medicine.batches.map((batch) => {
                  const isExpired = new Date(batch.expiryDate) < new Date();
                  return (
                    <div
                      key={batch.id}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-md',
                        'bg-gray-50 dark:bg-slate-700/50',
                        isExpired && 'opacity-50'
                      )}
                    >
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-mono text-gray-600 dark:text-gray-300">
                          {batch.batchNumber}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          Exp: {formatDate(batch.expiryDate)}
                        </span>
                        <Badge variant={batch.quantityInStock <= 10 ? 'warning' : 'success'} size="sm">
                          Stock: {batch.quantityInStock}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          {formatCurrency(batch.sellingPrice)}
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isExpired}
                          onClick={() => handleAddToCart(medicine, batch)}
                          leftIcon={<Plus className="h-3.5 w-3.5" />}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
