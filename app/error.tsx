'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section style={{ padding: '120px 28px', background: '#07111F', minHeight: '70vh', textAlign: 'center' }}>
      <h1 style={{ margin: 0, fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>Something went wrong.</h1>
      <p style={{ margin: '16px auto 0', maxWidth: 520, fontSize: 17, lineHeight: 1.6, color: '#A9B7C9' }}>Please try again. If the problem continues, contact us at karthik.bm@inqvexa.com.</p>
      <button onClick={reset} data-btn="primary" style={{ marginTop: 28, background: '#E25822', color: '#fff', border: 'none', fontWeight: 700, fontSize: 16, padding: '15px 26px', borderRadius: 12, cursor: 'pointer' }}>Try again</button>
    </section>
  );
}
