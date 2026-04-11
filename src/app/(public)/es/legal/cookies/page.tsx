// ============================================================================
// RETIRU · Política de cookies — /es/legal/cookies
// ============================================================================

import Link from 'next/link';
import { cookiesES } from '@/lib/seo/page-metadata';

export const metadata = cookiesES;

export default function CookiesPage() {
  return (
    <div className="container-narrow py-12">
      <nav className="mb-8 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
        <span>›</span>
        <span className="text-foreground">Política de cookies</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
        Política de cookies
      </h1>
      <p className="text-muted-foreground mb-12">Última actualización: marzo 2025</p>

      <div className="prose prose-sand max-w-none space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">¿Qué son las cookies?</h2>
          <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestra web. Nos permiten recordar tus preferencias, mantener tu sesión y mejorar la experiencia de uso.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Cookies que utilizamos</h2>
          <p>Utilizamos cookies técnicas necesarias para el funcionamiento del sitio (sesión, idioma, seguridad), cookies de análisis para entender cómo se usa la plataforma, y cookies de terceros como Stripe para el procesamiento de pagos.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">Gestión de cookies</h2>
          <p>Puedes configurar tu navegador para rechazar o eliminar cookies. Ten en cuenta que desactivar ciertas cookies puede afectar al funcionamiento de la plataforma.</p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-sand-200 flex flex-wrap gap-4">
        <Link href="/es/legal/terminos" className="text-sm text-terracotta-600 hover:underline">
          Términos y condiciones
        </Link>
        <Link href="/es/legal/privacidad" className="text-sm text-terracotta-600 hover:underline">
          Política de privacidad
        </Link>
      </div>
    </div>
  );
}
