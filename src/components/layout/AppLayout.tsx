
import { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { useClinicStore } from '@/store/clinicStore';

export interface AppLayoutProps {
  userName?: string;
  userRole?: string;
  avatarUrl?: string;
  onLogout?: () => void;
}

export function AppLayout({
  userName,
  userRole,
  avatarUrl,
  onLogout,
}: AppLayoutProps) {
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const resolvedUserName = userName ?? authUser?.name ?? 'User';
  const resolvedUserRole = userRole ?? authUser?.role ?? 'receptionist';
  const resolvedAvatarUrl = avatarUrl ?? authUser?.avatarUrl;
  const resolvedOnLogout = onLogout ?? logout;

  const { toggleDarkMode } = useThemeStore();
  const { isCollapsed, isMobileOpen, toggleCollapse, toggleMobile, closeMobile } = useSidebarStore();
  const fetchClinic = useClinicStore((s) => s.fetch);

  useEffect(() => { void fetchClinic(); }, [fetchClinic]);

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      toggleMobile();
    } else {
      toggleCollapse();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} userRole={resolvedUserRole} />
      </div>

      {/* Mobile navigation overlay */}
      <MobileNav
        isOpen={isMobileOpen}
        onClose={closeMobile}
        userRole={resolvedUserRole}
      />

      {/* Topbar */}
      <Topbar
        onMenuClick={handleMenuClick}
        isSidebarCollapsed={isCollapsed}
        onToggleDarkMode={toggleDarkMode}
        userName={resolvedUserName}
        userRole={resolvedUserRole}
        avatarUrl={resolvedAvatarUrl}
        onLogout={resolvedOnLogout}
      />

      {/* Main content area */}
      <main
        className={cn(
          'pt-[var(--topbar-height)] min-h-screen transition-[margin-left] duration-300',
          'md:ml-[var(--sidebar-collapsed-width)]',
          !isCollapsed && 'md:ml-[var(--sidebar-width)]'
        )}
      >
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
      <ScrollRestoration />
    </div>
  );
}
