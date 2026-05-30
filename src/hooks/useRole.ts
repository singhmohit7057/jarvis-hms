// #must: Role-checking hook — exposes role booleans and hasAccess helper for guard logic
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export function useRole() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? null;

  return {
    role,
    isAdmin: role === 'super_admin',
    isPharmacist: role === 'pharmacist',
    isDoctor: role === 'doctor',
    isLabStaff: role === 'lab_staff',
    isReceptionist: role === 'receptionist',
    hasAccess: (allowedRoles: UserRole[]): boolean => {
      if (!role) return false;
      return allowedRoles.includes(role);
    },
  };
}
