import { Settings } from 'lucide-react';
import { ContentCard } from '@/components/admin/Card';
import { EmptyState } from '@/components/admin/EmptyState';

export const metadata = { title: 'Settings — Admin' };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Platform configuration and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ContentCard title="General" description="Basic platform settings.">
          <EmptyState
            icon={<Settings className="w-5 h-5" />}
            title="No settings configured"
            description="Platform configuration options will appear here."
          />
        </ContentCard>

        <ContentCard title="Security" description="Authentication and access control.">
          <EmptyState
            icon={<Settings className="w-5 h-5" />}
            title="No settings configured"
            description="Security settings will appear here."
          />
        </ContentCard>

        <ContentCard title="Integrations" description="Third-party service connections.">
          <EmptyState
            icon={<Settings className="w-5 h-5" />}
            title="No integrations connected"
            description="Connected services will appear here."
          />
        </ContentCard>

        <ContentCard title="Notifications" description="Alert and notification preferences.">
          <EmptyState
            icon={<Settings className="w-5 h-5" />}
            title="No settings configured"
            description="Notification preferences will appear here."
          />
        </ContentCard>
      </div>
    </div>
  );
}
