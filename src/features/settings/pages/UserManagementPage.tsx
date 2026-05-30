// #must: User management page — list profiles, add new user profile, edit role/status
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/data/DataTable';
import { Modal, Button, Spinner } from '@/components/ui';
import { UserForm } from '../components/UserForm';
import type { UserFormValues } from '../components/UserForm';
import { buildUserColumns } from '../components/UserTable';
import { supabase } from '@/lib/supabase';
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
    setIsSaving(true);
    try {
      // Check if a profile with this email already exists in auth users
      // We insert into profiles — the auth user must already exist
      const { data: existingAuth, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', values.email)
        .maybeSingle<{ id: string }>();

      if (lookupError) {
        toast.error('Lookup failed: ' + lookupError.message);
        return;
      }

      if (existingAuth) {
        toast.error('A profile with this email already exists');
        return;
      }

      const { data: authUserData, error: authLookupError } =
        await supabase.auth.admin.getUserByEmail(values.email);

      if (authLookupError || !authUserData?.user?.id) {
        toast.error(
          'Could not find an auth account for this email. The user must sign up first.'
        );
        return;
      }

      const authUserId = authUserData.user.id;

      const { error } = await supabase.from('profiles').insert({
        id: authUserId,
        email: values.email,
        name: values.name,
        phone: values.phone ?? '',
        role: values.role,
        is_active: true,
      });

      if (error) {
        toast.error('Failed to create profile: ' + error.message);
        return;
      }

      await logActivity({
        action: 'create',
        entityType: 'user',
        description: `Created user profile for ${values.name} (${values.email})`,
        metadata: { email: values.email, role: values.role },
      });

      toast.success(`Profile for ${values.name} created successfully`);
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
