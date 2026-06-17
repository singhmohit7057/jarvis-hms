
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, Card, Alert } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/forms/FileUpload';
import { ClinicInfoForm } from '../components/ClinicInfoForm';
import type { ClinicInfoFormValues } from '../components/ClinicInfoForm';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useClinicStore } from '@/store/clinicStore';
import { toast } from 'sonner';
import { Moon, Sun, ImageIcon } from 'lucide-react';
import type { TabItem } from '@/components/ui';

const TABS: TabItem[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
];

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface ClinicSettingsRow {
  id: string;
  clinic_name: string;
  email: string;
  phone: string;
  address: string;
  gst_number: string;
  logo_url: string | null;
}

export function ClinicSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const setClinicName = useClinicStore((s) => s.setClinicName);
  const setLogoUrl = useClinicStore((s) => s.setLogoUrl);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const handleSaveProfile = async (values: ProfileFormValues) => {
    if (!user) return;
    setIsProfileSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: values.name, email: values.email })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleResetPassword = async (values: PasswordFormValues) => {
    setIsPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      passwordForm.reset();
    } catch (err) {
      toast.error('Failed to update password: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsPasswordSaving(false);
    }
  };
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<Partial<ClinicInfoFormValues> | undefined>();
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const { isDarkMode, toggleDarkMode } = useThemeStore();

  // Fetch clinic settings on mount
  useEffect(() => {
    async function fetchSettings() {
      setIsLoadingSettings(true);
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .limit(1)
        .maybeSingle<ClinicSettingsRow>();

      if (error) {
        toast.error('Failed to load clinic settings');
      } else if (data) {
        setSettingsId(data.id);
        setLogoUrlState(data.logo_url);
        setDefaultValues({
          clinicName: data.clinic_name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          gstNumber: data.gst_number,
        });
      }
      setIsLoadingSettings(false);
    }

    void fetchSettings();
  }, []);

  const handleSaveGeneral = async (values: ClinicInfoFormValues) => {
    setIsSaving(true);
    try {
      const payload = {
        clinic_name: values.clinicName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        gst_number: values.gstNumber ?? '',
        updated_at: new Date().toISOString(),
      };

      let error: { message: string } | null = null;

      if (settingsId) {
        const result = await supabase
          .from('clinic_settings')
          .update(payload)
          .eq('id', settingsId);
        error = result.error;
      } else {
        const result = await supabase.from('clinic_settings').insert(payload).select().single<ClinicSettingsRow>();
        error = result.error;
        if (!error && result.data) {
          setSettingsId(result.data.id);
        }
      }

      if (error) {
        toast.error('Failed to save settings: ' + error.message);
      } else {
        setClinicName(values.clinicName);
        toast.success('Clinic settings saved successfully');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setIsLogoUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `clinic-logo/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('clinic-logos')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        toast.error('Logo upload failed: ' + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage.from('clinic-logos').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      if (settingsId) {
        await supabase
          .from('clinic_settings')
          .update({ logo_url: publicUrl })
          .eq('id', settingsId);
      } else {
        const result = await supabase
          .from('clinic_settings')
          .insert({ logo_url: publicUrl })
          .select()
          .single<ClinicSettingsRow>();
        if (result.error) {
          toast.error('Failed to save logo: ' + result.error.message);
          return;
        }
        if (result.data) {
          setSettingsId(result.data.id);
        }
      }

      const freshUrl = publicUrl + '?t=' + Date.now();
      setLogoUrl(freshUrl);
      setLogoUrlState(freshUrl);
      toast.success('Logo updated successfully');
    } finally {
      setIsLogoUploading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Clinic Settings"
        subtitle="Manage your clinic's information and appearance"
      />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile info */}
            <Card title="Profile Information" subtitle="Update your display name and email address">
              <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    label="Full Name"
                    placeholder="Your full name"
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="your@email.com"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" isLoading={isProfileSaving}>
                    Save Profile
                  </Button>
                </div>
              </form>
            </Card>

            {/* Reset password */}
            <Card title="Reset Password" subtitle="Choose a new password for your account">
              <form onSubmit={passwordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    type="password"
                    label="New Password"
                    placeholder="Min. 8 characters"
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    placeholder="Re-enter new password"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" isLoading={isPasswordSaving}>
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {activeTab === 'general' && (
          <Card title="General Information" subtitle="Update your clinic's contact and billing details">
            {isLoadingSettings ? (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading settings…
              </div>
            ) : (
              <ClinicInfoForm
                onSubmit={handleSaveGeneral}
                defaultValues={defaultValues}
                isLoading={isSaving}
              />
            )}
          </Card>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            {/* Logo section */}
            <Card
              title="Clinic Logo"
              subtitle="Appears on invoices and prescriptions"
            >
              <div className="space-y-4">
                {/* Current logo preview */}
                <div className="flex items-center gap-4">
                  <div className="h-20 w-40 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-slate-800/50">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Clinic logo"
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <ImageIcon className="h-8 w-8 mb-1" />
                        <span className="text-xs">No logo</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current logo
                    </p>
                    <p>Recommended: PNG or SVG, at least 200×60 px</p>
                    <p>Maximum file size: 2 MB</p>
                  </div>
                </div>

                <Alert variant="info">
                  The logo appears on all printed invoices and prescriptions generated by the
                  system.
                </Alert>

                <FileUpload
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  maxSize={2 * 1024 * 1024}
                  onUpload={handleLogoUpload}
                  label="Upload New Logo"
                  helperText="PNG, SVG, JPG or WEBP — max 2 MB"
                  disabled={isLogoUploading}
                />
              </div>
            </Card>

            {/* Dark mode toggle */}
            <Card title="Theme" subtitle="Choose how the application looks">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Sun className="h-5 w-5 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Dark Mode
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isDarkMode ? 'Currently using dark theme' : 'Currently using light theme'}
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDarkMode}
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isDarkMode
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-slate-600'
                  }`}
                >
                  <span className="sr-only">Toggle dark mode</span>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
