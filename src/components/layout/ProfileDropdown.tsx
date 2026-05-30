// #must: User avatar dropdown with profile link, settings, and logout
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export interface ProfileDropdownProps {
  /** User's full name */
  userName: string;
  /** User's role (displayed as badge) */
  userRole: string;
  /** User's avatar image URL */
  avatarUrl?: string;
  /** Called when user clicks logout */
  onLogout: () => void;
}

export function ProfileDropdown({ userName, userRole, avatarUrl, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Format role for display
  const displayRole = userRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Avatar src={avatarUrl} name={userName} size="sm" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg dark:bg-slate-800 dark:border-slate-700 animate-scale-in origin-top-right z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {userName}
            </p>
            <Badge variant="info" size="sm">
              {displayRole}
            </Badge>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <User className="h-4 w-4 text-gray-400" />
              Profile
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-400" />
              Settings
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 dark:border-slate-700 py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className={cn(
                'w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400',
                'hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors'
              )}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
