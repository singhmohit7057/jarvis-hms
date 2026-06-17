
import { useState, useCallback, useEffect } from 'react';
import { Search, Package, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/forms/FormField';
import { DatePickerField } from '@/components/forms/DatePickerField';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useInventory } from '../hooks/useInventory';
import { medicineBatchSchema, type MedicineBatchFormData } from '../schemas/medicine.schema';
import type { MedicineWithBatches } from '../hooks/useInventory';

export function AddStockPage() {
  const navigate = useNavigate();
  const { addBatch } = useInventory();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MedicineWithBatches[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<MedicineWithBatches | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset } = useForm<MedicineBatchFormData>({
    resolver: zodResolver(medicineBatchSchema),
    defaultValues: {
      batchNumber: '',
      expiryDate: '',
      mrp: '' as unknown as number,
      purchasePrice: '' as unknown as number,
      quantityInStock: '' as unknown as number,
    },
  });

  const searchMedicines = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setIsSearching(true);
    try {
      const term = `%${q.trim()}%`;
      const { data, error } = await supabase
        .from('medicines')
        .select('*, batches:medicine_batches(*)')
        .eq('is_active', true)
        .or(`name.ilike.${term},generic_name.ilike.${term},company.ilike.${term}`)
        .order('name', { ascending: true })
        .limit(20);
      if (error) throw error;
      const mapped: MedicineWithBatches[] = (data ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        genericName: item.generic_name ?? '',
        company: item.company ?? '',
        category: item.category,
        composition: item.composition ?? '',
        hsnCode: item.hsn_code ?? '',
        gstPercentage: item.gst_percentage,
        packSize: item.pack_size ?? 1,
        looseSell: item.loose_sell ?? false,
        reorderLevel: item.reorder_level ?? 0,
        rackLocation: item.rack_location ?? '',
        isActive: item.is_active,
        createdAt: item.created_at,
        batches: (item.batches ?? []).map((b: Record<string, unknown>) => ({
          id: b.id as string,
          medicineId: b.medicine_id as string,
          batchNumber: b.batch_number as string,
          expiryDate: b.expiry_date as string,
          mrp: b.mrp as number,
          purchasePrice: b.purchase_price as number,
          sellingPrice: b.selling_price as number,
          quantityInStock: b.quantity_in_stock as number,
          createdAt: b.created_at as string,
        })),
      }));
      setResults(mapped);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchMedicines(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchMedicines]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMedicines(query);
  };

  const handleSelect = (medicine: MedicineWithBatches) => {
    setSelected(medicine);
    reset({
      batchNumber: '',
      expiryDate: '',
      mrp: '' as unknown as number,
      purchasePrice: '' as unknown as number,
      quantityInStock: '' as unknown as number,
    });
  };

  const onFormSubmit = async (data: MedicineBatchFormData) => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await addBatch(selected.id, data);
      toast.success(`Stock added for ${selected.name}`);
      reset({
        batchNumber: '',
        expiryDate: '',
        mrp: '' as unknown as number,
        purchasePrice: '' as unknown as number,
        quantityInStock: '' as unknown as number,
      });
    } catch (err) {
      const message = (err as { message?: string })?.message || 'Failed to add stock';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Stock"
        subtitle="Search a medicine and add a new batch to inventory"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Search */}
        <Card title="Search Medicine">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, generic, or company..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <Button type="submit" size="sm">Search</Button>
          </form>

          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {isSearching && (
              <div className="flex justify-center py-8"><Spinner size="md" /></div>
            )}
            {!isSearching && results.length === 0 && query && (
              <div className="flex flex-col items-center py-8 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">No medicines found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">"{query}" is not in the database</p>
                </div>
                <button
                  onClick={() => navigate(ROUTES.PHARMACY_ADD_MEDICINE)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-200 dark:border-blue-800"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add "{query}" as new medicine
                </button>
              </div>
            )}
            {!isSearching && results.length === 0 && !query && (
              <EmptyState icon={Search} title="Search for a medicine" description="Enter a name or company to find medicines" />
            )}
            {!isSearching && results.map((med) => {
              const totalStock = med.batches.reduce((s, b) => s + b.quantityInStock, 0);
              const isSelected = selected?.id === med.id;
              return (
                <button
                  key={med.id}
                  onClick={() => handleSelect(med)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{med.name}</p>
                      {med.company && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{med.company}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="info" size="sm">{med.category}</Badge>
                      <Badge variant={totalStock === 0 ? 'danger' : 'success'} size="sm">
                        Stock: {totalStock}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right — Batch Form */}
        <Card title={selected ? `Add Batch — ${selected.name}` : 'Batch Details'}>
          {!selected ? (
            <EmptyState
              icon={Package}
              title="Select a medicine"
              description="Choose a medicine from the search results to add stock"
            />
          ) : (
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">{selected.name}</p>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-0.5">
                  {selected.company} &middot; GST {selected.gstPercentage}%
                  {selected.packSize > 1 ? ` · Pack of ${selected.packSize} pcs · Enter strips, stored as pieces` : ' · Enter units'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="batchNumber"
                  label="Batch Number *"
                  placeholder="e.g., BTH-2024-001"
                />
                <Controller
                  control={control}
                  name="expiryDate"
                  render={({ field, fieldState: { error } }) => (
                    <DatePickerField
                      label="Expiry Date *"
                      selected={field.value ? new Date(field.value) : null}
                      onChange={(date) => {
                        if (date) {
                          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                          field.onChange(lastDay.toISOString().split('T')[0]);
                        } else {
                          field.onChange('');
                        }
                      }}
                      minDate={new Date()}
                      dateFormat="MM/yyyy"
                      showMonthYearPicker
                      placeholder="MM/YYYY"
                      portalId="datepicker-portal"
                      error={error?.message}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name="mrp"
                  label="MRP *"
                  type="number"
                  placeholder="0.00"
                />
                <FormField
                  control={control}
                  name="purchasePrice"
                  label="Purchase Price"
                  type="number"
                  placeholder="0.00"
                />
                <FormField
                  control={control}
                  name="quantityInStock"
                  label={`Quantity (strips/packs) *`}
                  type="number"
                  placeholder="e.g., 10"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" isLoading={isSubmitting}>
                  Add Batch
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
