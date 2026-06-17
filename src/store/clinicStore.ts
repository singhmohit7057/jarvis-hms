
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface ClinicStore {
  clinicName: string;
  logoUrl: string | null;
  isLoaded: boolean;
  fetch: () => Promise<void>;
  setClinicName: (name: string) => void;
  setLogoUrl: (url: string) => void;
}

export const useClinicStore = create<ClinicStore>((set) => ({
  clinicName: 'Jarvis',
  logoUrl: null,
  isLoaded: false,

  fetch: async () => {
    const { data } = await supabase
      .from('clinic_settings')
      .select('clinic_name, logo_url')
      .limit(1)
      .maybeSingle();

    if (data) {
      set({
        clinicName: data.clinic_name || 'Jarvis',
        logoUrl: data.logo_url ?? null,
        isLoaded: true,
      });
    } else {
      set({ isLoaded: true });
    }
  },

  setClinicName: (name: string) => set({ clinicName: name }),
  setLogoUrl: (url: string) => set({ logoUrl: url }),
}));
