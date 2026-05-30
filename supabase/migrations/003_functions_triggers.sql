-- #must: Create sequential ID generators, stock decrement trigger, and updated_at trigger

-- ============================================================================
-- SEQUENTIAL ID GENERATORS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Patient ID: PAT-0001, PAT-0002, ... (global sequence, never resets)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id FROM 5) AS INTEGER)), 0) + 1
  INTO next_num FROM public.patients;
  NEW.patient_id := 'PAT-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_patient_id
  BEFORE INSERT ON public.patients
  FOR EACH ROW
  WHEN (NEW.patient_id IS NULL)
  EXECUTE FUNCTION public.generate_patient_id();

-- ---------------------------------------------------------------------------
-- Invoice Number: INV-YYYYMMDD-NNNN (resets daily)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  today_str TEXT;
  next_num INTEGER;
BEGIN
  today_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD');
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(invoice_number FROM 14) AS INTEGER)), 0
  ) + 1
  INTO next_num
  FROM public.sales
  WHERE invoice_number LIKE 'INV-' || today_str || '-%';
  NEW.invoice_number := 'INV-' || today_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_invoice_number
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION public.generate_invoice_number();

-- ---------------------------------------------------------------------------
-- Appointment Number: APT-YYYYMMDD-NNNN (resets daily)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_appointment_no()
RETURNS TRIGGER AS $$
DECLARE
  today_str TEXT;
  next_num INTEGER;
BEGIN
  today_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD');
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(appointment_no FROM 14) AS INTEGER)), 0
  ) + 1
  INTO next_num
  FROM public.appointments
  WHERE appointment_no LIKE 'APT-' || today_str || '-%';
  NEW.appointment_no := 'APT-' || today_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_appointment_no
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  WHEN (NEW.appointment_no IS NULL)
  EXECUTE FUNCTION public.generate_appointment_no();

-- ---------------------------------------------------------------------------
-- Prescription Number: RX-YYYYMMDD-NNNN (resets daily)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_prescription_no()
RETURNS TRIGGER AS $$
DECLARE
  today_str TEXT;
  next_num INTEGER;
BEGIN
  today_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD');
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(prescription_no FROM 13) AS INTEGER)), 0
  ) + 1
  INTO next_num
  FROM public.prescriptions
  WHERE prescription_no LIKE 'RX-' || today_str || '-%';
  NEW.prescription_no := 'RX-' || today_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_prescription_no
  BEFORE INSERT ON public.prescriptions
  FOR EACH ROW
  WHEN (NEW.prescription_no IS NULL)
  EXECUTE FUNCTION public.generate_prescription_no();

-- ---------------------------------------------------------------------------
-- Lab Booking Number: LAB-YYYYMMDD-NNNN (resets daily)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS TRIGGER AS $$
DECLARE
  today_str TEXT;
  next_num INTEGER;
BEGIN
  today_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD');
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(booking_number FROM 14) AS INTEGER)), 0
  ) + 1
  INTO next_num
  FROM public.lab_bookings
  WHERE booking_number LIKE 'LAB-' || today_str || '-%';
  NEW.booking_number := 'LAB-' || today_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_booking_number
  BEFORE INSERT ON public.lab_bookings
  FOR EACH ROW
  WHEN (NEW.booking_number IS NULL)
  EXECUTE FUNCTION public.generate_booking_number();

-- ---------------------------------------------------------------------------
-- Lab Report Number: RPT-YYYYMMDD-NNNN (resets daily)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_report_number()
RETURNS TRIGGER AS $$
DECLARE
  today_str TEXT;
  next_num INTEGER;
BEGIN
  today_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD');
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(report_number FROM 14) AS INTEGER)), 0
  ) + 1
  INTO next_num
  FROM public.lab_reports
  WHERE report_number LIKE 'RPT-' || today_str || '-%';
  NEW.report_number := 'RPT-' || today_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_report_number
  BEFORE INSERT ON public.lab_reports
  FOR EACH ROW
  WHEN (NEW.report_number IS NULL)
  EXECUTE FUNCTION public.generate_report_number();

-- ============================================================================
-- STOCK DECREMENT TRIGGER
-- After inserting a sale_item, reduce the batch's quantity_in_stock.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.decrement_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_id IS NOT NULL THEN
    UPDATE public.medicine_batches
    SET quantity_in_stock = quantity_in_stock - NEW.quantity
    WHERE id = NEW.batch_id;

    -- Raise an error if stock goes negative
    IF (SELECT quantity_in_stock FROM public.medicine_batches WHERE id = NEW.batch_id) < 0 THEN
      RAISE EXCEPTION 'Insufficient stock for batch %', NEW.batch_number;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_stock
  AFTER INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_stock_on_sale();

-- ============================================================================
-- AUTO-CREATE PROFILE ON NEW AUTH USER
-- When a user is invited via Supabase Auth, create a matching public.profiles row.
-- The role defaults to 'receptionist' and can be updated from User Management.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'receptionist'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- UPDATED_AT TRIGGER FOR CLINIC SETTINGS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_clinic_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinic_settings_updated_at
  BEFORE UPDATE ON public.clinic_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clinic_settings_timestamp();
