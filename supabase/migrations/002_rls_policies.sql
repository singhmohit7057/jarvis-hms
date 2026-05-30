-- #must: Enable Row Level Security on all tables and create role-based access policies

-- ============================================================================
-- HELPER FUNCTION: get current user's role
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_booking_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- All authenticated can read active profiles.
-- Only super_admin can insert/update/delete.
-- ============================================================================
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "profiles_insert_super_admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'super_admin');

CREATE POLICY "profiles_update_super_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'super_admin')
  WITH CHECK (public.get_user_role() = 'super_admin');

CREATE POLICY "profiles_delete_super_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- Allow users to read their own profile even if inactive (for login flow)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ============================================================================
-- PATIENTS POLICIES
-- All authenticated can read.
-- super_admin, receptionist, doctor can insert.
-- super_admin, receptionist can update.
-- Only super_admin can delete.
-- ============================================================================
CREATE POLICY "patients_select_authenticated"
  ON public.patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "patients_insert_allowed_roles"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'receptionist', 'doctor'));

CREATE POLICY "patients_update_allowed_roles"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'receptionist'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'receptionist'));

CREATE POLICY "patients_delete_super_admin"
  ON public.patients FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- ============================================================================
-- DOCTORS POLICIES
-- All authenticated can read active doctors.
-- Only super_admin can manage.
-- ============================================================================
CREATE POLICY "doctors_select_authenticated"
  ON public.doctors FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "doctors_insert_super_admin"
  ON public.doctors FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'super_admin');

CREATE POLICY "doctors_update_super_admin"
  ON public.doctors FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'super_admin')
  WITH CHECK (public.get_user_role() = 'super_admin');

CREATE POLICY "doctors_delete_super_admin"
  ON public.doctors FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- ============================================================================
-- MEDICINES POLICIES
-- All authenticated can read.
-- super_admin, pharmacist can insert/update/delete.
-- ============================================================================
CREATE POLICY "medicines_select_authenticated"
  ON public.medicines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "medicines_insert_pharmacy"
  ON public.medicines FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'pharmacist'));

CREATE POLICY "medicines_update_pharmacy"
  ON public.medicines FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'pharmacist'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'pharmacist'));

CREATE POLICY "medicines_delete_pharmacy"
  ON public.medicines FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'pharmacist'));

-- ============================================================================
-- MEDICINE BATCHES POLICIES
-- All authenticated can read.
-- super_admin, pharmacist can insert/update/delete.
-- ============================================================================
CREATE POLICY "medicine_batches_select_authenticated"
  ON public.medicine_batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "medicine_batches_insert_pharmacy"
  ON public.medicine_batches FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'pharmacist'));

CREATE POLICY "medicine_batches_update_pharmacy"
  ON public.medicine_batches FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'pharmacist'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'pharmacist'));

CREATE POLICY "medicine_batches_delete_pharmacy"
  ON public.medicine_batches FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'pharmacist'));

-- ============================================================================
-- SALES POLICIES
-- super_admin, pharmacist can full CRUD.
-- Others can read their own (billed_by).
-- ============================================================================
CREATE POLICY "sales_select_pharmacy"
  ON public.sales FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('super_admin', 'pharmacist')
    OR billed_by = auth.uid()
  );

CREATE POLICY "sales_insert_pharmacy"
  ON public.sales FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'pharmacist'));

CREATE POLICY "sales_update_pharmacy"
  ON public.sales FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'pharmacist'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'pharmacist'));

CREATE POLICY "sales_delete_pharmacy"
  ON public.sales FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'pharmacist'));

-- ============================================================================
-- SALE ITEMS POLICIES
-- super_admin, pharmacist can full CRUD.
-- Others can read items of their own sales.
-- ============================================================================
CREATE POLICY "sale_items_select_pharmacy"
  ON public.sale_items FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('super_admin', 'pharmacist')
    OR sale_id IN (SELECT id FROM public.sales WHERE billed_by = auth.uid())
  );

CREATE POLICY "sale_items_insert_pharmacy"
  ON public.sale_items FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'pharmacist'));

CREATE POLICY "sale_items_update_pharmacy"
  ON public.sale_items FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'pharmacist'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'pharmacist'));

CREATE POLICY "sale_items_delete_pharmacy"
  ON public.sale_items FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'pharmacist'));

-- ============================================================================
-- APPOINTMENTS POLICIES
-- All authenticated can read.
-- super_admin, receptionist, doctor can insert.
-- Doctor can update own appointments (status changes).
-- super_admin can manage all.
-- ============================================================================
CREATE POLICY "appointments_select_authenticated"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "appointments_insert_allowed_roles"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'receptionist', 'doctor'));

CREATE POLICY "appointments_update_doctor_own"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() IN ('doctor', 'receptionist')
      AND (
        doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
        OR public.get_user_role() = 'receptionist'
      )
    )
  )
  WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() IN ('doctor', 'receptionist')
      AND (
        doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
        OR public.get_user_role() = 'receptionist'
      )
    )
  );

