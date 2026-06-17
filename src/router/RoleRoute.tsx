
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/config/routes';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user);

  const isRoleDenied = user !== null && !allowedRoles.includes(user.role);

  useEffect(() => {
    if (isRoleDenied) {
      toast.error('Access Denied', {
        description: 'You do not have permission to access this page.',
      });
    }
  }, [isRoleDenied]);

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (isRoleDenied) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
