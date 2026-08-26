import { Settings } from 'lucide-react';
import { ContentCard } from '@/components/admin/Card';

export const metadata = { title: 'Settings — Admin' };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">Platform configuration and preferences.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ContentCard title="General" description="Basic platform settings.">
          <div className="flex items-center gap-3 rounded-lg border p-4 text-sm text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}><Settings className="h-4 w-4" /> General settings are managed by the platform.</div>
        </ContentCard>
        <ContentCard title="Security" description="Authentication and access control.">
          <div className="flex items-center gap-3 rounded-lg border p-4 text-sm text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}><Settings className="h-4 w-4" /> Admin access is protected by the existing session layer.</div>
        </ContentCard>
      </div>
    </div>
  );
}