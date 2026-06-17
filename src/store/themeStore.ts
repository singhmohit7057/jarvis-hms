
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

function applyDarkMode(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Determine initial value from system preference
function getSystemPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDarkMode: getSystemPreference(),

      toggleDarkMode: () => {
        set((state) => {
          const next = !state.isDarkMode;
          applyDarkMode(next);
          return { isDarkMode: next };
        });
      },

      setDarkMode: (value: boolean) => {
        applyDarkMode(value);
        set({ isDarkMode: value });
      },
    }),
    {
      name: 'jarvis-theme',
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            applyDarkMode(state.isDarkMode);
          }
        };
      },
    }
  )
);
