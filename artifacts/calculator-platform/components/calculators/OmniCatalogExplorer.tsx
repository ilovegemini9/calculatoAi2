'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { OmniCalculatorEntry } from '@/lib/omni-catalog-full';

interface Props {
  calculators: OmniCalculatorEntry[];
  categoryCounts: Record<string, number>;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: '🌐' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'math', label: 'Math', icon: '🧮' },
  { id: 'physics', label: 'Physics', icon: '⚡' },
  { id: 'health', label: 'Health & Fitness', icon: '🩺' },
  { id: 'conversion', label: 'Conversion', icon: '⇄' },
  { id: 'everyday-life', label: 'Everyday Life', icon: '📅' },
  { id: 'statistics', label: 'Statistics', icon: '📊' },
  { id: 'construction', label: 'Construction', icon: '🔨' },
  { id: 'biology', label: 'Biology', icon: '🧬' },
  { id: 'sports', label: 'Sports', icon: '🏃' },
  { id: 'chemistry', label: 'Chemistry', icon: '🧪' },
  { id: 'food', label: 'Food', icon: '🍳' },
  { id: 'ecology', label: 'Ecology', icon: '🌱' },
  { id: 'other', label: 'Other', icon: '✨' },
];

const CATEGORY_ALIASES: Record<string, string> = {
  'health & fitness': 'health',
  health_fitness: 'health',
  'everyday life': 'everyday-life',
  everyday_life: 'everyday-life',
};

function normalizeCategory(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return CATEGORY_ALIASES[raw] || raw.replace(/\s+/g, '-');
}

function normalizeCalculatorSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const slug = value.trim().toLowerCase();
  if (!slug || slug === 'undefined' || slug === 'null') return null;
  return slug.endsWith('-calculator') ? slug.slice(0, -'-calculator'.length) : slug;
}

function calculatorHref(value: unknown): string | null {
  const slug = normalizeCalculatorSlug(value);
  return slug ? `/${slug}-calculator` : null;
}

export function OmniCatalogExplorer({ calculators }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 24;

  const validCalculators = useMemo(() => {
    const seen = new Set<string>();
    return calculators.filter((calc) => {
      const slug = normalizeCalculatorSlug(calc?.slug);
      if (!slug || seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });
  }, [calculators]);

  const liveCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const calc of validCalculators) {
      const category = normalizeCategory(calc?.category);
      if (category) counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  }, [validCalculators]);

  const filteredCalculators = useMemo(() => {
    let list = validCalculators;
    if (selectedCategory !== 'all') {
      list = list.filter((c) => normalizeCategory(c.category) === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return list;
  }, [validCalculators, selectedCategory, searchQuery]);

  const paginatedList = useMemo(() => filteredCalculators.slice(0, page * pageSize), [filteredCalculators, page]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <input type="text" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} placeholder={`Search ${validCalculators.length.toLocaleString()}+ calculators (e.g. mortgage, pace, bmi, area)...`} className="w-full px-4 py-3 pl-11 rounded-2xl border text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          <span className="absolute left-4 top-3.5 text-gray-400 text-sm">🔍</span>
          {searchQuery && <button type="button" onClick={() => handleSearchChange('')} className="absolute right-3.5 top-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>}
        </div>
        <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Showing <span className="font-bold text-blue-500">{filteredCalculators.length}</span> verified calculators
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.id;
          const count = tab.id === 'all' ? validCalculators.length : liveCategoryCounts[tab.id] || 0;
          return <button key={tab.id} type="button" onClick={() => handleCategoryChange(tab.id)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 border ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20' : 'hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border-[var(--border)]'}`} style={!isActive ? { backgroundColor: 'var(--bg-card)' } : undefined}><span>{tab.icon}</span><span>{tab.label}</span><span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-input)] text-[var(--text-muted)]'}`}>{count}</span></button>;
        })}
      </div>

      {filteredCalculators.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><div className="text-3xl">🔍</div><h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>No calculators found</h3><p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>We could not find any calculator matching &quot;{searchQuery}&quot;.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedList.map((calc) => {
            const href = calculatorHref(calc.slug);
            if (!href) return null;
            return <Link key={calc.slug} href={href} className="group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:border-blue-500/50" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div><div className="flex items-center justify-between gap-2 mb-3"><span className="text-2xl group-hover:scale-110 transition-transform">{calc.icon}</span><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">{calc.category}</span></div><h3 className="font-bold text-sm leading-snug mb-1.5 group-hover:text-blue-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{calc.name}</h3><p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>{calc.description}</p></div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-semibold text-blue-500" style={{ borderColor: 'var(--border)' }}><span>Calculate &amp; Solve</span><span className="group-hover:translate-x-1 transition-transform">→</span></div>
            </Link>;
          })}
        </div>
      )}

      {paginatedList.length < filteredCalculators.length && <div className="text-center pt-4"><button type="button" onClick={() => setPage((prev) => prev + 1)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-sm transition">Load More Calculators ({paginatedList.length} of {filteredCalculators.length})</button></div>}
    </div>
  );
}
