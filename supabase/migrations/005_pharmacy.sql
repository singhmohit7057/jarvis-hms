-- Pharmacy feature additions: pack_size, loose_sell, doctor_name on invoice, expiry_date on sale items, complete_sale RPC

-- ============================================================================
-- MEDICINES
-- ============================================================================
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS pack_size INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS loose_sell BOOLEAN NOT NULL DEFAULT false;

-- Loose sell enabled by default for solid-dose categories
UPDATE public.medicines SET loose_sell = true WHERE category IN ('Tablet', 'Capsule', 'Strip', 'Other');

-- ============================================================================
-- SALES: doctor name for invoice display
-- ============================================================================
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- ============================================================================
-- SALE ITEMS: expiry date stored at sale time
-- ============================================================================
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- ============================================================================
-- complete_sale RPC — inserts sale + items in one transaction
-- Stock is decremented by trg_decrement_stock trigger on sale_items
-- ============================================================================
CREATE OR REPLACE FUNCTION public.complete_sale(
  p_sale  JSONB,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id        UUID;
  v_invoice_number TEXT;
  v_item           JSONB;
BEGIN
  INSERT INTO public.sales (
    invoice_number, patient_id, customer_name, customer_phone, doctor_name,
    subtotal, discount_type, discount_value, discount_amount,
    gst_total, grand_total, payment_method, paid_amount, change_amount, billed_by
  ) VALUES (
    p_sale->>'invoice_number',
    NULLIF(p_sale->>'patient_id', '')::UUID,
    COALESCE(NULLIF(p_sale->>'customer_name', ''), 'Walk-in Customer'),
    p_sale->>'customer_phone',
    NULLIF(p_sale->>'doctor_name', ''),
    (p_sale->>'subtotal')::DECIMAL,
    p_sale->>'discount_type',
    (p_sale->>'discount_value')::DECIMAL,
    (p_sale->>'discount_amount')::DECIMAL,
    (p_sale->>'gst_total')::DECIMAL,
    (p_sale->>'grand_total')::DECIMAL,
    p_sale->>'payment_method',
    (p_sale->>'paid_amount')::DECIMAL,
    (p_sale->>'change_amount')::DECIMAL,
    NULLIF(p_sale->>'billed_by', '')::UUID
  )
  RETURNING id, invoice_number INTO v_sale_id, v_invoice_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.sale_items (
      sale_id, medicine_id, batch_id, medicine_name, hsn_code,
      batch_number, expiry_date, quantity, unit_price,
      gst_percentage, gst_amount, total_price
    ) VALUES (
      v_sale_id,
      NULLIF(v_item->>'medicine_id', '')::UUID,
      NULLIF(v_item->>'batch_id',    '')::UUID,
      v_item->>'medicine_name',
      COALESCE(v_item->>'hsn_code', ''),
      v_item->>'batch_number',
      NULLIF(v_item->>'expiry_date', '')::DATE,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::DECIMAL,
      (v_item->>'gst_percentage')::DECIMAL,
      (v_item->>'gst_amount')::DECIMAL,
      (v_item->>'total_price')::DECIMAL
    );
  END LOOP;

  RETURN jsonb_build_object('id', v_sale_id, 'invoice_number', v_invoice_number);
END;
$$;
