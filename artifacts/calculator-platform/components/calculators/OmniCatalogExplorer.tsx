'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { OmniCalculatorEntry } from '@/lib/omni-catalog-full';
import { CALCULATORS } from '@/config/calculators';

interface Props {
  calculators: OmniCalculatorEntry[];
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

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-_/]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCategory(category: string): string {
  const normalized = category.trim().toLowerCase();
  if (normalized === 'financial') return 'finance';
  if (normalized === 'fitness' || normalized === 'health & fitness') return 'health';
  if (normalized === 'lifestyle' || normalized === 'everyday') return 'everyday-life';
  return normalized;
}

function searchableText(calculator: OmniCalculatorEntry): string {
  return normalizeText([
    calculator.name,
    calculator.slug,
    calculator.description,
    ...calculator.keywords,
  ].join(' '));
}

export function OmniCatalogExplorer({ calculators }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);
  const pageSize = 24;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const calculator of calculators) {
      const category = normalizeCategory(calculator.category);
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  }, [calculators]);

  const filteredCalculators = useMemo(() => {
    let list = calculators;
    if (selectedCategory !== 'all') {
      list = list.filter((c) => normalizeCategory(c.category) === selectedCategory);
    }

    const query = normalizeText(searchQuery);
    if (query) {
      const terms = query.split(' ').filter((term) => term.length >= 2);
      list = list.filter((calculator) => {
        const haystack = searchableText(calculator);
        return terms.every((term) => haystack.includes(term));
      });
    }
    return list;
  }, [calculators, selectedCategory, searchQuery]);

  const searchCandidates = useMemo(() => {
    const candidates = [...calculators];
    const knownSlugs = new Set(candidates.map((calculator) => calculator.slug));

    // Dedicated calculators are real, published calculators but are not always engine-backed.
    // Include their canonical registry metadata so search/autocomplete can still find them.
    for (const calculator of CALCULATORS) {
      if (knownSlugs.has(calculator.slug)) continue;
      candidates.push({
        slug: calculator.slug,
        name: calculator.name,
        shortName: calculator.shortName,
        category: calculator.category,
        icon: calculator.icon,
        description: calculator.description,
        keywords: calculator.keywords,
        inputs: [],
        outputs: [],
        formula: { expression: '', variables: [] },
        howToSteps: [],
        faqs: [],
        examples: [],
      });
    }

    return candidates;
  }, [calculators]);

  const suggestions = useMemo(() => {
    const query = normalizeText(searchQuery);
    if (!query || query.length < 2) return [];

    const terms = query.split(' ').filter(Boolean);
    return searchCandidates
      .map((calculator) => {
        const name = normalizeText(calculator.name);
        const slug = normalizeText(calculator.slug);
        const haystack = searchableText(calculator);
        const exactPrefix = name.startsWith(query) || slug.startsWith(query);
        const allTermsMatch = terms.every((term) => haystack.includes(term));
        const score = exactPrefix ? 3 : name.includes(query) ? 2 : allTermsMatch ? 1 : 0;
        return { calculator, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.calculator.name.localeCompare(b.calculator.name))
      .slice(0, 8)
      .map((item) => item.calculator);
  }, [searchCandidates, searchQuery]);

  const paginatedList = useMemo(() => {
    return filteredCalculators.slice(0, page * pageSize);
  }, [filteredCalculators, page]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const selectSuggestion = (calculator: OmniCalculatorEntry) => {
    setSearchQuery(calculator.name);
    setSearchFocused(false);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search calculators (e.g. mortgage, pace, bmi, area)..."
            aria-label="Search calculators"
            autoComplete="off"
            className="w-full px-4 py-3 pl-11 rounded-2xl border text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <span className="absolute left-4 top-3.5 text-gray-400 text-sm" aria-hidden="true">🔍</span>
          {searchQuery && (
            <button type="button" onClick={() => handleSearchChange('')} aria-label="Clear calculator search" className="absolute right-3.5 top-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
          )}

          {searchFocused && suggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-2 overflow-hidden rounded-2xl border shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              {suggestions.map((calculator) => (
                <Link
                  key={calculator.slug}
                  href={`/${calculator.slug}-calculator`}
                  onMouseDown={() => selectSuggestion(calculator)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-card-hover)] transition"
                >
                  <span className="text-xl shrink-0">{calculator.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{calculator.name}</span>
                    <span className="block text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{calculator.description}</span>
                  </span>
                  <span className="text-[10px] text-blue-500 shrink-0">{normalizeCategory(calculator.category)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Showing <span className="font-bold text-blue-500">{filteredCalculators.length}</span> verified calculators
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.id;
          const count = tab.id === 'all' ? calculators.length : categoryCounts[tab.id] || 0;
          return (
            <button key={tab.id} type="button" onClick={() => handleCategoryChange(tab.id)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 border ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20' : 'hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border-[var(--border)]'}`} style={!isActive ? { backgroundColor: 'var(--bg-card)' } : undefined}>
              <span>{tab.icon}</span><span>{tab.label}</span><span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-input)] text-[var(--text-muted)]'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {filteredCalculators.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-3xl">🔍</div>
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>No calculators found</h3>
          <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>We could not find any calculator matching &quot;{searchQuery}&quot;. Try another keyword or clear the search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedList.map((calc) => (
            <Link key={calc.slug} href={`/${calc.slug}-calculator`} className="group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:border-blue-500/50" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-3"><span className="text-2xl group-hover:scale-110 transition-transform">{calc.icon}</span><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">{normalizeCategory(calc.category)}</span></div>
                <h3 className="font-bold text-sm leading-snug mb-1.5 group-hover:text-blue-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{calc.name}</h3>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>{calc.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-semibold text-blue-500" style={{ borderColor: 'var(--border)' }}><span>Calculate & Solve</span><span className="group-hover:translate-x-1 transition-transform">→</span></div>
            </Link>
          ))}
        </div>
      )}

      {paginatedList.length < filteredCalculators.length && (
        <div className="text-center pt-4"><button type="button" onClick={() => setPage((prev) => prev + 1)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-sm transition">Load More Calculators ({paginatedList.length} of {filteredCalculators.length})</button></div>
      )}
    </div>
  );
}
