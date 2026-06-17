
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/data/DataTable';
import { Modal, Button, Spinner } from '@/components/ui';
import { UserForm } from '../components/UserForm';
import type { UserFormValues } from '../components/UserForm';
import { buildUserColumns } from '../components/UserTable';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks';
import { useActivityLog } from '@/hooks';
import type { User, UserRole } from '@/types';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

function mapProfileToUser(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone ?? '',
    role: row.role as UserRole,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function UserManagementPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { logActivity } = useActivityLog();

  const { data: profiles, isLoading, refetch } = useSupabaseQuery<ProfileRow>(
    async () =>
      supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false }),
    []
  );

  const users: User[] = profiles.map(mapProfileToUser);

  const handleAddUser = async (values: UserFormValues) => {
    if (!supabaseAdmin) {
      toast.error('Admin key not configured. Add VITE_SUPABASE_SERVICE_ROLE_KEY to .env');
      return;
    }
    setIsSaving(true);
    try {
      // Check for duplicate profile
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', values.email)
        .maybeSingle<{ id: string }>();

      if (existing) {
        toast.error('A user with this email already exists');
        return;
      }

      // Create auth account via admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: values.email,
        password: values.password,
        email_confirm: true,
        user_metadata: { full_name: values.name },
      });

      if (authError || !authData.user) {
        toast.error('Failed to create auth account: ' + (authError?.message ?? 'Unknown error'));
        return;
      }

      // Create profile row linked to auth user
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: values.email,
        name: values.name,
        phone: values.phone ?? '',
        role: values.role,
        is_active: true,
      });

      if (profileError) {
        // Roll back auth user if profile insert fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        toast.error('Failed to create profile: ' + profileError.message);
        return;
      }

      await logActivity({
        action: 'create',
        entityType: 'user',
        description: `Created user ${values.name} (${values.email}) with role ${values.role}`,
        metadata: { email: values.email, role: values.role },
      });

      toast.success(`User ${values.name} created successfully`);
      setIsAddModalOpen(false);
      refetch();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditUser = async (values: UserFormValues) => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const isActiveValue =
        typeof values.is_active === 'string'
          ? values.is_active === 'true'
          : (values.is_active ?? editingUser.isActive);

      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          phone: values.phone ?? '',
          role: values.role,
          is_active: isActiveValue,
        })
        .eq('id', editingUser.id);

      if (error) {
        toast.error('Failed to update user: ' + error.message);
        return;
      }

      await logActivity({
        action: 'update',
        entityType: 'user',
        entityId: editingUser.id,
        description: `Updated user ${editingUser.name}`,
        metadata: { role: values.role, is_active: isActiveValue },
      });

      toast.success('User updated successfully');
      setEditingUser(null);
      refetch();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    const newStatus = !user.isActive;
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: newStatus })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update status: ' + error.message);
      return;
    }

    await logActivity({
      action: 'update',
      entityType: 'user',
      entityId: user.id,
      description: `${newStatus ? 'Activated' : 'Deactivated'} user ${user.name}`,
    });

    toast.success(`${user.name} ${newStatus ? 'activated' : 'deactivated'}`);
    refetch();
  };

  const columns = buildUserColumns(
    (user) => setEditingUser(user),
    handleToggleActive
  );

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage staff accounts and access roles"
        actions={
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchable
          searchPlaceholder="Search by name, email, role…"
          emptyMessage="No users found"
        />
      )}

      {/* Role permissions reference */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Role Permissions</h3>
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400 w-40">Role</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 bg-white dark:bg-slate-800/50">
              {[
                { role: 'Super Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', access: 'Full access — all pages, settings, reports' },
                { role: 'Pharmacist',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', access: 'Pharmacy (inventory, billing, sales), pharmacy reports' },
                { role: 'Doctor',      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', access: 'Appointments, consultations, prescriptions, doctor reports' },
                { role: 'Lab Staff',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', access: 'Lab bookings, test catalog, report entry, lab reports' },
                { role: 'Receptionist',color: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300', access: 'Patients, appointments, lab bookings' },
              ].map(({ role, color, access }) => (
                <tr key={role} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>{role}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add User Profile"
        size="md"
      >
        <UserForm
          mode="add"
          onSubmit={handleAddUser}
          isLoading={isSaving}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editingUser !== null}
        onClose={() => setEditingUser(null)}
        title="Edit User"
        size="md"
      >
        {editingUser && (
          <UserForm
            mode="edit"
            onSubmit={handleEditUser}
            isLoading={isSaving}
            defaultValues={{
              name: editingUser.name,
              email: editingUser.email,
              phone: editingUser.phone,
              role: editingUser.role as UserRole,
              is_active: editingUser.isActive,
            }}
          />
        )}
      </Modal>
    </div>
  );
}
