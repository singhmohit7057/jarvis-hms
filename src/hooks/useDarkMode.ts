// #must: Dark mode hook — returns state + toggle, listens for system preference changes
import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function useDarkMode() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);
  const setDarkMode = useThemeStore((s) => s.setDarkMode);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if there's no stored preference
      const stored = localStorage.getItem('jarvis-theme');
      if (!stored) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setDarkMode]);

  return { isDarkMode, toggleDarkMode };
}
