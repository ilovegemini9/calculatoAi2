import Link from 'next/link';
import { ArrowRight, Bot, Settings } from 'lucide-react';
import { ContentCard } from '@/components/admin/Card';

export const metadata = { title: 'Settings — Admin' };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">Platform configuration and preferences.</p>
      </div>
      <ContentCard title="AI Settings" description="Configure server-side AI providers, budgets, and usage tracking." action={<Bot className="h-4 w-4 text-blue-500" />}>
        <Link href="/admin/settings/ai" className="flex items-center justify-between gap-4 rounded-lg border p-4 transition hover:border-blue-500/50 hover:bg-blue-500/5" style={{ borderColor: 'var(--border)' }}>
          <span>
            <span className="block text-sm font-semibold text-[var(--text-primary)]">AI Provider Settings</span>
            <span className="mt-1 block text-xs text-[var(--text-muted)]">OpenRouter, OpenAI, Gemini, and Anthropic</span>
          </span>
          <ArrowRight className="h-4 w-4 text-blue-500" />
        </Link>
      </ContentCard>
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