CREATE POLICY "appointments_delete_super_admin"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- ============================================================================
-- CONSULTATIONS POLICIES
-- Doctor can CRUD own consultations.
-- Others can read all.
-- ============================================================================
CREATE POLICY "consultations_select_authenticated"
  ON public.consultations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "consultations_insert_doctor"
  ON public.consultations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'doctor'
      AND doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "consultations_update_doctor"
  ON public.consultations FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'doctor'
      AND doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
    )
  )
  WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'doctor'
      AND doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "consultations_delete_doctor"
  ON public.consultations FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'doctor'
      AND doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
    )
  );

-- ============================================================================
-- PRESCRIPTIONS POLICIES
-- Doctor can CRUD own. Others can read all.
-- ============================================================================
CREATE POLICY "prescriptions_select_authenticated"
  ON public.prescriptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "prescriptions_insert_doctor"
  ON public.prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'doctor'
      AND doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "prescriptions_update_doctor"
  ON public.prescriptions FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'doctor'
      AND doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
    )
  )
  WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'doctor'
      AND doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "prescriptions_delete_doctor"
  ON public.prescriptions FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'doctor'
      AND doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
    )
  );

-- ============================================================================
-- PRESCRIPTION ITEMS POLICIES
-- Doctor can CRUD own. Others can read all.
-- ============================================================================
CREATE POLICY "prescription_items_select_authenticated"
  ON public.prescription_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "prescription_items_insert_doctor"
  ON public.prescription_items FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'doctor'
      AND prescription_id IN (
        SELECT id FROM public.prescriptions
        WHERE doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
      )
    )
  );

CREATE POLICY "prescription_items_update_doctor"
  ON public.prescription_items FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'doctor'
      AND prescription_id IN (
        SELECT id FROM public.prescriptions
        WHERE doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
      )
    )
  )
  WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'doctor'
      AND prescription_id IN (
        SELECT id FROM public.prescriptions
        WHERE doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
      )
    )
  );

CREATE POLICY "prescription_items_delete_doctor"
  ON public.prescription_items FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'doctor'
      AND prescription_id IN (
        SELECT id FROM public.prescriptions
        WHERE doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = auth.uid())
      )
    )
  );

-- ============================================================================
-- LAB TESTS POLICIES
-- All authenticated can read.
-- super_admin, lab_staff can manage.
-- ============================================================================
CREATE POLICY "lab_tests_select_authenticated"
  ON public.lab_tests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lab_tests_insert_lab"
  ON public.lab_tests FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_staff'));

CREATE POLICY "lab_tests_update_lab"
  ON public.lab_tests FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_staff'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_staff'));

CREATE POLICY "lab_tests_delete_lab"
  ON public.lab_tests FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_staff'));

-- ============================================================================
-- LAB BOOKINGS POLICIES
-- super_admin, receptionist, lab_staff can insert.
-- lab_staff can update status.
-- All authenticated can read.
-- ============================================================================
CREATE POLICY "lab_bookings_select_authenticated"
  ON public.lab_bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lab_bookings_insert_allowed_roles"
  ON public.lab_bookings FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'receptionist', 'lab_staff'));

CREATE POLICY "lab_bookings_update_lab"
  ON public.lab_bookings FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_staff'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_staff'));

CREATE POLICY "lab_bookings_delete_super_admin"
  ON public.lab_bookings FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- ============================================================================
-- LAB BOOKING TESTS POLICIES
-- Same as lab_bookings: insert by allowed roles, read by all.
-- ============================================================================
CREATE POLICY "lab_booking_tests_select_authenticated"
  ON public.lab_booking_tests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lab_booking_tests_insert_allowed_roles"
  ON public.lab_booking_tests FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'receptionist', 'lab_staff'));

CREATE POLICY "lab_booking_tests_update_lab"
  ON public.lab_booking_tests FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_staff'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_staff'));

CREATE POLICY "lab_booking_tests_delete_super_admin"
  ON public.lab_booking_tests FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- ============================================================================
-- LAB REPORTS POLICIES
-- Lab_staff can CRUD. Others can read.
-- ============================================================================
CREATE POLICY "lab_reports_select_authenticated"
  ON public.lab_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lab_reports_insert_lab"
  ON public.lab_reports FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_staff'));

CREATE POLICY "lab_reports_update_lab"
  ON public.lab_reports FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_staff'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_staff'));

CREATE POLICY "lab_reports_delete_lab"
  ON public.lab_reports FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_staff'));

-- ============================================================================
-- ACTIVITY LOGS POLICIES
-- All can insert (for logging actions).
-- super_admin can read all. Others read own.
-- ============================================================================
CREATE POLICY "activity_logs_insert_authenticated"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "activity_logs_select_own_or_admin"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'super_admin'
    OR user_id = auth.uid()
  );

-- ============================================================================
-- CLINIC SETTINGS POLICIES
-- All authenticated can read. Only super_admin can update.
-- ============================================================================
CREATE POLICY "clinic_settings_select_authenticated"
  ON public.clinic_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "clinic_settings_update_super_admin"
  ON public.clinic_settings FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'super_admin')
  WITH CHECK (public.get_user_role() = 'super_admin');

-- Allow initial insert (seed) - super_admin only
CREATE POLICY "clinic_settings_insert_super_admin"
  ON public.clinic_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'super_admin');
