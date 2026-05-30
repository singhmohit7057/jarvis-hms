-- #must: Create all tables, constraints, relationships, and indexes for Jarvis HMS

-- ============================================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'pharmacist', 'doctor', 'lab_staff', 'receptionist')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PATIENTS
-- ============================================================================
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  blood_group TEXT,
  allergies TEXT,
  medical_history TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- DOCTORS
-- ============================================================================
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT NOT NULL,
  registration_no TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  available_days TEXT[],
  available_time_start TIME,
  available_time_end TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- MEDICINES
-- ============================================================================
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  company TEXT,
  category TEXT NOT NULL,
  composition TEXT,
  hsn_code TEXT NOT NULL,
  gst_percentage DECIMAL(5,2) NOT NULL CHECK (gst_percentage IN (0, 5, 12, 18, 28)),
  unit TEXT NOT NULL DEFAULT 'Strip',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- MEDICINE BATCHES
-- ============================================================================
CREATE TABLE public.medicine_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(medicine_id, batch_number)
);

-- ============================================================================
-- SALES
-- ============================================================================
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  gst_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card')),
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  change_amount DECIMAL(10,2) DEFAULT 0,
  billed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SALE ITEMS
-- ============================================================================
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES public.medicines(id),
  batch_id UUID REFERENCES public.medicine_batches(id),
  medicine_name TEXT NOT NULL,
  hsn_code TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  gst_percentage DECIMAL(5,2) NOT NULL,
  gst_amount DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- APPOINTMENTS
-- ============================================================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_no TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'upi', 'card')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CONSULTATIONS
-- ============================================================================
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  vitals JSONB DEFAULT '{}',
  symptoms TEXT,
  diagnosis TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PRESCRIPTIONS
-- ============================================================================
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_no TEXT UNIQUE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  consultation_id UUID REFERENCES public.consultations(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  diagnosis TEXT,
  advice TEXT,
  followup_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PRESCRIPTION ITEMS
-- ============================================================================
CREATE TABLE public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  timing TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- LAB TESTS (master list of available tests)
-- ============================================================================
CREATE TABLE public.lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  test_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sample_type TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- LAB BOOKINGS
-- ============================================================================
CREATE TABLE public.lab_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'upi', 'card')),
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'sample_collected', 'processing', 'completed', 'delivered')),
  collected_by UUID REFERENCES public.profiles(id),
  processed_by UUID REFERENCES public.profiles(id),
  verified_by UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- LAB BOOKING TESTS (junction: which tests are in a booking)
-- ============================================================================
CREATE TABLE public.lab_booking_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_booking_id UUID NOT NULL REFERENCES public.lab_bookings(id) ON DELETE CASCADE,
  lab_test_id UUID NOT NULL REFERENCES public.lab_tests(id),
  test_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- ============================================================================
-- LAB REPORTS
-- ============================================================================
CREATE TABLE public.lab_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number TEXT UNIQUE NOT NULL,
  lab_booking_id UUID NOT NULL REFERENCES public.lab_bookings(id),
  lab_test_id UUID NOT NULL REFERENCES public.lab_tests(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  test_name TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '[]',
  interpretation TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ACTIVITY LOGS
-- ============================================================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CLINIC SETTINGS (single-row config)
-- ============================================================================
CREATE TABLE public.clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name TEXT NOT NULL DEFAULT 'Jarvis',
  email TEXT DEFAULT 'workwithmohitsingh@gmail.com',
  phone TEXT DEFAULT '8981203500',
  address TEXT DEFAULT 'abc, xyz place, state - pincode',
  gst_number TEXT,
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES for common queries
-- ============================================================================

-- Patients
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_patients_patient_id ON public.patients(patient_id);

-- Medicines
CREATE INDEX idx_medicines_name ON public.medicines(name);
CREATE INDEX idx_medicines_hsn_code ON public.medicines(hsn_code);

-- Medicine Batches
CREATE INDEX idx_medicine_batches_medicine_expiry ON public.medicine_batches(medicine_id, expiry_date);

-- Sales
CREATE INDEX idx_sales_created_at ON public.sales(created_at);
CREATE INDEX idx_sales_invoice_number ON public.sales(invoice_number);

-- Appointments
CREATE INDEX idx_appointments_doctor_date ON public.appointments(doctor_id, date);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);

-- Lab Bookings
CREATE INDEX idx_lab_bookings_patient ON public.lab_bookings(patient_id);
CREATE INDEX idx_lab_bookings_status ON public.lab_bookings(status);

-- Activity Logs
CREATE INDEX idx_activity_logs_user_created ON public.activity_logs(user_id, created_at);
