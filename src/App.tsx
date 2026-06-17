
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { AppRouter } from '@/router';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  // Initialize auth session on mount; clean up the subscription on unmount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    initialize().then((unsub) => { unsubscribe = unsub; });
    return () => unsubscribe?.();
  }, [initialize]);

  // Redirect invite/recovery hash fragments to the set-password page.
  // Supabase appends #access_token=...&type=invite to the redirect_to URL,
  // which defaults to the site root. Without this redirect the hash is lost
  // when ProtectedRoute sends unauthenticated users to /login.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.slice(1));
    const type = params.get('type');
    if (type === 'invite' || type === 'recovery') {
      // Preserve the full hash so ResetPasswordPage can read the session
      window.location.replace(`/reset-password${hash}`);
    }
  }, []);

  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        richColors
        theme={isDarkMode ? 'dark' : 'light'}
        closeButton
      />
    </>
  );
}
