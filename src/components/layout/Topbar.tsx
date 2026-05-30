// #must: Fixed top navbar with hamburger, search, dark mode toggle, notifications, profile
import { cn } from '@/lib/utils';
import { Menu, Search, Moon, Sun } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import { useThemeStore } from '@/store/themeStore';

export interface TopbarProps {
  /** Toggle sidebar collapse (desktop) or open mobile nav */
  onMenuClick: () => void;
  /** Whether sidebar is collapsed */
  isSidebarCollapsed: boolean;
  /** Toggle dark mode */
  onToggleDarkMode: () => void;
  /** Current user name */
  userName: string;
  /** Current user role */
  userRole: string;
  /** User avatar URL */
  avatarUrl?: string;
  /** Logout handler */
  onLogout: () => void;
}

export function Topbar({
  onMenuClick,
  isSidebarCollapsed,
  onToggleDarkMode,
  userName,
  userRole,
  avatarUrl,
  onLogout,
}: TopbarProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-[var(--topbar-height)] flex items-center gap-4 px-4 sm:px-6',
        'bg-white/80 backdrop-blur-md border-b border-gray-200',
        'dark:bg-slate-800/80 dark:border-slate-700',
        'transition-[left] duration-300',
        // On mobile: full width (left-0). On desktop: offset by sidebar width
        'left-0',
        isSidebarCollapsed ? 'md:left-[var(--sidebar-collapsed-width)]' : 'md:left-[var(--sidebar-width)]'
      )}
    >
      {/* Menu toggle */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-gray-200 transition-colors lg:block"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Global search */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients, medicines..."
            className={cn(
              'w-full pl-9 pr-4 py-2 text-sm rounded-lg',
              'bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:shadow-sm',
              'dark:bg-slate-700 dark:text-gray-100 dark:placeholder:text-gray-500',
              'dark:focus:bg-slate-600 dark:focus:ring-blue-400/20',
              'transition-all duration-150'
            )}
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Dark mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-gray-200 transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Profile */}
        <ProfileDropdown
          userName={userName}
          userRole={userRole}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
