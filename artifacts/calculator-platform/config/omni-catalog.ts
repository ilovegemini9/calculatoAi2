/**
 * Coverage manifest based on the public category inventory visible on Omni Calculator.
 * This is a planning/catalog reference only. Implementations must use original code,
 * original copy, and independently validated formulas.
 */
export const OMNI_CATEGORY_CATALOG = [
  { slug: 'biology', label: 'Biology', sourceCount: 111 },
  { slug: 'chemistry', label: 'Chemistry', sourceCount: 108 },
  { slug: 'construction', label: 'Construction', sourceCount: 159 },
  { slug: 'conversion', label: 'Conversion', sourceCount: 327 },
  { slug: 'ecology', label: 'Ecology', sourceCount: 34 },
  { slug: 'everyday-life', label: 'Everyday life', sourceCount: 290 },
  { slug: 'finance', label: 'Finance', sourceCount: 613 },
  { slug: 'food', label: 'Food', sourceCount: 70 },
  { slug: 'health', label: 'Health', sourceCount: 439 },
  { slug: 'math', label: 'Math', sourceCount: 686 },
  { slug: 'physics', label: 'Physics', sourceCount: 546 },
  { slug: 'sports', label: 'Sports', sourceCount: 111 },
  { slug: 'statistics', label: 'Statistics', sourceCount: 196 },
  { slug: 'other', label: 'Other', sourceCount: 226 },
] as const;

export type OmniCatalogCategory = (typeof OMNI_CATEGORY_CATALOG)[number];

export const OMNI_CATALOG_TOTAL = 3916;
