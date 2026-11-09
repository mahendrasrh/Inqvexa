import type { MetadataRoute } from 'next';
import { ROUTES, SITE_URL, SOLUTIONS } from '@/lib/site';

const PRIORITY: Record<string, number> = { '/': 1, '/solutions': 0.9, '/services': 0.8, '/about': 0.7, '/industries': 0.7, '/contact': 0.7 };

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const core = ROUTES.map((p) => ({ url: SITE_URL + (p === '/' ? '/' : p), lastModified: now, changeFrequency: 'monthly' as const, priority: PRIORITY[p] ?? 0.3 }));
  const sol = SOLUTIONS.map((s) => ({
    url: `${SITE_URL}/solutions/${s.slug}`, lastModified: now, changeFrequency: 'monthly' as const,
    priority: s.slug === 'document-intelligence' || s.slug === 'ai-voice-agents' ? 0.9 : 0.8,
  }));
  return [...core, ...sol];
}
