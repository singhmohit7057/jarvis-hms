-- Lab feature additions: sample collection fields and report prepared_by

ALTER TABLE public.lab_bookings
  ADD COLUMN IF NOT EXISTS collector_name TEXT,
  ADD COLUMN IF NOT EXISTS bottle_number TEXT,
  ADD COLUMN IF NOT EXISTS prepared_by TEXT;
