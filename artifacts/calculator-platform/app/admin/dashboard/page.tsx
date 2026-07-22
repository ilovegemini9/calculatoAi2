import {
  LayoutDashboard,
  FileText,
  Calculator,
  Users,
  BarChart3,
  Activity,
} from 'lucide-react';
import { StatCard } from '@/components/admin/Card';
import { ContentCard } from '@/components/admin/Card';
import { EmptyState } from '@/components/admin/EmptyState';

export const metadata = { title: 'Dashboard — Admin' };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Overview of platform activity.
        </p>
      </div>

      {/* Stat cards — no fake data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Articles"
          icon={<FileText className="w-4 h-4" />}
        />
        <StatCard
          label="Total Calculators"
          icon={<Calculator className="w-4 h-4" />}
        />
        <StatCard
          label="Registered Users"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Page Views (30d)"
          icon={<BarChart3 className="w-4 h-4" />}
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ContentCard
          title="Recent Activity"
          description="Latest actions across the platform."
          action={
            <span className="text-xs text-[var(--text-muted)]">
              <Activity className="w-3.5 h-3.5 inline mr-1" />
              Live
            </span>
          }
        >
          <EmptyState
            icon={<LayoutDashboard className="w-5 h-5" />}
            title="No activity yet"
            description="Recent platform actions will appear here."
          />
        </ContentCard>

        <ContentCard
          title="Quick Stats"
          description="At-a-glance performance indicators."
        >
          <EmptyState
            icon={<BarChart3 className="w-5 h-5" />}
            title="No data available"
            description="Connect your analytics source to see stats."
          />
        </ContentCard>
      </div>
    </div>
  );
}
