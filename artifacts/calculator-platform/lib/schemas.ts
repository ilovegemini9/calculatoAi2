import { siteConfig } from '@/config/site';
import type { CalculatorMeta } from '@/config/calculators';
import { CATEGORY_LABELS } from '@/config/calculators';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org', '@type': 'Organization', name: siteConfig.name,
    url: siteConfig.url, logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon.svg` },
    description: siteConfig.description, sameAs: [],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org', '@type': 'WebSite', name: siteConfig.name,
    url: siteConfig.url, description: siteConfig.description, inLanguage: 'en-US',
    copyrightYear: new Date().getFullYear(),
  };
}

export function calculatorSchema(calc: CalculatorMeta) {
  const keywords = Array.isArray(calc.keywords) ? calc.keywords : [];
  return {
    '@context': 'https://schema.org', '@type': ['WebApplication', 'SoftwareApplication'],
    name: calc.name, url: `${siteConfig.url}/${calc.slug}-calculator`, description: calc.description,
    applicationCategory: 'UtilityApplication', applicationSubCategory: CATEGORY_LABELS[calc.category] ?? calc.category,
    operatingSystem: 'All', browserRequirements: 'Requires JavaScript', inLanguage: 'en-US',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    provider: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
    keywords: keywords.join(', '),
  };
}

export function breadcrumbSchema(items: { name: string; url?: string }[]) {
  const safeItems = Array.isArray(items) ? items : [];
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: safeItems.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, ...(item.url ? { item: item.url } : {}) })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: items.filter(Boolean).map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
  };
}

export function howToSchema(calc: CalculatorMeta, steps: string[]) {
  if (!Array.isArray(steps) || steps.length === 0) return null;
  const estimatedMinutes = Math.max(2, steps.length * 2);
  return {
    '@context': 'https://schema.org', '@type': 'HowTo', name: `How to use the ${calc.name}`,
    description: `Step-by-step guide to using the free online ${calc.name}.`, totalTime: `PT${estimatedMinutes}M`,
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
    tool: { '@type': 'HowToTool', name: calc.name },
    step: steps.filter((text) => typeof text === 'string').map((text, i) => ({
      '@type': 'HowToStep', position: i + 1, name: text.length > 60 ? text.slice(0, 57) + '…' : text,
      text, url: `${siteConfig.url}/${calc.slug}-calculator#step-${i + 1}`,
    })),
  };
}

export function itemListSchema(items: { name: string; slug: string; description: string }[], listName = 'Related Calculators') {
  if (!Array.isArray(items) || items.length === 0) return null;
  return {
    '@context': 'https://schema.org', '@type': 'ItemList', name: listName, numberOfItems: items.length,
    itemListElement: items.filter(Boolean).map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, description: item.description, url: `${siteConfig.url}/${item.slug}-calculator` })),
  };
}

export function articleSchema({ title, description, url, datePublished, dateModified }: { title: string; description: string; url: string; datePublished: string; dateModified: string }) {
  return {
    '@context': 'https://schema.org', '@type': 'Article', headline: title, description, url, datePublished, dateModified,
    author: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
    publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url, logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon.svg` } },
    inLanguage: 'en-US', isAccessibleForFree: true,
  };
}

export function jsonLd(...schemas: (object | null | undefined)[]) {
  return schemas.filter((s): s is object => s != null).map((s) => JSON.stringify(s));
}

export function calcCategoryLabel(calc: CalculatorMeta) {
  return CATEGORY_LABELS[calc.category] ?? calc.category;
}
