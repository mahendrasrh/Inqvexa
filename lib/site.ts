export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://inqvexa.com').replace(/\/$/, '');

export const ROUTES = ['/', '/about', '/solutions', '/services', '/industries', '/contact', '/privacy-policy', '/terms', '/cookie-policy', '/security'] as const;

// Order matters: tabs, home cards, footer and related links all use it.
export const SOLUTIONS = [
  { slug: 'ai-intelligent-technology', name: 'AI & Intelligent Technology' },
  { slug: 'document-intelligence', name: 'Document Intelligence' },
  { slug: 'ai-voice-agents', name: 'AI Voice Agents' },
  { slug: 'supply-chain', name: 'Supply Chain & Operations' },
  { slug: 'software-saas', name: 'Software & SaaS' },
  { slug: 'digital-transformation', name: 'Digital Transformation' },
] as const;
