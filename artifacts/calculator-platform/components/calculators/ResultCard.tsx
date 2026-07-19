import { cn } from '@/lib/utils';

interface ResultCardProps {
  label: string;
  value: string;
  highlight?: boolean;
  sub?: string;
  className?: string;
}

export function ResultCard({ label, value, highlight, sub, className }: ResultCardProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all duration-200',
        highlight
          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20',
        className
      )}
    >
      <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1.5', highlight ? 'text-blue-100' : 'text-slate-400')}>
        {label}
      </p>
      <p className={cn('text-xl md:text-2xl font-black font-mono leading-none animate-count-up', highlight ? 'text-white' : 'text-white')}>
        {value}
      </p>
      {sub && (
        <p className={cn('text-[11px] mt-1.5', highlight ? 'text-blue-200' : 'text-slate-500')}>
          {sub}
        </p>
      )}
    </div>
  );
}

interface ResultsPanelProps {
  children: React.ReactNode;
  title?: string;
}

export function ResultsPanel({ children, title }: ResultsPanelProps) {
  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 flex flex-col gap-4 shadow-xl shadow-slate-900/40">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <p className="font-black uppercase tracking-widest text-[10px] text-slate-400">
          {title ?? 'Live Results'}
        </p>
        <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
          <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse-dot" />
          Real-Time
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className="text-slate-500">100% Client-Side</span>
        <span className="text-green-400 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Private &amp; Secure
        </span>
      </div>
    </div>
  );
}

interface InputsPanelProps {
  children: React.ReactNode;
  title?: string;
}

export function InputsPanel({ children, title }: InputsPanelProps) {
  return (
    <div
      className="rounded-2xl border p-6 flex flex-col gap-5 shadow-sm"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {title ?? 'Calculation Inputs'}
      </p>
      {children}
      <p className="text-[10px] italic text-center pt-2 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
        Results computed instantly — your data never leaves your device.
      </p>
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div>
      <label
        className="block text-[11px] font-black uppercase tracking-wider mb-1.5"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </label>
      {hint && (
        <p className="text-[11px] mb-1.5" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

export const inputClass =
  'input-base';

export const selectClass =
  'input-base cursor-pointer';
