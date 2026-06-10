import { useState } from 'react';
import { Save, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminFooterSettings from './AdminFooterSettings';
import AdminThemeSettings from './AdminThemeSettings';
import CollapsibleSection from './CollapsibleSection';

const AdminSettings = ({ section }: { section?: string } = {}) => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!user?.email) {
      toast.error('No logged-in user');
      return;
    }
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword === currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setSaving(true);
    try {
      // Verify current password by attempting sign-in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyError) {
        toast.error('Current password is incorrect');
        setSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const passwordSection = (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">Current password verify করার পর new password set হবে।</p>

      <div>
        <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className="luxury-input"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="luxury-input"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="luxury-input"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
      </div>

      <button
        onClick={handleChangePassword}
        disabled={saving || !currentPassword || !newPassword || !confirmPassword}
        className="luxury-button-primary inline-flex h-11 items-center justify-center gap-2 px-6 text-[10px] disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Update Password
      </button>
    </div>
  );

  const sections: { key: string; title: string; subtitle?: string; render: () => JSX.Element }[] = [
    { key: 'password', title: 'Change Admin Password', subtitle: 'Update your login password', render: () => passwordSection },
    { key: 'theme', title: 'Theme & Colors', subtitle: 'Site color palette', render: () => <AdminThemeSettings /> },
    { key: 'footer', title: 'Footer Settings', subtitle: 'Footer content and links', render: () => <AdminFooterSettings /> },
  ];

  const visible = section ? sections.filter(s => s.key === section) : sections;

  return (
    <div className="space-y-3 max-w-3xl">
      {visible.map(s => (
        <CollapsibleSection key={s.key} title={s.title} subtitle={s.subtitle} defaultOpen={true}>
          {s.render()}
        </CollapsibleSection>
      ))}
    </div>
  );
};

export default AdminSettings;
