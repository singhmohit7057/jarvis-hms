// #must: Supabase client initialization — single instance for the entire app

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
