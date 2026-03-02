// ============================================================================
// RETIRU · 404 — Página no encontrada
// ============================================================================

import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif", background: '#faf8f5', color: '#2d2319' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          {/* Logo */}
          <Link href="/es" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3rem' }}>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '32px', color: '#c85a30', letterSpacing: '-0.02em' }}>retiru</span>
            <span style={{ width: '8px', height: '8px', background: '#c85a30', borderRadius: '50%', marginBottom: '-2px' }} />
          </Link>

          <p style={{ fontSize: '80px', lineHeight: 1, margin: '0 0 1rem', opacity: 0.15, fontFamily: "'DM Serif Display', Georgia, serif" }}>404</p>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(24px, 3vw, 32px)', margin: '0 0 0.75rem' }}>
            Página no encontrada
          </h1>
          <p style={{ color: '#7a6b5d', maxWidth: '420px', lineHeight: 1.7, fontSize: '15px', margin: '0 0 2rem' }}>
            Lo sentimos, la página que buscas no existe o ha sido movida. Pero hay muchas experiencias esperándote.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              href="/es"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#c85a30', color: 'white', fontWeight: 600, padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', transition: 'background 0.2s' }}
            >
              Ir al inicio
            </Link>
            <Link
              href="/es/buscar"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', color: '#2d2319', fontWeight: 600, padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', border: '1px solid #e5ddd4' }}
            >
              Explorar retiros
            </Link>
            <Link
              href="/es/centros-retiru"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', color: '#2d2319', fontWeight: 600, padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', border: '1px solid #e5ddd4' }}
            >
              Ver centros
            </Link>
          </div>

          <p style={{ marginTop: '3rem', fontSize: '13px', color: '#a09383' }}>
            <Link href="/en" style={{ color: '#a09383', textDecoration: 'underline' }}>English version</Link>
            {' · '}
            <Link href="/es/contacto" style={{ color: '#a09383', textDecoration: 'underline' }}>Contacto</Link>
          </p>
        </div>
      </body>
    </html>
  );
}
