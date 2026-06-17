-- Doctor feature additions: follow-up note on prescriptions

ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS followup_note TEXT;
