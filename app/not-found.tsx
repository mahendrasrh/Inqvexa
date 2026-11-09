import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: { absolute: 'Page not found | INQVEXA' }, robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <div style={{ maxWidth: '100%', overflowX: 'clip' }}>
      <SiteHeader />
      <section style={{ position: 'relative', padding: '96px 28px', background: 'radial-gradient(110% 85% at 80% 0%,rgba(79,124,255,.2),transparent 58%),radial-gradient(80% 70% at 4% 100%,rgba(226,88,34,.15),transparent 62%),#07111F', minHeight: '60vh' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, letterSpacing: '.13em', textTransform: 'uppercase', color: '#E25822' }}>Error 404</div>
          <h1 style={{ margin: '14px 0 0', fontSize: 'clamp(38px,5vw,64px)', lineHeight: 1.04, letterSpacing: '-.034em', fontWeight: 800, color: '#fff' }}>This page doesn’t exist.</h1>
          <p style={{ margin: '20px auto 0', maxWidth: 560, fontSize: 18.5, lineHeight: 1.65, color: '#A9B7C9' }}>The link may be outdated or mistyped. Explore our solutions or head back to the homepage.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
            <Link href="/" data-btn="primary" style={{ background: '#E25822', color: '#fff', fontWeight: 700, fontSize: 16, padding: '15px 26px', borderRadius: 12, boxShadow: '0 10px 30px rgba(226,88,34,.3)', textDecoration: 'none' }}>Back to Home →</Link>
            <Link href="/solutions" data-btn="ghost" style={{ border: '1px solid rgba(255,255,255,.22)', color: '#E8EDF5', fontWeight: 600, fontSize: 16, padding: '15px 26px', borderRadius: 12, textDecoration: 'none' }}>Explore Solutions</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
