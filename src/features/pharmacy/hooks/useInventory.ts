
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Medicine, MedicineBatch } from '@/types';
import type { MedicineFormData, MedicineBatchFormData } from '../schemas/medicine.schema';

export interface MedicineWithBatches extends Medicine {
  batches: MedicineBatch[];
}

interface UseInventoryReturn {
  medicines: MedicineWithBatches[];
  isLoading: boolean;
  error: string | null;
  fetchMedicines: () => Promise<void>;
  searchMedicines: (query: string) => Promise<void>;
  addMedicine: (data: MedicineFormData) => Promise<string>;
  updateMedicine: (id: string, data: Partial<MedicineFormData>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  addBatch: (medicineId: string, data: MedicineBatchFormData) => Promise<void>;
  updateBatch: (id: string, data: Partial<MedicineBatchFormData>) => Promise<void>;
  lowStock: (threshold?: number) => MedicineWithBatches[];
  expired: () => MedicineWithBatches[];
  nearExpiry: (days?: number) => MedicineWithBatches[];
}

export function useInventory(): UseInventoryReturn {
  const [medicines, setMedicines] = useState<MedicineWithBatches[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedicines = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('medicines')
        .select(`
          *,
          batches:medicine_batches(*)
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      const mapped: MedicineWithBatches[] = (data ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        genericName: item.generic_name ?? '',
        company: item.company ?? '',
        category: item.category,
        composition: item.composition ?? '',
        hsnCode: item.hsn_code,
        gstPercentage: item.gst_percentage,
        packSize: item.pack_size ?? 1,
        looseSell: item.loose_sell ?? false,
        reorderLevel: item.reorder_level ?? 0,
        rackLocation: item.rack_location ?? '',
        isActive: item.is_active,
        createdAt: item.created_at,
        batches: (item.batches ?? []).map((batch: Record<string, unknown>) => ({
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
      }));

      setMedicines(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch medicines';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchMedicines = useCallback(async (query: string) => {
    if (!query.trim()) {
      await fetchMedicines();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const searchTerm = `%${query.trim()}%`;

      const { data, error: searchError } = await supabase
        .from('medicines')
        .select(`
          *,
          batches:medicine_batches(*)
        `)
        .eq('is_active', true)
        .or(`name.ilike.${searchTerm},generic_name.ilike.${searchTerm},company.ilike.${searchTerm}`)
        .order('name', { ascending: true });

      if (searchError) throw searchError;

      const mapped: MedicineWithBatches[] = (data ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        genericName: item.generic_name ?? '',
        company: item.company ?? '',
        category: item.category,
        composition: item.composition ?? '',
        hsnCode: item.hsn_code,
        gstPercentage: item.gst_percentage,
        packSize: item.pack_size ?? 1,
        looseSell: item.loose_sell ?? false,
        reorderLevel: item.reorder_level ?? 0,
        rackLocation: item.rack_location ?? '',
        isActive: item.is_active,
        createdAt: item.created_at,
        batches: (item.batches ?? []).map((batch: Record<string, unknown>) => ({
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
      }));

      setMedicines(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchMedicines]);

  const addMedicine = useCallback(async (data: MedicineFormData): Promise<string> => {
    const { data: inserted, error: insertError } = await supabase
      .from('medicines')
      .insert({
        name: data.name,
        generic_name: data.genericName,
        company: data.company,
        category: data.category,
        composition: data.composition,
        pack_size: data.packSize,
        loose_sell: data.looseSell ?? false,
        reorder_level: data.reorderLevel,
        rack_location: data.rackLocation,
        hsn_code: data.hsnCode ?? '',
        gst_percentage: data.gstPercentage ?? 0,
        is_active: true,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    return inserted.id;
  }, []);

  const updateMedicine = useCallback(async (id: string, data: Partial<MedicineFormData>) => {
    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.genericName !== undefined) updatePayload.generic_name = data.genericName;
    if (data.company !== undefined) updatePayload.company = data.company;
    if (data.category !== undefined) updatePayload.category = data.category;
    if (data.composition !== undefined) updatePayload.composition = data.composition;
    if (data.packSize !== undefined) updatePayload.pack_size = data.packSize;
    if (data.looseSell !== undefined) updatePayload.loose_sell = data.looseSell;
    if (data.hsnCode !== undefined) updatePayload.hsn_code = data.hsnCode;
    if (data.gstPercentage !== undefined) updatePayload.gst_percentage = data.gstPercentage;
    if (data.reorderLevel !== undefined) updatePayload.reorder_level = data.reorderLevel;
    if (data.rackLocation !== undefined) updatePayload.rack_location = data.rackLocation;

    const { error: updateError } = await supabase
      .from('medicines')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) throw updateError;
  }, []);

  const deleteMedicine = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('medicines')
      .update({ is_active: false })
      .eq('id', id);

    if (deleteError) throw deleteError;
  }, []);

  const addBatch = useCallback(async (medicineId: string, data: MedicineBatchFormData) => {
    // looseSell → store pieces (strips × packSize); otherwise store units as entered
    const { data: med } = await supabase
      .from('medicines')
      .select('pack_size, loose_sell')
      .eq('id', medicineId)
      .single();
    const packSize = Math.max(med?.pack_size ?? 1, 1);
    const pieces = (med?.loose_sell ?? false)
      ? data.quantityInStock * packSize
      : data.quantityInStock;

    const { error: insertError } = await supabase
      .from('medicine_batches')
      .insert({
        medicine_id: medicineId,
        batch_number: data.batchNumber,
        expiry_date: data.expiryDate,
        mrp: data.mrp,
        purchase_price: data.purchasePrice,
        selling_price: data.mrp,
        quantity_in_stock: pieces,
      });

    if (!insertError) return;

    // Batch already exists — add to existing stock
    if (insertError.message.includes('duplicate key') || insertError.message.includes('unique constraint')) {
      const { data: existing, error: fetchError } = await supabase
        .from('medicine_batches')
        .select('id, quantity_in_stock')
        .eq('medicine_id', medicineId)
        .eq('batch_number', data.batchNumber)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('medicine_batches')
        .update({
          quantity_in_stock: existing.quantity_in_stock + pieces,
          mrp: data.mrp,
          purchase_price: data.purchasePrice,
          selling_price: data.mrp,
          expiry_date: data.expiryDate,
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      throw insertError;
    }
  }, []);

  const updateBatch = useCallback(async (id: string, data: Partial<MedicineBatchFormData>) => {
    const updatePayload: Record<string, unknown> = {};
    if (data.batchNumber !== undefined) updatePayload.batch_number = data.batchNumber;
    if (data.expiryDate !== undefined) updatePayload.expiry_date = data.expiryDate;
    if (data.mrp !== undefined) updatePayload.mrp = data.mrp;
    if (data.purchasePrice !== undefined) updatePayload.purchase_price = data.purchasePrice;
    if (data.quantityInStock !== undefined) updatePayload.quantity_in_stock = data.quantityInStock;

    const { error: updateError } = await supabase
      .from('medicine_batches')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) throw updateError;
  }, []);

  const lowStock = useCallback(
    (threshold?: number): MedicineWithBatches[] => {
      return medicines.filter((med) => {
        const totalStock = med.batches.reduce((sum, b) => sum + b.quantityInStock, 0);
        const limit = threshold ?? med.reorderLevel;
        return totalStock > 0 && totalStock <= limit;
      });
    },
    [medicines]
  );

  const expired = useCallback((): MedicineWithBatches[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return medicines.filter((med) =>
      med.batches.some((b) => new Date(b.expiryDate) < today && b.quantityInStock > 0)
    );
  }, [medicines]);

  const nearExpiry = useCallback(
    (days = 30): MedicineWithBatches[] => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threshold = new Date(today);
      threshold.setDate(threshold.getDate() + days);

      return medicines.filter((med) =>
        med.batches.some((b) => {
          const expDate = new Date(b.expiryDate);
          return expDate >= today && expDate <= threshold && b.quantityInStock > 0;
        })
      );
    },
    [medicines]
  );

  // Initial fetch
  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medicines' },
        () => {
          fetchMedicines();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medicine_batches' },
        () => {
          fetchMedicines();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMedicines]);

  return {
    medicines,
    isLoading,
    error,
    fetchMedicines,
    searchMedicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addBatch,
    updateBatch,
    lowStock,
    expired,
    nearExpiry,
  };
}
